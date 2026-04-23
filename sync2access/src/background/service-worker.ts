// ============================================================
// Sync2Access Extension - Service Worker (Background Script)
// Main entry point for the extension's background logic.
// Handles message routing, lifecycle events, logout prevention,
// share-data staging, and webpage integrations.
// Reverse-engineered from minified source v1.7.0
// ============================================================

import { createShare } from './api';
import { encryptCookies, verifySignature } from './crypto';
import * as logoutPrevention from './logout-prevention';
import * as profileManager from './profile-manager';
import { initializeDnrRules, updateLogoutRules } from './dnr-rules';
import {
  BYPASS_TOKEN_PARAM,
  BYPASS_TOKEN_TTL_MS,
  MESSAGE_RATE_LIMIT_MAX,
  MESSAGE_RATE_LIMIT_WINDOW_MS,
  SHARE_DATA_TTL_MS,
} from '../shared/constants';
import type { CookieData, EncryptedPayload, ExtensionMessage, ShareRequest } from '../shared/types';

interface BypassTokenRecord {
  domain: string;
  expiresAt: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface PendingShareData {
  encryptedPayload: EncryptedPayload;
  passwordVerifier: string;
  cookieCount: number;
  localStorageCount: number;
  domain: string;
  expiresInHours?: number;
  maxAccess?: number | null;
  redirectUrl?: string | null;
  nonce: string;
  createdAt: number;
}

const bypassTokens = new Map<string, BypassTokenRecord>();
const rateLimits = new Map<string, RateLimitRecord>();

function cleanupExpiredBypassTokens(): void {
  const now = Date.now();
  for (const [token, data] of bypassTokens.entries()) {
    if (now > data.expiresAt) {
      bypassTokens.delete(token);
    }
  }
}

function generateBypassToken(domain: string): string {
  const token = crypto.randomUUID();
  bypassTokens.set(token, {
    domain,
    expiresAt: Date.now() + BYPASS_TOKEN_TTL_MS,
  });
  cleanupExpiredBypassTokens();
  return token;
}

function validateAndConsumeBypassToken(token: string, domain: string): boolean {
  const record = bypassTokens.get(token);
  const exists = Boolean(record);
  const isFresh = record ? Date.now() <= record.expiresAt : false;
  const matchesDomain = record ? record.domain === domain : false;

  if (exists) {
    bypassTokens.delete(token);
  }

  return exists && isFresh && matchesDomain;
}

function isRateLimited(action: string, origin: string): boolean {
  const key = `${origin}:${action}`;
  const now = Date.now();
  const record = rateLimits.get(key);

  if (!record || now > record.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + MESSAGE_RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (record.count >= MESSAGE_RATE_LIMIT_MAX) {
    return true;
  }

  record.count += 1;
  return false;
}

function normalizeSameSiteToChrome(
  sameSite?: string
): chrome.cookies.SameSiteStatus | undefined {
  if (!sameSite) return undefined;

  const mapping: Record<string, chrome.cookies.SameSiteStatus> = {
    no_restriction: 'no_restriction',
    lax: 'lax',
    strict: 'strict',
    unspecified: 'unspecified',
    None: 'no_restriction',
    Lax: 'lax',
    Strict: 'strict',
  };

  return mapping[sameSite] ?? 'unspecified';
}

function buildCookieUrl(cookie: CookieData): string {
  const path = cookie.path || '/';
  return `http${cookie.secure ? 's' : ''}://${cookie.domain.replace(/^\./, '')}${path}`;
}

async function importCookiesIntoBrowser(
  cookies: CookieData[]
): Promise<{ success: boolean; imported: number; failed: number; error?: string }> {
  if (!Array.isArray(cookies)) {
    return { success: false, imported: 0, failed: 0, error: 'Invalid cookies data' };
  }

  if (cookies.length === 0) {
    return { success: true, imported: 0, failed: 0 };
  }

  let imported = 0;
  let failed = 0;
  const now = Date.now() / 1000;

  for (const cookie of cookies) {
    try {
      if (!cookie.name || typeof cookie.name !== 'string') {
        failed += 1;
        continue;
      }

      if (cookie.value === undefined || cookie.value === null) {
        failed += 1;
        continue;
      }

      if (!cookie.domain || typeof cookie.domain !== 'string') {
        failed += 1;
        continue;
      }

      if (cookie.expirationDate && cookie.expirationDate < now) {
        failed += 1;
        continue;
      }

      const path = cookie.path || '/';
      const isHostCookie = cookie.name.startsWith('__Host-');

      if (isHostCookie) {
        if (!cookie.secure || path !== '/') {
          failed += 1;
          continue;
        }
      }

      if (cookie.name.startsWith('__Secure-') && !cookie.secure) {
        failed += 1;
        continue;
      }

      await chrome.cookies.set({
        url: buildCookieUrl({ ...cookie, path }),
        name: cookie.name,
        value: cookie.value,
        domain: isHostCookie ? undefined : cookie.domain,
        path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: normalizeSameSiteToChrome(cookie.sameSite),
        expirationDate: cookie.expirationDate,
      });

      imported += 1;
    } catch (error) {
      console.error(`Failed to import cookie ${cookie.name}:`, error);
      failed += 1;
    }
  }

  return { success: failed === 0, imported, failed };
}

async function captureLocalStorage(tabId: number): Promise<Record<string, string> | null> {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: () => {
        const snapshot: Record<string, string> = {};
        for (let index = 0; index < window.localStorage.length; index += 1) {
          const key = window.localStorage.key(index);
          if (key !== null) {
            snapshot[key] = window.localStorage.getItem(key) ?? '';
          }
        }
        return snapshot;
      },
    });

    return (result?.result as Record<string, string> | undefined) ?? null;
  } catch {
    return null;
  }
}

async function waitForTabCompletion(tabId: number): Promise<void> {
  await new Promise<void>((resolve) => {
    const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }, 10_000);
  });
}

async function importLocalStorageForDomain(
  domain: string,
  localStorageData: Record<string, string>
): Promise<{ success: boolean; imported?: number; error?: string }> {
  if (!domain || !localStorageData || typeof localStorageData !== 'object') {
    return { success: false, error: 'Invalid parameters' };
  }

  try {
    const origin = `https://${domain}`;
    const existingTabs = await chrome.tabs.query({ url: `${origin}/*` });

    let createdTab = false;
    let tabId = existingTabs[0]?.id;
    if (!tabId) {
      const tab = await chrome.tabs.create({ url: origin, active: false });
      if (!tab.id) {
        return { success: false, error: 'Failed to create tab' };
      }

      tabId = tab.id;
      createdTab = true;
      await waitForTabCompletion(tabId);
    }

    const entries = Object.entries(localStorageData);
    await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: (pairs: Array<[string, string]>) => {
        for (const [key, value] of pairs) {
          window.localStorage.setItem(key, value);
        }
      },
      args: [entries],
    });

    // Cleanup: close tab if we created it
    if (createdTab && tabId) {
      setTimeout(() => chrome.tabs.remove(tabId!).catch(() => {}), 2000);
    }

    return { success: true, imported: entries.length };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import localStorage',
    };
  }
}

async function storeShareData(message: ExtensionMessage): Promise<{ success: boolean; nonce?: string; error?: string }> {
  try {
    // Pre-check session storage quota
    const bytesInUse = await chrome.storage.session.getBytesInUse();
    const quota = chrome.storage.session.QUOTA_BYTES ?? 10485760;
    if (bytesInUse > quota * 0.9) {
      return { success: false, error: 'Session storage nearly full. Please try again later.' };
    }

    const nonce = crypto.randomUUID();
    const cookies = (message.cookies as CookieData[]) || [];
    const localStorageData = message.localStorage as Record<string, string> | undefined;
    const includeLocalStorage = localStorageData && Object.keys(localStorageData).length > 0;

    const { payload, passwordVerifier } = await encryptCookies(
      cookies,
      message.password as string | undefined,
      includeLocalStorage ? localStorageData : undefined
    );

    const stagedShare: PendingShareData = {
      encryptedPayload: payload,
      passwordVerifier,
      cookieCount: cookies.length,
      localStorageCount: includeLocalStorage ? Object.keys(localStorageData!).length : 0,
      domain: message.domain as string,
      expiresInHours: message.expiresInHours as number | undefined,
      maxAccess: (message.maxAccess as number | null | undefined) ?? null,
      redirectUrl: (message.redirectUrl as string | null | undefined) ?? null,
      nonce,
      createdAt: Date.now(),
    };

    await chrome.storage.session.set({ [`pendingShare_${nonce}`]: stagedShare });
    return { success: true, nonce };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to store share data',
    };
  }
}

function isAuthorizedShareOrigin(origin?: string): boolean {
  if (!origin) return false;

  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname;
    return (
      (hostname === 'localhost' && parsed.port === '4200') ||
      hostname === 'friendshouse.io.vn' ||
      hostname.endsWith('.friendshouse.io.vn')
    );
  } catch {
    return false;
  }
}

async function getShareData(
  nonce: string,
  senderOrigin?: string
): Promise<{ success: boolean; data?: PendingShareData; error?: string }> {
  if (senderOrigin !== undefined && !isAuthorizedShareOrigin(senderOrigin)) {
    return { success: false, error: 'Unauthorized origin' };
  }

  if (!nonce || typeof nonce !== 'string') {
    return { success: false, error: 'Missing or invalid nonce' };
  }

  const key = `pendingShare_${nonce}`;
  const pendingShare = (await chrome.storage.session.get(key))[key] as PendingShareData | undefined;

  if (!pendingShare) {
    return { success: false, error: 'Share data not found or expired' };
  }

  if (Date.now() - pendingShare.createdAt > SHARE_DATA_TTL_MS) {
    await chrome.storage.session.remove(key);
    return { success: false, error: 'Share data expired' };
  }

  return { success: true, data: pendingShare };
}

async function handleConfirmedLogout(domain: string, pathname: string): Promise<void> {
  await logoutPrevention.addLearnedPattern(domain, pathname);

  const defaultProfile = await profileManager.getDefaultProfile(domain);

  if (defaultProfile) {
    await profileManager.switchProfile(domain, defaultProfile.id);
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon48.png',
      title: 'Switched to Default Profile',
      message: `Restored original cookies for ${domain}`,
    });
  } else {
    const removed = await logoutPrevention.clearCookiesForDomain(domain);
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon48.png',
      title: 'Logged Out',
      message: `Cleared ${removed} cookies for ${domain}`,
    });
  }

  await logoutPrevention.incrementBlockedCount();
}

async function initialize(): Promise<void> {
  await initializeDnrRules(logoutPrevention.getSettings);
}

// Top-level init runs on every SW wake (install, startup, idle-wake)
initialize().catch((error) => {
  console.error('[Sync2Access] Failed to initialize:', error);
});

chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return;

  try {
    const url = new URL(details.url);
    const token = url.searchParams.get(BYPASS_TOKEN_PARAM);

    if (!token) return;

    validateAndConsumeBypassToken(token, url.hostname);
    url.searchParams.delete(BYPASS_TOKEN_PARAM);

    await chrome.scripting.executeScript({
      target: { tabId: details.tabId },
      func: (cleanUrl: string) => {
        window.history.replaceState(null, '', cleanUrl);
      },
      args: [url.toString()],
    });
  } catch (error) {
    console.debug('[Sync2Access] Failed to clean bypass token:', error);
  }
});

async function handleMessage(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
  senderOrigin?: string
): Promise<unknown> {
  switch (message.action) {
    case 'ping':
      return { status: 'ok' };

    case 'getLogoutPreventionSettings':
    case 'getLogoutSettings':
      return logoutPrevention.getSettings();

    case 'setLogoutPreventionEnabled':
    case 'setLogoutEnabled': {
      const enabled = message.enabled as boolean;
      await logoutPrevention.setEnabled(enabled);
      const settings = await logoutPrevention.getSettings();
      await updateLogoutRules(settings.enabled, settings.excludedDomains);
      return { success: true };
    }

    case 'setDomainExclusion': {
      const domain = message.domain as string;
      const include = message.include as boolean;
      await logoutPrevention.setDomainExclusion(domain, include);
      const settings = await logoutPrevention.getSettings();
      await updateLogoutRules(settings.enabled, settings.excludedDomains);
      return { success: true };
    }

    case 'toggleLogoutDomain': {
      const domain = message.domain as string;
      const enabled = message.enabled as boolean;
      await logoutPrevention.setDomainExclusion(domain, enabled);
      const settings = await logoutPrevention.getSettings();
      await updateLogoutRules(settings.enabled, settings.excludedDomains);
      return { success: true };
    }

    case 'isOnDefaultProfile': {
      const domain = message.domain as string;
      const profiles = await profileManager.getProfiles(domain);
      if (profiles.length === 0) {
        return { isOnDefault: true };
      }

      const activeProfileId = await profileManager.getActiveProfileId(domain);
      if (!activeProfileId) {
        return { isOnDefault: true };
      }

      const activeProfile = profiles.find((profile) => profile.id === activeProfileId);
      return { isOnDefault: activeProfile?.name === 'Default' };
    }

    case 'generateBypassToken':
      return { token: generateBypassToken(message.domain as string) };

    case 'validateBypassToken':
      return {
        valid: validateAndConsumeBypassToken(
          message.token as string,
          message.domain as string
        ),
      };

    case 'handleLogoutConfirmed': {
      const domain = message.domain as string;
      const pathname = message.pathname as string;
      await handleConfirmedLogout(domain, pathname);
      return { success: true };
    }

    case 'confirmLogoutFromPage': {
      const logoutUrl = new URL(message.url as string);
      await handleConfirmedLogout(logoutUrl.hostname, logoutUrl.pathname);
      return { success: true };
    }

    case 'handleLogoutDeclined':
    case 'declineLogoutFromPage': {
      const domain = message.domain as string;
      const pathname = message.pathname as string;
      await logoutPrevention.addWhitelistedUrl(domain, pathname);
      return { success: true };
    }

    case 'getProfiles':
      return { profiles: await profileManager.getProfiles(message.domain as string) };

    case 'getActiveProfile':
      return { profileId: await profileManager.getActiveProfileId(message.domain as string) };

    case 'saveProfile':
      await profileManager.saveProfile(message.profile as any);
      return { success: true };

    case 'createProfile': {
      const profile = await profileManager.createProfile(
        message.name as string,
        message.domain as string,
        message.cookies as CookieData[],
        message.sourceShareId as string | undefined
      );
      return { success: true, profile };
    }

    case 'deleteProfile':
      await profileManager.deleteProfile(message.domain as string, message.profileId as string);
      return { success: true };

    case 'switchProfile':
      await profileManager.switchProfile(message.domain as string, message.profileId as string);
      return { success: true };

    case 'saveDefaultProfile': {
      const profile = await profileManager.saveDefaultProfile(message.domain as string);
      return { success: true, profile };
    }

    case 'exportProfiles': {
      const data = await profileManager.exportProfiles(message.domains as string[] | undefined);
      return { success: true, data };
    }

    case 'importProfiles': {
      const result = await profileManager.importProfiles(message.data as any);
      return { success: true, result };
    }

    case 'getProfileByShareId': {
      const profiles = await profileManager.getProfiles(message.domain as string);
      const profile = profiles.find((item) => item.sourceShareId === (message.shareId as string)) ?? null;
      return { profile };
    }

    case 'captureCurrentCookies':
      return { cookies: await profileManager.getCookiesForDomain(message.domain as string) };

    case 'getCookiesForDomain':
      return { cookies: await profileManager.getCookiesForDomain(message.domain as string) };

    case 'clearCookiesForDomain': {
      const removed = await logoutPrevention.clearCookiesForDomain(message.domain as string);
      return { success: true, removed };
    }

    case 'importCookies': {
      const cookies = message.cookies as CookieData[];
      const domain = message.domain as string;
      const timestamp = message.timestamp as number | undefined;
      const signature = message.signature as string | undefined;

      try {
        await profileManager.saveDefaultProfile(domain);
      } catch (error) {
        console.error('[Sync2Access] Failed to capture default profile before import:', error);
      }

      if (signature && timestamp) {
        const verification = await verifySignature({ domain, cookies, timestamp }, signature);
        if (!verification.valid) {
          return {
            success: false,
            imported: 0,
            failed: 0,
            error: verification.error || 'Invalid signature',
          };
        }
      }

      return importCookiesIntoBrowser(cookies);
    }

    case 'captureLocalStorage': {
      const tabId = message.tabId as number | undefined;
      if (!tabId) {
        return { success: false, error: 'No tab ID provided' };
      }

      const localStorageData = await captureLocalStorage(tabId);
      return { success: true, localStorage: localStorageData };
    }

    case 'importLocalStorage':
      return importLocalStorageForDomain(
        message.domain as string,
        message.localStorage as Record<string, string>
      );

    case 'storeShareData':
      return storeShareData(message);

    case 'getShareData':
      return getShareData(message.nonce as string, senderOrigin);

    case 'shareCookies': {
      const request: ShareRequest = {
        cookies: message.cookies as CookieData[],
        password: (message.password as string) || '',
        domain: message.domain as string,
        expiresInHours: message.expiresInHours as number | undefined,
        maxAccess: (message.maxAccess as number | null | undefined) ?? null,
        redirectUrl: (message.redirectUrl as string | null | undefined) ?? null,
        recaptchaToken: message.recaptchaToken as string | undefined,
      };

      const result = await createShare(request);
      return {
        success: true,
        shareId: (result as { shareId?: string }).shareId ?? result.id,
        ...result,
      };
    }

    case 'createShare': {
      const request = message.request as ShareRequest;
      const result = await createShare(request);
      return { success: true, ...result };
    }

    default:
      return { success: false, error: `Unknown action: ${message.action}` };
  }
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error(`[Sync2Access] Error handling "${message.action}":`, error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });

  return true;
});

chrome.runtime.onMessageExternal.addListener((message: ExtensionMessage, sender, sendResponse) => {
  const senderOrigin =
    (sender as chrome.runtime.MessageSender & { origin?: string }).origin ||
    (sender.url ? new URL(sender.url).origin : undefined);
  const rateLimitKey = senderOrigin || sender.id || 'unknown';

  if (isRateLimited(message.action, rateLimitKey)) {
    sendResponse({ success: false, error: 'Rate limit exceeded. Please try again later.' });
    return true;
  }

  if (message.action === 'ping') {
    sendResponse({ status: 'ok', installed: true });
    return true;
  }

  if (message.action === 'importCookies' || message.action === 'getShareData') {
    handleMessage(message, sender, senderOrigin)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    return true;
  }

  sendResponse({ success: false, error: 'Unknown action' });
  return false;
});

console.log('[Sync2Access] Service worker loaded.');

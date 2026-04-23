// ============================================================
// Sync2Access Extension - Logout Prevention Module
// Manages logout prevention settings, learned patterns, and
// whitelisted URLs in chrome.storage.local.
// Reverse-engineered from minified source v1.7.0
// ============================================================

import {
  LOGOUT_PREVENTION_STORAGE_KEY,
  MAX_LEARNED_PATTERNS_PER_DOMAIN,
  MAX_WHITELISTED_URLS_PER_DOMAIN,
} from '../shared/constants';
import type { LogoutPreventionSettings } from '../shared/types';

/** Default settings when none exist in storage */
const DEFAULT_SETTINGS: LogoutPreventionSettings = {
  enabled: true,
  excludedDomains: [],
  blockedCount: 0,
  learnedLogoutPatterns: {},
  whitelistedUrls: {},
};

/**
 * Check storage quota and throw if nearly exceeded (>= 95%).
 */
async function checkStorageQuota(): Promise<void> {
  const bytesInUse = await chrome.storage.local.getBytesInUse();
  const quotaBytes = chrome.storage.local.QUOTA_BYTES;
  if (bytesInUse >= quotaBytes * 0.95) {
    throw new Error('Storage quota nearly exceeded');
  }
}

/**
 * Get logout prevention settings from storage.
 * Returns defaults if not found or on error.
 */
export async function getSettings(): Promise<LogoutPreventionSettings> {
  try {
    const result = await chrome.storage.local.get(LOGOUT_PREVENTION_STORAGE_KEY);
    const stored = result[LOGOUT_PREVENTION_STORAGE_KEY] || {};
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      enabled: stored.enabled ?? true,
      excludedDomains: stored.excludedDomains || [],
      learnedLogoutPatterns: stored.learnedLogoutPatterns || {},
      whitelistedUrls: stored.whitelistedUrls || {},
    };
  } catch (error) {
    console.error('Failed to get logout prevention settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save logout prevention settings to storage.
 */
export async function saveSettings(settings: LogoutPreventionSettings): Promise<void> {
  try {
    await checkStorageQuota();
    await chrome.storage.local.set({ [LOGOUT_PREVENTION_STORAGE_KEY]: settings });
  } catch (error) {
    console.error('Failed to save logout prevention settings:', error);
    throw error;
  }
}

/**
 * Enable or disable logout prevention globally.
 */
export async function setEnabled(enabled: boolean): Promise<void> {
  const settings = await getSettings();
  settings.enabled = enabled;
  await saveSettings(settings);
}

/**
 * Set whether a domain is excluded from logout prevention.
 * @param domain - The domain to exclude/include
 * @param include - If true, remove from exclusion (enable protection). If false, add to exclusion.
 */
export async function setDomainExclusion(domain: string, include: boolean): Promise<void> {
  const settings = await getSettings();
  if (include) {
    // Remove from excluded (re-enable protection for this domain)
    settings.excludedDomains = settings.excludedDomains.filter((d) => d !== domain);
  } else {
    // Add to excluded (disable protection for this domain)
    if (!settings.excludedDomains.includes(domain)) {
      settings.excludedDomains.push(domain);
    }
  }
  await saveSettings(settings);
}

/**
 * Add a learned logout pattern for a domain.
 * Maintains a maximum of MAX_LEARNED_PATTERNS_PER_DOMAIN patterns per domain (FIFO).
 */
export async function addLearnedPattern(domain: string, pattern: string): Promise<void> {
  const settings = await getSettings();
  const normalizedPattern = pattern.toLowerCase();

  if (!settings.learnedLogoutPatterns[domain]) {
    settings.learnedLogoutPatterns[domain] = [];
  }

  // Don't add duplicates
  if (settings.learnedLogoutPatterns[domain].includes(normalizedPattern)) {
    return;
  }

  // FIFO: remove oldest if at capacity
  if (settings.learnedLogoutPatterns[domain].length >= MAX_LEARNED_PATTERNS_PER_DOMAIN) {
    settings.learnedLogoutPatterns[domain].shift();
  }

  settings.learnedLogoutPatterns[domain].push(normalizedPattern);
  await saveSettings(settings);
}

/**
 * Add a whitelisted URL pattern for a domain.
 * These URLs won't trigger the logout confirmation dialog.
 * Maintains a maximum of MAX_WHITELISTED_URLS_PER_DOMAIN per domain (FIFO).
 */
export async function addWhitelistedUrl(domain: string, pathname: string): Promise<void> {
  const settings = await getSettings();
  const normalizedPathname = pathname.toLowerCase();

  if (!settings.whitelistedUrls[domain]) {
    settings.whitelistedUrls[domain] = [];
  }

  // Don't add duplicates
  if (settings.whitelistedUrls[domain].includes(normalizedPathname)) {
    return;
  }

  // FIFO: remove oldest if at capacity
  if (settings.whitelistedUrls[domain].length >= MAX_WHITELISTED_URLS_PER_DOMAIN) {
    settings.whitelistedUrls[domain].shift();
  }

  settings.whitelistedUrls[domain].push(normalizedPathname);
  await saveSettings(settings);
}

/**
 * Increment the blocked logout attempt counter.
 */
export async function incrementBlockedCount(): Promise<void> {
  const settings = await getSettings();
  settings.blockedCount += 1;
  await saveSettings(settings);
}

/**
 * Clear all cookies for a given domain.
 * @returns Number of cookies removed
 */
export async function clearCookiesForDomain(domain: string): Promise<number> {
  const cookies = await chrome.cookies.getAll({ domain });
  let removed = 0;

  for (const cookie of cookies) {
    const url = `http${cookie.secure ? 's' : ''}://${cookie.domain.replace(/^\./, '')}${cookie.path}`;
    try {
      await chrome.cookies.remove({ url, name: cookie.name });
      removed++;
    } catch (error) {
      console.error(`Failed to remove cookie ${cookie.name}:`, error);
    }
  }

  return removed;
}

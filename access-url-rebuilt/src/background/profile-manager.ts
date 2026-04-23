// ============================================================
// Sync2Access Extension - Profile Manager
// Manages cookie profiles: create, save, switch, delete,
// import/export. Uses chrome.storage.local with per-domain
// locking to prevent race conditions.
// Reverse-engineered from minified source v1.7.0
// ============================================================

import {
  PROFILE_STORAGE_KEY,
  MAX_PROFILES_PER_DOMAIN,
  DEFAULT_PROFILE_NAME,
  STORAGE_QUOTA_WARNING_THRESHOLD,
} from '../shared/constants';
import type {
  Profile,
  ProfileStorage,
  ProfileExport,
  ProfileImportResult,
  CookieData,
} from '../shared/types';
import { canonicalizeDomain, filterCookiesByDomain } from '../shared/domain-utils';

// ---- Per-Domain Lock ----

/** Map of domain -> pending promise for serializing operations */
const domainLocks = new Map<string, Promise<unknown>>();

/**
 * Execute an async operation with per-domain locking to prevent race conditions.
 */
async function withDomainLock<T>(domain: string, fn: () => Promise<T>): Promise<T> {
  // Chain onto existing promise to create a true serial queue
  const prev = domainLocks.get(domain) ?? Promise.resolve();
  let releaseLock!: () => void;
  const gate = new Promise<void>(r => { releaseLock = r; });

  // Register our gate BEFORE awaiting — ensures next caller chains after us
  domainLocks.set(domain, gate);

  try {
    await prev;
    return await fn();
  } finally {
    releaseLock();
    if (domainLocks.get(domain) === gate) {
      domainLocks.delete(domain);
    }
  }
}

// ---- Per-Domain Switch Lock ----

const switchLocks = new Map<string, Promise<void>>();

// ---- Storage Helpers ----

const EMPTY_STORAGE: ProfileStorage = {
  profiles: {},
  activeProfiles: {},
};

/**
 * Check storage quota and warn/throw if exceeded.
 */
async function checkStorageQuota(): Promise<void> {
  const bytesInUse = await chrome.storage.local.getBytesInUse();
  const quotaBytes = chrome.storage.local.QUOTA_BYTES;

  if (bytesInUse > quotaBytes * STORAGE_QUOTA_WARNING_THRESHOLD) {
    console.warn(
      `[Storage] Quota warning: ${Math.round(bytesInUse / 1024)}KB / ${Math.round(quotaBytes / 1024)}KB used`
    );
  }

  if (bytesInUse >= quotaBytes) {
    throw new Error('Storage quota exceeded. Please delete old profiles to free space.');
  }
}

/**
 * Get the full profile storage object.
 */
export async function getProfileStorage(): Promise<ProfileStorage> {
  try {
    const result = await chrome.storage.local.get(PROFILE_STORAGE_KEY);
    return result[PROFILE_STORAGE_KEY] || EMPTY_STORAGE;
  } catch (error) {
    console.error('Failed to get profile storage:', error);
    return EMPTY_STORAGE;
  }
}

/**
 * Save the full profile storage object.
 */
async function saveProfileStorage(storage: ProfileStorage): Promise<void> {
  try {
    await checkStorageQuota();
    await chrome.storage.local.set({ [PROFILE_STORAGE_KEY]: storage });
  } catch (error) {
    console.error('Failed to save profile storage:', error);
    throw error;
  }
}

// ---- Profile ID Generation ----

/**
 * Generate a unique profile ID.
 */
function generateProfileId(): string {
  return `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ---- Cookie Helpers ----

/**
 * Normalize sameSite values from Chrome API format to storage format.
 */
function normalizeSameSiteFromChrome(sameSite?: string): string | undefined {
  // Match original source: drop 'unspecified' from snapshots (returns undefined)
  if (!sameSite || sameSite === 'unspecified') return undefined;
  const map: Record<string, string> = {
    no_restriction: 'no_restriction',
    lax: 'lax',
    strict: 'strict',
  };
  return map[sameSite];
}

/**
 * Normalize sameSite values from storage format to Chrome API format.
 */
function normalizeSameSiteToChrome(sameSite?: string): chrome.cookies.SameSiteStatus | undefined {
  if (!sameSite) return undefined;
  const map: Record<string, chrome.cookies.SameSiteStatus> = {
    no_restriction: 'no_restriction',
    lax: 'lax',
    strict: 'strict',
    unspecified: 'unspecified',
    None: 'no_restriction',
    Lax: 'lax',
    Strict: 'strict',
  };
  return map[sameSite];
}

/**
 * Get all cookies for a domain and return them as CookieData[].
 */
export async function getCookiesForDomain(domain: string): Promise<CookieData[]> {
  const canonical = canonicalizeDomain(domain);
  const raw = await chrome.cookies.getAll({ domain: canonical });
  const filtered = filterCookiesByDomain(raw, canonical);
  return filtered.map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: normalizeSameSiteFromChrome(cookie.sameSite),
    expirationDate: cookie.expirationDate,
    hostOnly: cookie.hostOnly,
    session: cookie.session,
  }));
}

// ---- Profile CRUD ----

/**
 * Get all profiles for a domain.
 */
export async function getProfiles(domain: string): Promise<Profile[]> {
  const storage = await getProfileStorage();
  return storage.profiles[domain] || [];
}

/**
 * Save (create or update) a profile.
 */
export async function saveProfile(profile: Profile): Promise<void> {
  await withDomainLock(profile.domain, async () => {
    const storage = await getProfileStorage();

    if (!storage.profiles[profile.domain]) {
      storage.profiles[profile.domain] = [];
    }

    const existingIndex = storage.profiles[profile.domain].findIndex((p) => p.id === profile.id);

    if (existingIndex >= 0) {
      // Update existing profile
      storage.profiles[profile.domain][existingIndex] = profile;
    } else {
      // Create new profile
      if (storage.profiles[profile.domain].length >= MAX_PROFILES_PER_DOMAIN) {
        throw new Error('Maximum 10 profiles per domain');
      }
      storage.profiles[profile.domain].push(profile);
    }

    await saveProfileStorage(storage);
  });
}

/**
 * Delete a profile by ID. Cannot delete the Default profile.
 */
export async function deleteProfile(domain: string, profileId: string): Promise<void> {
  await withDomainLock(domain, async () => {
    const storage = await getProfileStorage();

    if (storage.profiles[domain]) {
      const profile = storage.profiles[domain].find((p) => p.id === profileId);
      if (profile && profile.name.toLowerCase() === DEFAULT_PROFILE_NAME.toLowerCase()) {
        throw new Error('Cannot delete the default profile');
      }

      storage.profiles[domain] = storage.profiles[domain].filter((p) => p.id !== profileId);

      if (storage.profiles[domain].length === 0) {
        delete storage.profiles[domain];
      }
    }

    // Clear active profile if it was the deleted one
    if (storage.activeProfiles[domain] === profileId) {
      delete storage.activeProfiles[domain];
    }

    await saveProfileStorage(storage);
  });
}

/**
 * Get the active profile ID for a domain.
 */
export async function getActiveProfileId(domain: string): Promise<string | null> {
  const storage = await getProfileStorage();
  return storage.activeProfiles[domain] || null;
}

/**
 * Set the active profile ID for a domain.
 */
async function setActiveProfileId(domain: string, profileId: string): Promise<void> {
  await withDomainLock(domain, async () => {
    const storage = await getProfileStorage();
    storage.activeProfiles[domain] = profileId;
    await saveProfileStorage(storage);
  });
}

/**
 * Get a profile by ID.
 */
export async function getProfileById(domain: string, profileId: string): Promise<Profile | null> {
  const profiles = await getProfiles(domain);
  return profiles.find((p) => p.id === profileId) || null;
}

/**
 * Get the Default profile for a domain, or null if it doesn't exist.
 */
export async function getDefaultProfile(domain: string): Promise<Profile | null> {
  const profiles = await getProfiles(domain);
  return profiles.find((p) => p.name === DEFAULT_PROFILE_NAME) || null;
}

// ---- Profile Operations ----

/**
 * Save current cookies as the Default profile for a domain.
 * Creates the Default profile if it doesn't exist.
 */
export async function saveDefaultProfile(domain: string): Promise<Profile> {
  const currentCookies = await getCookiesForDomain(domain);
  const existingDefault = await getDefaultProfile(domain);

  if (existingDefault) {
    // Update existing Default profile
    existingDefault.cookies = currentCookies;
    existingDefault.updatedAt = new Date().toISOString();
    await saveProfile(existingDefault);
    return existingDefault;
  } else {
    // Create new Default profile
    return createProfile(DEFAULT_PROFILE_NAME, domain, currentCookies);
  }
}

/**
 * Create a new profile with the given cookies.
 */
export async function createProfile(
  name: string,
  domain: string,
  cookies: CookieData[],
  sourceShareId?: string
): Promise<Profile> {
  // Validate cookie domains — only keep cookies matching the target domain
  const canonical = canonicalizeDomain(domain);
  const validCookies = cookies.filter(c => {
    if (!c.domain) return true; // Allow cookies without domain (e.g., from header string import)
    const d = c.domain.toLowerCase().replace(/^\./, '');
    const t = canonical.toLowerCase();
    return d === t || t.endsWith('.' + d) || d.endsWith('.' + t);
  });

  const profile: Profile = {
    id: generateProfileId(),
    name,
    domain,
    cookies: validCookies,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceShareId,
  };

  await saveProfile(profile);
  return profile;
}

/**
 * Switch to a different profile for a domain.
 * This will:
 * 1. Clear all existing cookies for the domain
 * 2. Set the cookies from the target profile
 * 3. Update the active profile reference
 */
export async function switchProfile(domain: string, profileId: string): Promise<void> {
  // True serial queue — prevents concurrent switches from racing
  const prev = switchLocks.get(domain) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>(r => { release = r; });
  switchLocks.set(domain, gate);

  try {
    await prev;
    await performSwitch(domain, profileId);
  } finally {
    release();
    if (switchLocks.get(domain) === gate) switchLocks.delete(domain);
  }
}

async function performSwitch(domain: string, profileId: string): Promise<void> {
  const profile = await getProfileById(domain, profileId);
  if (!profile) {
    throw new Error('Profile not found');
  }

  // Step 1: Clear all existing cookies for the domain (canonicalized)
  const canonical = canonicalizeDomain(domain);
  const allCookies = await chrome.cookies.getAll({ domain: canonical });
  const existingCookies = filterCookiesByDomain(allCookies, canonical);
  for (const cookie of existingCookies) {
    const url = `http${cookie.secure ? 's' : ''}://${cookie.domain.replace(/^\./, '')}${cookie.path}`;
    try {
      await chrome.cookies.remove({ url, name: cookie.name });
    } catch (error) {
      console.error(`Failed to remove cookie ${cookie.name}:`, error);
    }
  }

  // Step 2: Set cookies from the target profile
  const now = Date.now() / 1000;
  for (const cookie of profile.cookies) {
    // Validate cookie
    if (!cookie.name || typeof cookie.name !== 'string') {
      console.error('Skipping cookie: missing or invalid name');
      continue;
    }
    if (cookie.value === undefined || cookie.value === null) {
      console.error(`Skipping cookie ${cookie.name}: missing or invalid value`);
      continue;
    }
    if (cookie.expirationDate && cookie.expirationDate < now) {
      console.error(
        `Skipping cookie ${cookie.name}: already expired (expiry: ${cookie.expirationDate}, now: ${now})`
      );
      continue;
    }

    const path = cookie.path || '/';
    const url = `http${cookie.secure ? 's' : ''}://${cookie.domain.replace(/^\./, '')}${path}`;
    const isHostCookie = cookie.name.startsWith('__Host-');

    try {
      await chrome.cookies.set({
        url,
        name: cookie.name,
        value: cookie.value,
        domain: isHostCookie ? undefined : cookie.domain,
        path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: normalizeSameSiteToChrome(cookie.sameSite),
        expirationDate: cookie.expirationDate,
      });
    } catch (error) {
      console.error(`Failed to set cookie ${cookie.name}:`, error);
    }
  }

  // Step 3: Update active profile
  await setActiveProfileId(domain, profileId);
}

// ---- Import/Export ----

/**
 * Validate a domain string.
 */
function isValidDomain(domain: string): boolean {
  if (!domain || typeof domain !== 'string') return false;

  let hostname: string;
  try {
    hostname = new URL(`http://${domain}`).hostname;
  } catch {
    return false;
  }

  const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
  return hostname.length <= 253 && domainRegex.test(hostname);
}

/**
 * Sanitize a profile name.
 */
function sanitizeProfileName(name: string | undefined): string {
  if (!name || typeof name !== 'string') return 'Unnamed Profile';
  return name.replace(/[<>'"&]/g, '').slice(0, 100).trim() || 'Unnamed Profile';
}

/**
 * Export profiles to a JSON format (v1).
 * If domains are specified, only export those. Otherwise export all.
 */
export async function exportProfiles(domains?: string[]): Promise<ProfileExport> {
  const allProfiles: Profile[] = [];

  if (domains && domains.length > 0) {
    for (const domain of domains) {
      const profiles = await getProfiles(domain);
      allProfiles.push(...profiles);
    }
  } else {
    const storage = await chrome.storage.local.get('profileStorage');
    const profileStorage = storage.profileStorage as ProfileStorage | undefined;
    if (profileStorage?.profiles) {
      for (const profiles of Object.values(profileStorage.profiles)) {
        allProfiles.push(...profiles);
      }
    }
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profiles: allProfiles,
  };
}

/**
 * Import profiles from a v1 export file.
 */
export async function importProfiles(data: ProfileExport): Promise<ProfileImportResult> {
  const result: ProfileImportResult = { imported: 0, skipped: 0, errors: [] };

  if (data.version !== 1) {
    result.errors.push('Unsupported export version');
    return result;
  }

  if (!Array.isArray(data.profiles)) {
    result.errors.push('Invalid profiles data');
    return result;
  }

  for (const profileData of data.profiles) {
    try {
      // Validate required fields
      if (!profileData.id || !profileData.name || !profileData.domain || !Array.isArray(profileData.cookies)) {
        result.errors.push(`Invalid profile structure: ${profileData.name || 'unknown'}`);
        result.skipped++;
        continue;
      }

      // Validate domain
      if (!isValidDomain(profileData.domain)) {
        result.errors.push(`Invalid domain format: ${profileData.domain}`);
        result.skipped++;
        continue;
      }

      const sanitizedName = sanitizeProfileName(profileData.name);
      const now = Date.now() / 1000;

      // Filter out expired cookies
      const validCookies = profileData.cookies.filter((cookie) => {
        if (!cookie.name || typeof cookie.name !== 'string') return false;
        if (cookie.value === undefined || cookie.value === null) return false;
        if (cookie.expirationDate && cookie.expirationDate < now) return false;
        return true;
      });

      // Check if domain already has max profiles
      const existingProfiles = await getProfiles(profileData.domain);
      if (existingProfiles.length >= MAX_PROFILES_PER_DOMAIN) {
        result.errors.push(`Domain ${profileData.domain} already has max profiles`);
        result.skipped++;
        continue;
      }

      // Create the profile with a new ID
      const newProfile: Profile = {
        ...profileData,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: sanitizedName,
        cookies: validCookies,
        updatedAt: new Date().toISOString(),
      };

      await saveProfile(newProfile);
      result.imported++;
    } catch (error) {
      result.errors.push(`Failed to import ${profileData.name}: ${(error as Error).message}`);
      result.skipped++;
    }
  }

  return result;
}

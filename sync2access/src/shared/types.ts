// ============================================================
// Sync2Access Extension - Shared Type Definitions
// Reverse-engineered from minified source v1.7.0
// ============================================================

// ---- Cookie Types ----

export interface CookieData {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: string;
  expirationDate?: number;
  hostOnly?: boolean;
  session?: boolean;
}

// ---- Encrypted Cookie Format (v2) ----

export interface EncryptedCookie {
  /** Cookie name */
  n: string;
  /** Encrypted value (base64) */
  v: string;
  /** IV (base64) */
  iv: string;
  /** Domain */
  d: string;
  /** Path */
  p: string;
  /** Secure flag */
  s?: boolean;
  /** HttpOnly flag */
  h?: boolean;
  /** SameSite attribute */
  ss?: string;
  /** Expiration date (epoch seconds) */
  e?: number;
}

export interface EncryptedPayload {
  version: 2;
  salt: string;
  cookies: EncryptedCookie[];
  hmac: string;
  /** Encrypted localStorage data (base64) */
  localStorage?: string;
  /** localStorage encryption IV (base64) */
  lsIv?: string;
}

// ---- Profile Types ----

export interface Profile {
  id: string;
  name: string;
  domain: string;
  cookies: CookieData[];
  createdAt: string;
  updatedAt: string;
  sourceShareId?: string;
}

export interface ProfileStorage {
  profiles: { [domain: string]: Profile[] };
  activeProfiles: { [domain: string]: string };
}

export interface ProfileExport {
  version: 1;
  exportedAt: string;
  profiles: Profile[];
}

export interface ProfileImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// ---- Logout Prevention Types ----

export interface LogoutPreventionSettings {
  enabled: boolean;
  excludedDomains: string[];
  blockedCount: number;
  learnedLogoutPatterns: { [domain: string]: string[] };
  whitelistedUrls: { [domain: string]: string[] };
}

// ---- API Types ----

export interface ShareRequest {
  cookies: CookieData[];
  password: string;
  domain: string;
  expiresInHours?: number;
  maxAccess?: number | null;
  recaptchaToken?: string;
  redirectUrl?: string | null;
}

export interface ShareResponse {
  id: string;
  url: string;
  [key: string]: unknown;
}

export interface SignatureVerificationResult {
  valid: boolean;
  error?: string;
}

// ---- Crypto Types ----

export interface DerivedKeys {
  aesKey: CryptoKey;
  hmacKey: CryptoKey;
  verifier: string;
}

export interface EncryptionResult {
  ciphertext: string;
  iv: string;
}

// ---- Message Types ----

export type MessageAction =
  | 'importCookies'
  | 'getProfileByShareId'
  | 'switchProfile'
  | 'createProfile'
  | 'importLocalStorage'
  | 'getShareData'
  | 'isOnDefaultProfile'
  | 'generateBypassToken'
  | 'confirmLogoutFromPage'
  | 'declineLogoutFromPage'
  | 'showLogoutConfirmation'
  | 'getLogoutPreventionSettings'
  | 'setLogoutPreventionEnabled'
  | 'setDomainExclusion'
  | 'getProfiles'
  | 'saveProfile'
  | 'deleteProfile'
  | 'getActiveProfile'
  | 'saveDefaultProfile'
  | 'exportProfiles'
  | 'importProfiles'
  | 'getCookiesForDomain'
  | 'clearCookiesForDomain'
  | 'createShare'
  | 'shareCookies'
  | 'ping'
  | 'getLogoutSettings'
  | 'setLogoutEnabled'
  | 'toggleLogoutDomain'
  | 'handleLogoutConfirmed'
  | 'handleLogoutDeclined'
  | 'validateBypassToken'
  | 'captureLocalStorage'
  | 'storeShareData'
  | 'captureCurrentCookies';

export interface ExtensionMessage {
  action: MessageAction;
  [key: string]: unknown;
}

// ---- Content Script Message Types ----

export type ContentScriptMessageType =
  | 'ACCESS_URL_PING'
  | 'ACCESS_URL_PONG'
  | 'ACCESS_URL_READY'
  | 'ACCESS_URL_IMPORT_COOKIES'
  | 'ACCESS_URL_IMPORT_RESULT'
  | 'ACCESS_URL_GET_PROFILE_BY_SHARE_ID'
  | 'ACCESS_URL_PROFILE_RESULT'
  | 'ACCESS_URL_SWITCH_PROFILE'
  | 'ACCESS_URL_SWITCH_RESULT'
  | 'ACCESS_URL_CREATE_PROFILE'
  | 'ACCESS_URL_CREATE_PROFILE_RESULT'
  | 'ACCESS_URL_IMPORT_LOCALSTORAGE'
  | 'ACCESS_URL_IMPORT_LOCALSTORAGE_RESULT'
  | 'ACCESS_URL_GET_SHARE_DATA'
  | 'ACCESS_URL_SHARE_DATA_RESULT';

export interface ContentScriptMessage {
  type: ContentScriptMessageType;
  payload?: unknown;
  nonce?: string;
}

// ============================================================
// Sync2Access Extension - Constants
// Reverse-engineered from minified source v1.7.0
// ============================================================

/** Base API URL for the Sync2Access backend */
export const API_BASE_URL = 'https://friendshouse.io.vn/api';

/** Storage key for logout prevention settings */
export const LOGOUT_PREVENTION_STORAGE_KEY = 'logoutPreventionSettings';

/** Storage key for profile data */
export const PROFILE_STORAGE_KEY = 'profileStorage';

/** Storage key for theme preference */
export const THEME_STORAGE_KEY = 'access-url-extension-theme';

/** Storage key for language preference */
export const LANGUAGE_STORAGE_KEY = 'access-url-language';

/** Maximum number of profiles per domain */
export const MAX_PROFILES_PER_DOMAIN = 10;

/** Maximum number of learned logout patterns per domain */
export const MAX_LEARNED_PATTERNS_PER_DOMAIN = 50;

/** Maximum number of whitelisted URLs per domain */
export const MAX_WHITELISTED_URLS_PER_DOMAIN = 100;

/** Storage quota warning threshold (90%) */
export const STORAGE_QUOTA_WARNING_THRESHOLD = 0.9;

/** Default profile name */
export const DEFAULT_PROFILE_NAME = 'Default';

/** Default share expiration in hours (7 days) */
export const DEFAULT_SHARE_EXPIRATION_HOURS = 168;

/** Request timeout in milliseconds (10 seconds) */
export const REQUEST_TIMEOUT_MS = 10_000;

/** Signature max age in milliseconds (5 minutes) */
export const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000;

/** Maximum future timestamp tolerance (60 seconds) */
export const SIGNATURE_FUTURE_TOLERANCE_MS = 60_000;

// ---- Encryption Constants ----

/** PBKDF2 iteration count */
export const PBKDF2_ITERATIONS = 210_000;

/** Salt length in bytes */
export const SALT_LENGTH = 16;

/** AES-GCM IV length in bytes */
export const IV_LENGTH = 12;

/** Total derived key bytes (AES key + HMAC key + Verifier) */
export const DERIVED_KEY_BYTES = 96;

/** Default encryption password for public shares */
export const DEFAULT_ENCRYPTION_PASSWORD = 'access-url-public-share-default-key-v2';

// ---- DNR (Declarative Net Request) Constants ----

/** Base rule ID for dynamic logout rules (1000+) */
export const DNR_RULE_BASE_ID = 1000;

/** Rule ID for the bypass allow rule */
export const DNR_BYPASS_RULE_ID = 999;

/** Bypass token URL parameter name */
export const BYPASS_TOKEN_PARAM = '_access_url_bypass';

/** Bypass token lifetime in milliseconds (10 seconds) */
export const BYPASS_TOKEN_TTL_MS = 10_000;

/** Share data lifetime in session storage (5 minutes) */
export const SHARE_DATA_TTL_MS = 5 * 60 * 1000;

/** Per-origin message rate limit window (60 seconds) */
export const MESSAGE_RATE_LIMIT_WINDOW_MS = 60_000;

/** Maximum external messages per origin per window */
export const MESSAGE_RATE_LIMIT_MAX = 30;

/** Sync2Access website used by popup share creation flow */
export const SHARE_CREATION_BASE_URL = 'https://friendshouse.io.vn';

/** Default logout URL patterns for DNR rules */
export const DEFAULT_LOGOUT_PATTERNS: string[] = [
  '*logout*',
  '*signout*',
  '*sign-out*',
  '*log-out*',
  '*/session/destroy*',
  '*%2Flogout*',
  '*%2Fsignout*',
  '*%2Fsign-out*',
  '*%2Flog-out*',
];

// ---- RSA Public Key ----

/** RSA-2048 public key for signature verification (PEM format) */
export const RSA_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0WkClQFqWcFkVbXww/uY
9tNOOSMKsLIgD94pWvjkfoE+o0zQZSsrDoc2JOyR7sigqe0M53hsL4Deq+nAkWdu
H+XQ4tB9cQrOYYelQurZgYEhAxRp2czb4Ezz71YEAWV2jO8wuwhKjoQla0/l/0r9
2sNQW7fcZHi9j6SLBRzuSsS6OQMTaArhDYZxihEJXyRctKOO0fSRKDQg6IRlmo23
TecRC1BPKevIqPlsa7J62NU7LzgSRfmoNK2GtR/NUnv7CuyAsWiJ7479IBO/m/l6
dAoSAqyUNi4VP8S8wB+81F6bIgmXqvWVLYjMUvazi8j19KoXkluocrsTEKdQeAUA
LwIDAQAB
-----END PUBLIC KEY-----`;

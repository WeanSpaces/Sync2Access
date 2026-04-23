// ============================================================
// Sync2Access Extension - Cryptography Module
// Handles AES-GCM encryption, PBKDF2 key derivation, RSA
// signature verification, and HMAC authentication.
// Reverse-engineered from minified source v1.7.0
// ============================================================

import {
  PBKDF2_ITERATIONS,
  SALT_LENGTH,
  IV_LENGTH,
  DERIVED_KEY_BYTES,
  DEFAULT_ENCRYPTION_PASSWORD,
  RSA_PUBLIC_KEY_PEM,
  SIGNATURE_MAX_AGE_MS,
  SIGNATURE_FUTURE_TOLERANCE_MS,
} from '../shared/constants';
import type {
  CookieData,
  EncryptedCookie,
  EncryptedPayload,
  DerivedKeys,
  EncryptionResult,
  SignatureVerificationResult,
} from '../shared/types';

const textEncoder = new TextEncoder();

// ---- Utility Functions ----

/**
 * Convert a Uint8Array (or ArrayBuffer) to a base64 string.
 */
function toBase64(data: Uint8Array | ArrayBuffer): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert a base64 string to a Uint8Array.
 */
function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Normalize the password: use default if empty/blank.
 */
function normalizePassword(password?: string): string {
  const trimmed = (password ?? '').trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_ENCRYPTION_PASSWORD;
}

// ---- Key Derivation ----

/**
 * Derive AES-GCM key, HMAC key, and password verifier from a password + salt
 * using PBKDF2 with SHA-256.
 *
 * Total derived bytes: 96
 *   - bytes[0:32]  → AES-256-GCM key
 *   - bytes[32:64] → HMAC-SHA256 key
 *   - bytes[64:96] → Password verifier (base64)
 */
export async function deriveKeys(password: string | undefined, salt: Uint8Array): Promise<DerivedKeys> {
  const normalizedPassword = normalizePassword(password);

  // Import the password as a PBKDF2 key
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(normalizedPassword) as any,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive 96 bytes
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    DERIVED_KEY_BYTES * 8 // bits
  );

  const derivedBytes = new Uint8Array(derivedBits);
  const aesKeyRaw = derivedBytes.slice(0, 32);
  const hmacKeyRaw = derivedBytes.slice(32, 64);
  const verifierRaw = derivedBytes.slice(64, 96);

  // Import the AES and HMAC keys
  const [aesKey, hmacKey] = await Promise.all([
    crypto.subtle.importKey('raw', aesKeyRaw as any, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']),
    crypto.subtle.importKey('raw', hmacKeyRaw as any, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']),
  ]);

  return {
    aesKey,
    hmacKey,
    verifier: toBase64(verifierRaw),
  };
}

// ---- AES-GCM Encryption/Decryption ----

/**
 * Encrypt a plaintext string using AES-256-GCM with a random IV.
 */
export async function encryptValue(plaintext: string, aesKey: CryptoKey): Promise<EncryptionResult> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    aesKey,
    textEncoder.encode(plaintext) as any
  );
  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv),
  };
}

/**
 * Decrypt an AES-GCM ciphertext.
 */
export async function decryptValue(ciphertextB64: string, ivB64: string, aesKey: CryptoKey): Promise<string> {
  const ciphertext = fromBase64(ciphertextB64);
  const iv = fromBase64(ivB64);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as any },
    aesKey,
    ciphertext as any
  );
  return new TextDecoder().decode(plaintext);
}

// ---- HMAC ----

/**
 * Compute HMAC-SHA256 over a string and return the result as base64.
 */
export async function computeHmac(data: string, hmacKey: CryptoKey): Promise<string> {
  const signature = await crypto.subtle.sign('HMAC', hmacKey, textEncoder.encode(data) as any);
  return toBase64(signature);
}

/**
 * Verify an HMAC-SHA256 signature.
 */
export async function verifyHmac(data: string, hmacB64: string, hmacKey: CryptoKey): Promise<boolean> {
  const computedHmac = await computeHmac(data, hmacKey);
  return computedHmac === hmacB64;
}

// ---- Cookie Encryption (v2 format) ----

/**
 * Encrypt an array of cookies into the v2 encrypted payload format.
 * Optionally includes encrypted localStorage data.
 */
export async function encryptCookies(
  cookies: CookieData[],
  password: string | undefined,
  localStorageData?: Record<string, string>
): Promise<{ payload: EncryptedPayload; passwordVerifier: string }> {
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // Derive encryption keys
  const { aesKey, hmacKey, verifier } = await deriveKeys(password, salt);

  // Encrypt each cookie value
  const encryptedCookies: EncryptedCookie[] = await Promise.all(
    cookies.map(async (cookie) => {
      const { ciphertext, iv } = await encryptValue(cookie.value, aesKey);
      return {
        n: cookie.name,
        v: ciphertext,
        iv,
        d: cookie.domain,
        p: cookie.path,
        ...(cookie.secure !== undefined && { s: cookie.secure }),
        ...(cookie.httpOnly !== undefined && { h: cookie.httpOnly }),
        ...(cookie.sameSite !== undefined && { ss: cookie.sameSite }),
        ...(cookie.expirationDate !== undefined && { e: cookie.expirationDate }),
      };
    })
  );

  // Compute HMAC over the serialized cookies
  const cookiesJson = JSON.stringify(encryptedCookies);
  const hmac = await computeHmac(cookiesJson, hmacKey);

  // Build the payload
  const payload: EncryptedPayload = {
    version: 2,
    salt: toBase64(salt),
    cookies: encryptedCookies,
    hmac,
  };

  // Optionally encrypt localStorage
  if (localStorageData && Object.keys(localStorageData).length > 0) {
    const lsJson = JSON.stringify(localStorageData);
    const { ciphertext, iv } = await encryptValue(lsJson, aesKey);
    payload.localStorage = ciphertext;
    payload.lsIv = iv;
  }

  return { payload, passwordVerifier: verifier };
}

// ---- RSA Signature Verification ----

/** Cached RSA public key */
let cachedRsaKey: Promise<CryptoKey> | null = null;

/**
 * Parse the PEM public key and import it as a CryptoKey for verification.
 */
function parsePemPublicKey(pem: string): ArrayBuffer {
  const b64 = pem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Get or import the RSA public key (cached).
 */
async function getRsaPublicKey(): Promise<CryptoKey> {
  if (!cachedRsaKey) {
    cachedRsaKey = crypto.subtle
      .importKey(
        'spki',
        parsePemPublicKey(RSA_PUBLIC_KEY_PEM),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify']
      )
      .catch((error) => {
        console.error('[CRITICAL] Failed to import RSA public key:', error);
        cachedRsaKey = null;
        throw error;
      });
  }
  return cachedRsaKey;
}

/**
 * Verify an RSA-2048 signature on an API response.
 *
 * Checks:
 * 1. Response timestamp is within SIGNATURE_MAX_AGE_MS (5 min)
 * 2. Response timestamp is not too far in the future (60s)
 * 3. Signature is valid base64
 * 4. Signature length is 256 bytes (RSA-2048)
 * 5. RSA signature verification passes
 */
export async function verifySignature(
  responseData: { timestamp: number; [key: string]: unknown },
  signatureB64: string
): Promise<SignatureVerificationResult> {
  try {
    // Check timestamp freshness
    const age = Date.now() - responseData.timestamp;
    if (age > SIGNATURE_MAX_AGE_MS) {
      return { valid: false, error: 'Response too old (possible replay attack)' };
    }
    if (age < -SIGNATURE_FUTURE_TOLERANCE_MS) {
      return { valid: false, error: 'Response timestamp in future' };
    }

    // Validate base64 format
    if (!/^[A-Za-z0-9+/]+=*$/.test(signatureB64)) {
      return { valid: false, error: 'Invalid signature format (not valid base64)' };
    }

    // Import the RSA key
    const rsaKey = await getRsaPublicKey();

    // Encode the response data as JSON
    const dataBytes = textEncoder.encode(JSON.stringify(responseData));

    // Decode the signature
    const signatureBytes = fromBase64(signatureB64);

    // Verify signature length (RSA-2048 = 256 bytes)
    if (signatureBytes.length !== 256) {
      return { valid: false, error: 'Invalid signature length (expected 256 bytes for RSA-2048)' };
    }

    // Perform RSA verification
    const isValid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', rsaKey, signatureBytes as any, dataBytes as any);

    return { valid: isValid };
  } catch (error) {
    console.error('Signature verification failed:', error);
    return { valid: false, error: 'Signature verification failed' };
  }
}

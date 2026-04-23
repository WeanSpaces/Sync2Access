// ============================================================
// Sync2Access Extension - API Module
// Handles communication with the Sync2Access backend.
// Reverse-engineered from minified source v1.7.0
// ============================================================

import { API_BASE_URL, REQUEST_TIMEOUT_MS, DEFAULT_SHARE_EXPIRATION_HOURS } from '../shared/constants';
import type { ShareRequest, ShareResponse } from '../shared/types';

/**
 * Create a new cookie share on the Sync2Access backend.
 *
 * POST /shares
 *
 * @param request - The share request data
 * @returns The share response with the share URL
 * @throws Error if the request fails or times out
 */
export async function createShare(request: ShareRequest): Promise<ShareResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/shares`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cookies: request.cookies,
        password: request.password,
        domain: request.domain,
        expiresInHours: request.expiresInHours ?? DEFAULT_SHARE_EXPIRATION_HOURS,
        maxAccess: request.maxAccess ?? null,
        recaptchaToken: request.recaptchaToken,
        redirectUrl: request.redirectUrl ?? null,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
      const errorMessage = errorBody.error
        || (typeof errorBody.detail === 'string' ? errorBody.detail : null)
        || (Array.isArray(errorBody.detail) ? errorBody.detail.map((d: any) => d.msg).join('; ') : null)
        || `Server error (${response.status})`;
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

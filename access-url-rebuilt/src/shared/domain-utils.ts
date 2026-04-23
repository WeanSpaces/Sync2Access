// ============================================================
// Sync2Access Extension - Domain Utilities
// Canonicalize domains to eTLD+1 and filter cookies by domain.
// Mirrors original source's Wo()/Ko() canonicalization logic.
// ============================================================

import psl from 'psl';

/**
 * Canonicalize a domain to its registrable eTLD+1.
 * Matches original source's Wo() function:
 *   - Strips protocol prefix
 *   - Strips path
 *   - Strips www. prefix
 *   - Uses PSL to extract registrable domain
 *
 * Examples:
 *   "www.example.com"     → "example.com"
 *   "sub.example.com"     → "example.com"
 *   "example.co.uk"       → "example.co.uk"
 *   "sub.example.co.uk"   → "example.co.uk"
 *   "localhost"            → "localhost" (fallback)
 */
export function canonicalizeDomain(input: string): string {
  if (!input || typeof input !== 'string') return '';

  const cleaned = input
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .replace(/^www\./, '');

  const parsed = psl.parse(cleaned);

  // psl.parse returns { error } for invalid TLDs (e.g., localhost, IP addresses)
  // In those cases, fall back to the cleaned string
  if (parsed.error || !parsed.domain) return cleaned;

  return parsed.domain;
}

/**
 * Filter cookies by suffix-matching against a canonicalized domain.
 * Matches original source's Ko() filter logic:
 *   - Exact match: cookie domain (sans leading dot) equals target
 *   - Suffix match: target ends with "." + cookie domain
 *
 * This ensures we only include cookies that belong to the target
 * registrable domain, excluding unrelated parent-domain cookies.
 */
export function filterCookiesByDomain<T extends { domain: string }>(
  cookies: T[],
  canonicalDomain: string
): T[] {
  const target = canonicalDomain.toLowerCase();

  return cookies.filter(cookie => {
    const cookieDomain = cookie.domain.toLowerCase().replace(/^\./, '');
    return cookieDomain === target || target.endsWith('.' + cookieDomain);
  });
}

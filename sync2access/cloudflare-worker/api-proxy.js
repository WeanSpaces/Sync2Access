// ============================================================
// Cloudflare Worker: API Proxy for Access URL
// Routes: api.friendshouse.io.vn/* → api.accessurl.co/*
//
// Deploy: Cloudflare Dashboard → Workers & Pages → Create Worker
// Then set Custom Domain: api.friendshouse.io.vn
// ============================================================

const UPSTREAM = 'https://api.accessurl.co';

// Headers to strip from forwarded requests
const STRIP_HEADERS = ['cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor', 'x-forwarded-for', 'x-real-ip'];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Build upstream URL (keep path + query intact)
    const upstreamUrl = new URL(url.pathname + url.search, UPSTREAM);

    // Clone request headers, strip Cloudflare-specific ones
    const headers = new Headers(request.headers);
    STRIP_HEADERS.forEach(h => headers.delete(h));
    headers.set('Host', new URL(UPSTREAM).host);

    // Forward the request
    const upstreamRequest = new Request(upstreamUrl.toString(), {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
      redirect: 'follow',
    });

    try {
      const response = await fetch(upstreamRequest);

      // Clone response and add CORS headers
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      // Handle preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: responseHeaders });
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Upstream API unavailable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

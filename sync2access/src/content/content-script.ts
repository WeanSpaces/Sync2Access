// Content Script - Sync2Access Extension
// Bridges webpage ↔ extension via window.postMessage
// Injected at document_start on all pages

(function () {
  if ((window as any).__ACCESS_URL_CONTENT_SCRIPT_LOADED__) return;
  (window as any).__ACCESS_URL_CONTENT_SCRIPT_LOADED__ = true;

  window.addEventListener('message', async (event: MessageEvent) => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const { type, payload, nonce } = event.data || {};
    if (!type || !type.startsWith('ACCESS_URL_')) return;

    if (type === 'ACCESS_URL_PING') {
      window.postMessage({ type: 'ACCESS_URL_PONG', payload: { installed: true }, nonce }, '*');
    }

    const handlers: Record<string, { action: string; responseType: string }> = {
      ACCESS_URL_IMPORT_COOKIES: { action: 'importCookies', responseType: 'ACCESS_URL_IMPORT_RESULT' },
      ACCESS_URL_GET_PROFILE_BY_SHARE_ID: { action: 'getProfileByShareId', responseType: 'ACCESS_URL_PROFILE_RESULT' },
      ACCESS_URL_SWITCH_PROFILE: { action: 'switchProfile', responseType: 'ACCESS_URL_SWITCH_RESULT' },
      ACCESS_URL_CREATE_PROFILE: { action: 'createProfile', responseType: 'ACCESS_URL_CREATE_PROFILE_RESULT' },
      ACCESS_URL_IMPORT_LOCALSTORAGE: { action: 'importLocalStorage', responseType: 'ACCESS_URL_IMPORT_LOCALSTORAGE_RESULT' },
      ACCESS_URL_GET_SHARE_DATA: { action: 'getShareData', responseType: 'ACCESS_URL_SHARE_DATA_RESULT' },
    };

    const handler = handlers[type];
    if (handler) {
      try {
        const result = await chrome.runtime.sendMessage({ action: handler.action, ...payload });
        window.postMessage({ type: handler.responseType, payload: result, nonce }, '*');
      } catch (error: any) {
        window.postMessage({ type: handler.responseType, payload: { success: false, error: error.message }, nonce }, '*');
      }
    }
  });

  window.postMessage({ type: 'ACCESS_URL_READY', payload: { installed: true } }, '*');
})();

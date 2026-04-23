// Logout Confirmation Overlay - injected into pages
// Shows an inline dialog when a logout attempt is detected
function showLogoutConfirmation(domain: string, pathname: string): Promise<{ action: string; learnPattern: boolean }> {
  return new Promise((resolve) => {
    const existing = document.getElementById('access-url-logout-dialog');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'access-url-logout-dialog';
    overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;`;

    const card = document.createElement('div');
    card.style.cssText = `background:white;border-radius:12px;padding:24px;max-width:360px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);animation:slideIn 0.2s ease-out;`;

    const style = document.createElement('style');
    style.textContent = `@keyframes slideIn{from{transform:translateY(-20px);opacity:0}to{transform:translateY(0);opacity:1}}`;
    document.head.appendChild(style);

    card.innerHTML = `
      <div style="text-align:center;margin-bottom:16px">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </div>
      <h2 style="margin:0 0 16px;font-size:16px;font-weight:500;color:#1f2937;text-align:center">Are you trying to log out?</h2>
      <p style="margin:0 0 20px;font-size:12px;color:#9ca3af;text-align:center;word-break:break-all">${domain}${pathname}</p>
      <div style="display:flex;gap:12px">
        <button id="access-url-btn-yes" style="flex:1;padding:10px 16px;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;background:#ef4444;color:white">Yes</button>
        <button id="access-url-btn-no" style="flex:1;padding:10px 16px;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;background:#3b82f6;color:white">No</button>
      </div>`;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const cleanup = () => { overlay.remove(); style.remove(); };

    document.getElementById('access-url-btn-yes')?.addEventListener('click', () => {
      cleanup();
      resolve({ action: 'logout', learnPattern: true });
    });

    document.getElementById('access-url-btn-no')?.addEventListener('click', () => {
      cleanup();
      resolve({ action: 'allow', learnPattern: false });
    });

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup();
        document.removeEventListener('keydown', onEsc);
        resolve({ action: 'allow', learnPattern: false });
      }
    };
    document.addEventListener('keydown', onEsc);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve({ action: 'allow', learnPattern: false });
      }
    });
  });
}

// Listen for messages from the service worker
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'showLogoutConfirmation') {
    showLogoutConfirmation(message.domain, message.pathname)
      .then(sendResponse)
      .catch((error) => {
        console.error('Error showing logout confirmation:', error);
        sendResponse({ action: 'block', addToWhitelist: false });
      });
    return true;
  }
  return false;
});

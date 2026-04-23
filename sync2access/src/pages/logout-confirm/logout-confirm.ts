// Logout confirmation page script
// Handles user interaction with the logout confirmation dialog
// Applies theme and i18n from extension settings

const translations = {
  en: {
    title: "Are you trying to logout?",
    description: "You're navigating to a logout page on",
    yesLogout: "Yes, logout",
    noStay: "No, stay logged in",
    notLogoutPage: "This is not a logout page",
    keyboardHint: "Press",
    toStay: "to stay logged in",
    protectedBy: "Protected by Sync2Access"
  },
  vi: {
    title: "Bạn đang cố gắng đăng xuất?",
    description: "Bạn đang điều hướng đến trang đăng xuất trên",
    yesLogout: "Có, đăng xuất",
    noStay: "Không, ở lại",
    notLogoutPage: "Đây không phải trang đăng xuất",
    keyboardHint: "Nhấn",
    toStay: "để ở lại đăng nhập",
    protectedBy: "Được bảo vệ bởi Sync2Access"
  }
};

const THEME_KEY = 'access-url-extension-theme';
const LANGUAGE_KEY = 'access-url-language';

function applyTheme() {
  chrome.storage.local.get([THEME_KEY], (result) => {
    const theme = result[THEME_KEY] || 'system';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  });
}

function applyTranslations() {
  chrome.storage.local.get([LANGUAGE_KEY], (result) => {
    const lang = result[LANGUAGE_KEY] || 'en';
    const t = (translations as any)[lang] || translations.en;
    document.getElementById('title')!.textContent = t.title;
    document.getElementById('description')!.textContent = t.description;
    document.getElementById('btn-logout')!.textContent = t.yesLogout;
    document.getElementById('btn-stay')!.textContent = t.noStay;
    document.getElementById('btn-not-logout')!.textContent = t.notLogoutPage;
    document.getElementById('keyboard-hint')!.textContent = t.keyboardHint;
    document.getElementById('to-stay')!.textContent = t.toStay;
    document.getElementById('protected-by')!.textContent = t.protectedBy;
    document.title = `${t.title} - Sync2Access`;
    document.documentElement.lang = lang;
  });
}

applyTheme();
applyTranslations();

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  chrome.storage.local.get([THEME_KEY], (result) => {
    if ((result[THEME_KEY] || 'system') === 'system') applyTheme();
  });
});

const params = new URLSearchParams(window.location.search);
const originalUrl = params.get('url');
const BYPASS_TOKEN_PARAM = '_access_url_bypass';

function isValidUrl(url: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    return true;
  } catch { return false; }
}

function getSafeUrl(url: string | null): string | null {
  return isValidUrl(url) ? url : null;
}

if (!isValidUrl(originalUrl)) {
  window.history.back();
}

const validatedUrl = getSafeUrl(originalUrl);
if (validatedUrl) {
  try {
    const urlObj = new URL(validatedUrl);
    const domain = urlObj.hostname;
    chrome.runtime.sendMessage({ action: 'isOnDefaultProfile', domain }, async (response) => {
      if (response && response.isOnDefault) {
        try {
          const tokenResponse = await chrome.runtime.sendMessage({ action: 'generateBypassToken', domain });
          if (tokenResponse?.token) {
            const bypassUrl = new URL(validatedUrl);
            bypassUrl.searchParams.set(BYPASS_TOKEN_PARAM, tokenResponse.token);
            window.location.href = bypassUrl.toString();
            return;
          }
        } catch (err) { console.error('[Sync2Access] Failed to generate bypass token:', err); }
        window.location.href = validatedUrl;
        return;
      }
      document.getElementById('domain')!.textContent = domain;
    });
  } catch { document.getElementById('domain')!.textContent = 'this site'; }
} else {
  document.getElementById('domain')!.textContent = 'this site';
}

// Handle logout button
document.getElementById('btn-logout')!.addEventListener('click', async () => {
  const safeUrl = getSafeUrl(originalUrl);
  if (!safeUrl) { window.history.back(); return; }
  document.getElementById('loading')!.classList.add('show');
  try { await chrome.runtime.sendMessage({ action: 'confirmLogoutFromPage', url: safeUrl }); } catch {}
  window.location.href = safeUrl;
});

// Handle stay button
document.getElementById('btn-stay')!.addEventListener('click', () => {
  const referrer = document.referrer;
  const safeUrl = getSafeUrl(originalUrl);
  if (referrer && safeUrl) {
    try {
      if (new URL(referrer).origin === new URL(safeUrl).origin) { window.location.href = referrer; return; }
    } catch {}
  }
  if (safeUrl) { try { window.location.href = new URL(safeUrl).origin + '/'; return; } catch {} }
  window.history.back();
});

// Handle "not a logout page" button
document.getElementById('btn-not-logout')!.addEventListener('click', async () => {
  const safeUrl = getSafeUrl(originalUrl);
  if (!safeUrl) { window.history.back(); return; }
  try {
    const urlObj = new URL(safeUrl);
    await chrome.runtime.sendMessage({ action: 'declineLogoutFromPage', domain: urlObj.hostname, pathname: urlObj.pathname });
  } catch {}
  window.location.href = safeUrl;
});

// Escape key = stay
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.getElementById('btn-stay')!.click();
});

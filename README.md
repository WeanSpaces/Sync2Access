# Sync2Access Extension

> Chrome Manifest V3 extension for secure cookie profile management, session sharing, logout protection, and multilingual browser workflows.

## Tong Quan

Sync2Access la mot Chrome extension giup quan ly cookie theo tung website, luu nhieu profile dang nhap, chia se phien truy cap bang lien ket co mat khau, va ngan thao tac dang xuat ngoai y muon. Du an duoc viet lai bang TypeScript + React + Vite, su dung Chrome Extension Manifest V3 va ho tro giao dien da ngon ngu.

### Diem Noi Bat

- Cookie profile manager: luu, doi, xoa, import/export profile theo tung domain.
- Secure sharing: ma hoa cookie bang AES-GCM, PBKDF2, HMAC va xac thuc chu ky RSA.
- Logout protection: chan URL dang xuat bang Declarative Net Request, co confirmation page va bypass token mot lan.
- LocalStorage support: co the kem localStorage trong luong gioi han cho flow chia se.
- Multilingual UI: English, Tieng Viet, Korean, Russian va Simplified Chinese.
- Modern UI: React, Radix UI, Tailwind CSS v4, dark/light/system theme.
- MV3 ready: service worker, content script bridge, web accessible resources va rule resources.

## English Summary

Sync2Access is a professional Chrome MV3 extension for browser session workflows. It lets users save cookie snapshots as profiles, switch accounts per domain, share encrypted session bundles through a backend service, and reduce accidental logouts with dynamic DNR-based protection.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Extension platform | Chrome Extension Manifest V3 |
| UI | React 18, TypeScript, Radix UI, lucide-react |
| Build | Vite 5, TypeScript |
| Styling | Tailwind CSS v4 |
| Browser APIs | `chrome.cookies`, `chrome.storage`, `chrome.tabs`, `chrome.scripting`, `chrome.declarativeNetRequest`, `chrome.webNavigation` |
| Crypto | Web Crypto API, AES-GCM, PBKDF2, HMAC-SHA256, RSA signature verification |
| i18n | i18next, react-i18next, Chrome `_locales` |

## Project Structure

```text
.
├── access-url-rebuilt/              # Main extension source
│   ├── public/                      # Manifest, icons, DNR rules, Chrome locales
│   ├── src/
│   │   ├── background/              # Service worker, API, crypto, DNR, profile manager
│   │   ├── content/                 # Web page <-> extension bridge
│   │   ├── pages/                   # Logout confirmation experiences
│   │   ├── popup/                   # React popup UI and translations
│   │   └── shared/                  # Types, constants, domain helpers
│   ├── cloudflare-worker/           # Optional API proxy worker
│   ├── package.json
│   └── vite.config.ts
├── docs/                            # Architecture and installation docs
├── .github/workflows/build.yml      # CI build verification
├── CHANGELOG.md
├── CONTRIBUTING.md
├── PRIVACY.md
└── SECURITY.md
```

Generated dependencies, unpacked CRX references, local GitNexus state, and packaged `.crx` artifacts are intentionally excluded from Git. Build artifacts should be created by CI or attached to GitHub Releases.

## Quick Start

```bash
cd access-url-rebuilt
npm ci
npm run build
```

Then load the built extension in Chrome:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select `access-url-rebuilt/dist`.

More details: [docs/INSTALLATION.md](docs/INSTALLATION.md)

## Main Workflows

### Share A Session

1. Open a supported website tab.
2. Open Sync2Access popup.
3. Choose expiration, access limit, password, redirect URL, and optional localStorage.
4. Create a share link.
5. The extension encrypts the cookie bundle before sending share data to the configured backend.

### Manage Profiles

1. Save current cookies as a named profile.
2. Switch between profiles for the active domain.
3. Export or import profile backups.
4. Keep the default profile protected from accidental deletion.

### Prevent Logouts

1. Enable logout protection globally or for the active domain.
2. The service worker installs DNR rules for logout-like URL patterns.
3. Users get a confirmation page before the extension allows logout navigation.

## Permissions

Sync2Access requests broad browser permissions because cookie/profile workflows operate across the active domain and need extension-level interception:

| Permission | Purpose |
| --- | --- |
| `cookies` | Read, save, clear, and restore cookie profiles |
| `storage` | Store settings, profiles, pending share data, and preferences |
| `tabs`, `activeTab` | Detect the current tab/domain and reload after profile changes |
| `scripting` | Capture/import localStorage and clean temporary URL parameters |
| `webNavigation` | Clean one-time bypass tokens after navigation |
| `declarativeNetRequest`, `declarativeNetRequestWithHostAccess` | Intercept logout URLs through MV3 DNR rules |
| `notifications` | Notify users when logout/profile restoration actions complete |
| `<all_urls>` | Support session workflows across user-selected websites |

## Documentation

- [Installation](docs/INSTALLATION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Privacy](PRIVACY.md)
- [Security](SECURITY.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Development

```bash
cd access-url-rebuilt
npm ci
npm run dev
```

`npm run dev` runs Vite in watch-build mode. Reload the unpacked extension from `chrome://extensions` after rebuilds.

## Release Build

```bash
cd access-url-rebuilt
npm run build
```

The production output is written to `access-url-rebuilt/dist`. Zip that folder for manual distribution or attach it as a GitHub Release artifact.

## Backend Configuration

The extension currently targets `https://friendshouse.io.vn/api` for share creation and `https://friendshouse.io.vn` for generated share URLs. These constants live in `access-url-rebuilt/src/shared/constants.ts` and `access-url-rebuilt/src/popup/App.tsx`.

## License

Copyright (c) WeanSpaces. All rights reserved unless a separate license is added by the repository owner.

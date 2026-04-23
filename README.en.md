# Sync2Access Extension

> Chrome Manifest V3 extension for cookie profile management, encrypted session sharing, logout protection, and multilingual browser workflows.

<p align="center">
  <a href="./README.md">
    <img alt="Read Vietnamese README" src="https://img.shields.io/badge/README-Ti%E1%BA%BFng%20Vi%E1%BB%87t-dc2626?style=for-the-badge" />
  </a>
  <a href="https://github.com/WeanSpaces/Sync2Access/releases/download/v1.7.0/sync2access-extension-v1.7.0.zip">
    <img alt="Download extension ZIP" src="https://img.shields.io/badge/Download%20Extension-ZIP-16a34a?style=for-the-badge&logo=googlechrome&logoColor=white" />
  </a>
  <a href="https://github.com/WeanSpaces/Sync2Access/releases/tag/v1.7.0">
    <img alt="Latest release" src="https://img.shields.io/badge/Release-v1.7.0-111827?style=for-the-badge" />
  </a>
</p>

## Overview

Sync2Access is a Chromium extension for browser session workflows. It lets users save cookies as per-domain profiles, switch accounts quickly, share encrypted session bundles, and reduce accidental logouts with a confirmation flow.

The main source lives in `sync2access`.

## Key Features

- Per-domain cookie profile management.
- Encrypted session sharing with AES-GCM, PBKDF2, HMAC, and RSA verification support.
- Logout protection powered by Declarative Net Request rules.
- One-time bypass tokens for confirmed logout actions.
- Optional localStorage sharing.
- English, Vietnamese, Korean, Russian, and Simplified Chinese UI.
- Light, dark, and system theme modes.

## Install From Release ZIP

1. Download `sync2access-extension-v1.7.0.zip` from the button above or from [Release v1.7.0](https://github.com/WeanSpaces/Sync2Access/releases/tag/v1.7.0).
2. Extract the ZIP to a stable folder.
3. Open `chrome://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the extracted folder.

## Build From Source

```bash
git clone https://github.com/WeanSpaces/Sync2Access.git
cd Sync2Access/sync2access
npm ci
npm run build
```

Then load `sync2access/dist` as an unpacked extension from `chrome://extensions`.

## Basic Usage

### Share A Session

1. Open a website where you are logged in.
2. Open the Sync2Access popup.
3. Choose password, expiration, access limit, redirect URL, and optional localStorage.
4. Create a share link.
5. Copy the link and send it to the recipient.

### Manage Profiles

1. Open the **Profiles** tab.
2. Save current cookies as a named profile.
3. Switch between profiles for the active domain.
4. Export or import profile backups when needed.

### Prevent Logouts

1. Open the **Settings** tab.
2. Enable logout protection globally or for the current domain.
3. Confirm or cancel logout attempts when the confirmation page appears.

## Development

```bash
cd sync2access
npm ci
npm run dev
```

`npm run dev` runs Vite in watch-build mode. Reload the unpacked extension after each rebuild.

## Production Build

```bash
cd sync2access
npm run build
```

The production build is emitted to `sync2access/dist`.

## Documentation

- [Installation](docs/INSTALLATION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Privacy](PRIVACY.md)
- [Security](SECURITY.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## License

Copyright (c) WeanSpaces. All rights reserved unless a separate license is added by the repository owner.

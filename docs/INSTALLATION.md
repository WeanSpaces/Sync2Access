# Installation

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Google Chrome, Microsoft Edge, Brave, or another Chromium browser with Manifest V3 support

## Build From Source

```bash
cd access-url-rebuilt
npm ci
npm run build
```

The build output is created in `access-url-rebuilt/dist`.

## Load In Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `access-url-rebuilt/dist` folder.
5. Pin Sync2Access from the Chrome extensions menu.

## Development Mode

```bash
cd access-url-rebuilt
npm run dev
```

This starts Vite in watch-build mode. After a rebuild, click **Reload** on the extension card inside `chrome://extensions`.

## Package For Manual Distribution

```bash
cd access-url-rebuilt
npm run build
```

Zip the contents of `dist`, not the `dist` folder itself, when preparing a manual release.

## Supported Languages

- English
- Tieng Viet
- Korean
- Russian
- Simplified Chinese

# Changelog

## 1.7.1

- Fixed popup light/dark theme switching for Tailwind CSS v4 by routing color utilities through runtime CSS variables.
- Fixed class-based `dark:` variants so the popup responds to the extension theme toggle.

## 1.7.0

- Rebuilt Sync2Access as a TypeScript + React + Vite Chrome MV3 extension.
- Added multilingual popup UI for English, Vietnamese, Korean, Russian, and Simplified Chinese.
- Added cookie profile management with per-domain profile switching.
- Added encrypted share creation flow with optional password, expiration, access limits, redirect URL, and localStorage support.
- Added logout protection with Declarative Net Request rules and confirmation flow.
- Added security-focused crypto helpers for AES-GCM, PBKDF2, HMAC, and RSA verification.

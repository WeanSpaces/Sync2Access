# Contributing

Thank you for improving Sync2Access.

## Local Setup

```bash
cd access-url-rebuilt
npm ci
npm run build
```

## Development Guidelines

- Keep extension logic inside `access-url-rebuilt/src`.
- Keep Chrome Manifest V3 constraints in mind.
- Do not commit `node_modules`, `dist`, `.crx`, private keys, or local assistant/indexing folders.
- Keep translations aligned across popup locales and Chrome `_locales`.
- Prefer focused changes with a clear user-facing behavior.
- Run a production build before opening a pull request.

## Pull Request Checklist

- The extension builds with `npm run build`.
- New user-facing text is translated where practical.
- Permission changes are documented.
- Security-sensitive flows include validation and error handling.
- Documentation is updated when workflows change.

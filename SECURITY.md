# Security

## Supported Versions

Security fixes should target the current source version in `access-url-rebuilt`.

## Reporting Issues

Open a private report or contact the repository owner for vulnerabilities involving:

- Cookie exposure
- Broken encryption or signature verification
- Cross-origin message abuse
- Logout bypass errors
- Unauthorized backend access
- Dangerous permissions or data retention behavior

Please include reproduction steps, browser version, extension version, and affected domain flow when possible.

## Security Controls

- AES-GCM encryption for cookie values.
- PBKDF2 key derivation with SHA-256.
- HMAC-SHA256 payload authentication.
- RSA signature verification for signed responses.
- Single-use logout bypass tokens with a short TTL.
- Per-domain locks for profile writes and profile switching.
- External message rate limiting.
- Domain and cookie validation before import.

## Public Release Checklist

- Run `npm ci` and `npm run build`.
- Review requested Chrome permissions.
- Confirm `.env`, private keys, packaged `.crx` files, and local generated folders are not committed.
- Attach packaged artifacts to GitHub Releases instead of committing build output.

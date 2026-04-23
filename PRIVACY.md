# Privacy

Sync2Access handles sensitive browser session data. This document describes the intended behavior of the extension source in this repository.

## Data The Extension Can Access

- Cookies for websites selected through the extension workflows.
- Optional localStorage data when the user enables localStorage sharing.
- Domain names and redirect URLs required for profile and share flows.
- Local settings such as theme, language, logout protection status, and saved profiles.

## Local Storage

Profiles and settings are stored in Chrome extension storage on the user's device. The extension uses `chrome.storage.local` and `chrome.storage.session` for local state.

## Share Flow

When a user creates a share link, cookie values are encrypted before share data is sent to the configured backend. Share metadata such as domain, expiration, access limit, redirect URL, and encrypted payload may be sent to the backend service configured in the source.

## User Control

Users can delete profiles, clear cookies for the current domain, export/import profile backups, disable logout protection, and uninstall the extension to remove extension-local data.

## Public Repository Note

This repository contains source code and documentation. It does not intentionally include private user cookies, production secrets, or local developer environment files.

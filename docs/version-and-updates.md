# Version and updates

## Behavior

Installed Android version/browser package version, bundled English changelog, manual GitHub latest-stable check and release notes. Native updates validate repository URL/redirects, SHA-256, package, installed signer and exact increasing version/code before interactive installer.

The About button at the bottom of Settings opens a modal with the same content as the standalone About route. Opening the modal does not check GitHub; update discovery still requires pressing the check button.

## Implementation

[app/screens/settings/AboutPage.vue](../app/screens/settings/AboutPage.vue).

## Acceptance checks

Start/sell offline without requests. Manual check offline shows retryable feedback. On hardware, reject tampered/wrong-signer/older APKs and install newer same-signer APK after permission/confirmation.

The updater tests exercise the real release parser and HTTP client with controlled responses and native version information. They cover newer/same/older versions, missing releases, invalid or foreign assets, GitHub errors, offline retries and timeouts. Browser E2E covers checks only after clicking, displayed release notes, retry after failure and rejected foreign assets at phone and desktop widths. All simulated versions stay in tests.

# Version and updates

## Behavior

Installed Android version/browser package version, bundled English changelog, manual GitHub latest-stable check and release notes. Native updates validate repository URL/redirects, SHA-256, package, installed signer and exact increasing version/code before interactive installer.

## Implementation

[app/screens/settings/AboutPage.vue](../app/screens/settings/AboutPage.vue).

## Acceptance checks

Start/sell offline without requests. Manual check offline shows retryable feedback. On hardware, reject tampered/wrong-signer/older APKs and install newer same-signer APK after permission/confirmation.

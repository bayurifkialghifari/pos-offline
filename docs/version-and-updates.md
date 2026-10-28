# Version and updates

## Behavior

Installed Android version/browser package version, bundled English changelog, manual GitHub latest-stable check and release notes. Native updates validate repository URL/redirects, SHA-256, package, installed signer and exact increasing version/code before interactive installer.

Settings shows an inline application card after backup, with installed version, changelog and update actions. The standalone About route reuses this card. Status begins as Belum diperiksa. Opening either route or its changelog makes no GitHub request; discovery requires pressing Cek pembaruan. Checking, current, available and error states have explicit feedback. A failed recheck clears any previous offer; checks and installation are disabled while an operation runs.

The bundled English changelog opens in a focus-trapped phone sheet or centered desktop dialog with readable headings and lists. Text rendering never executes release HTML. Escape, Close and Android Back dismiss the dialog before route navigation. Native permission guidance and installer confirmation remain interactive.

## Implementation

[app/screens/settings/AboutPage.vue](../app/screens/settings/AboutPage.vue).

## Acceptance checks

Start/sell offline without requests. Manual check offline shows retryable feedback. On hardware, reject tampered/wrong-signer/older APKs and install newer same-signer APK after permission/confirmation.

The updater tests exercise the real release parser and HTTP client with controlled responses and native version information. They cover newer/same/older versions, missing releases, invalid or foreign assets, GitHub errors, offline retries and timeouts. Browser E2E covers checks only after clicking, displayed release notes, retry after failure and rejected foreign assets at phone and desktop widths. All simulated versions stay in tests.

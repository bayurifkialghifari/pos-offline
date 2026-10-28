# Version and updates

## Behavior

Installed Android version/browser package version, bundled English changelog, manual GitHub latest-stable check and release notes. Native updates validate repository URL/redirects, SHA-256, package, installed signer and exact increasing version/code before interactive installer.

Settings shows an inline application card after backup, with installed version, changelog and update actions. The standalone About route reuses this card. Without a fresh cache, status begins as Belum diperiksa. Opening either route or its changelog makes no GitHub request; discovery requires pressing Cek pembaruan. Checking, current, available and error states have explicit feedback. A failed recheck clears any previous offer; checks and installation are disabled while an operation runs.

Every completed GitHub response is cached on the device for one hour, including no-release/current results, rate-limit errors and invalid releases. Reopening the app or switching between Settings and About restores fresh cached feedback. The check button is disabled during the cooldown and displays the next permitted check time in the device's local timezone. Changelog and installation of a valid available update remain accessible. Expiry enables manual checking without a background request. Offline failures and timeouts without a response are not cached and allow immediate retry.

The cooldown reduces this device's requests; it cannot reserve GitHub's shared IP quota or guarantee availability after one hour. HTTP 429 and HTTP 403 with exhausted-quota or retry-after headers show rate-limit feedback. Other HTTP failures show access feedback. Rate-limit responses are not automatically retried.

The bundled English changelog opens in a focus-trapped phone sheet or centered desktop dialog with readable headings and lists. Text rendering never executes release HTML. Escape, Close and Android Back dismiss the dialog before route navigation. Native permission guidance and installer confirmation remain interactive.

## Implementation

[app/screens/settings/AboutPage.vue](../app/screens/settings/AboutPage.vue).

The [updater service](../app/services/updates/updater.ts) deduplicates concurrent checks and reuses the [local cache](../app/services/updates/cache.ts) at its boundary. The cache stores response timestamps and validated release metadata or error feedback in WebView/browser localStorage, separately from the business database and portable backups. If storage is unavailable or full, an in-memory cache protects repeated checks for the current process; restart persistence is unavailable in that case.

Persisted JSON is parsed with Zod and release assets are revalidated against this repository before reuse. Expired, future-dated, malformed or foreign-asset entries are ignored. Cached release metadata is compared with the actual installed version on reuse, so installing an update does not keep offering the same version. Native download, checksum, package, signer and version checks remain required.

## Acceptance checks

Start/sell offline without requests. Manual check offline shows retryable feedback. On hardware, reject tampered/wrong-signer/older APKs and install newer same-signer APK after permission/confirmation.

The updater tests exercise the real release parser and HTTP client with controlled responses and native version information. They cover newer/same/older versions, missing releases, invalid or foreign assets, GitHub errors, offline retries and timeouts; cache reuse across module reload, exact one-hour expiry, cached no-update/error responses, concurrent requests, updated installed versions and untrusted persisted data. Browser E2E covers manual checks, persistence across reload/navigation, displayed release notes, disabled cooldown controls, expiry without requests, retry after offline failure and rejected foreign assets at phone and desktop widths. All simulated versions stay in tests.

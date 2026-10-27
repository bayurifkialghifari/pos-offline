# Verification

## Commands

Run bun run check for Prettier, ESLint, Nuxt types, transaction tests and documentation links. Run bun run generate, bun run test:e2e and bun run android:build on a supported SDK host.

Domain tests use real SQL.js with the serialized adapter to exercise nominal pricing, aggregate/concurrent stock, injected SQL rollback, portable bills, session closure and idempotent void. Backup tests cover media/settings portability, malformed archives and SQL replacement rollback. Release tests cover versions, asset scope and checksums.

## Hardware coverage

Browser preview does not prove Bluetooth/USB delivery. Android acceptance includes camera permission/teardown, 58mm/80mm receipt output, system file pick/save, restart durability and newer/tampered/wrong-signer APK installation. Report unavailable device checks explicitly.

## Verified on October 27, 2026

- Quality: Prettier, ESLint, Nuxt type checking and documentation validation passed. The domain and release suites passed 21 Vitest tests and 4 Node script tests.
- Browser E2E: all 12 checks passed across phone and desktop. Scenarios cover startup without external requests, exact nominal pricing, persistent carts, Open Bills, stock/history, focus and Escape, portable export/import, rejected or cancelled imports, custom units on a fresh device profile and cashier closure after a manual expense.
- Pricing: a product priced at Rp15,000 per kilogram charges exactly Rp10,000 for a nominal purchase and records 667 grams. Historical quantities and amounts remain snapshots.
- Cashier: an opening balance of Rp50,000 and a manual Rp5,000 expense persist after reload and produce an expected closing balance of Rp45,000.
- Manual UI QA: 247 screenshots cover 17 routes and populated checkout, reporting, PIN, expense and cashier states. Captures include light/dark themes and widths of 390, 1440 and 1920 pixels. Screenshot integrity and document widths passed; visual inspection found no blocking layout defect. This is not an exhaustive accessibility or platform-conformance audit.
- Android: native debug APK, signed release APK and signed release AAB builds passed using JDK 21 and Android SDK 36. APK signature verification passed with one persistent RSA-4096 signer and APK Signature Scheme v2. The ARM development host used a temporary AAPT2 compatibility wrapper; GitHub's Ubuntu runner builds without this host workaround.

## Limits and publication status

Physical camera permission/teardown, Bluetooth/USB receipt delivery, Android system file pick/save, restart durability and APK installation/update acceptance remain untested on a physical Android device.

The independent review attempt was inconclusive: its reviewer failed to start with a provider error (HTTP 404: Model gpt-6-astra requires the canonical openai provider). No independent-review pass is claimed.

The main-branch GitHub workflow and tag-triggered publication must be distinguished from local builds. Main-branch CI results are recorded after the first push. No release tag has been created, so release publication and in-app discovery of a published release remain unverified.

Task-only screenshots, action logs and build output stay outside the repository in temporary or ignored directories.

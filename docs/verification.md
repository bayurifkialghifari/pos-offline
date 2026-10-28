# Verification

## Commands

Run bun run check for Prettier, ESLint, Nuxt types, transaction tests and documentation links. Run bun run generate, bun run test:e2e and bun run android:build on a supported SDK host.

Domain tests use real SQL.js with the serialized adapter to exercise nominal pricing, aggregate/concurrent stock, injected SQL rollback, portable bills, session closure and idempotent void. Backup tests cover media/settings portability, malformed archives and SQL replacement rollback. Release tests cover versions, asset scope and checksums.

## Hardware coverage

Browser preview does not prove Bluetooth/USB delivery. Android acceptance includes camera permission/teardown, 58mm/80mm receipt output, system file pick/save, restart durability and newer/tampered/wrong-signer APK installation. Report unavailable device checks explicitly.

## Verified on October 27, 2026

- Quality: Prettier, ESLint, Nuxt type checking and documentation validation passed. The domain, release and updater suites passed 37 Vitest tests and 4 Node script tests.
- Browser E2E: all 20 checks passed across phone and desktop. Scenarios cover startup without external requests, exact nominal pricing, persistent carts, Open Bills, stock/history, focus and Escape, portable export/import, rejected or cancelled imports, custom units on a fresh device profile, cashier closure after a manual expense, manual update discovery, release notes, offline retry and rejected foreign assets.
- Pricing: a product priced at Rp15,000 per kilogram charges exactly Rp10,000 for a nominal purchase and records 667 grams. Historical quantities and amounts remain snapshots.
- Cashier: an opening balance of Rp50,000 and a manual Rp5,000 expense persist after reload and produce an expected closing balance of Rp45,000.
- Manual UI QA: 247 screenshots cover 17 routes and populated checkout, reporting, PIN, expense and cashier states. Captures include light/dark themes and widths of 390, 1440 and 1920 pixels. Screenshot integrity and document widths passed; visual inspection found no blocking layout defect. This is not an exhaustive accessibility or platform-conformance audit.
- Android: native debug APK, signed release APK and signed release AAB builds passed using JDK 21 and Android SDK 36. APK signature verification passed with one persistent RSA-4096 signer and APK Signature Scheme v2. The ARM development host used a temporary AAPT2 compatibility wrapper; GitHub's Ubuntu runner builds without this host workaround.

## Interrupted browser save regression

The first main-branch run failed the nominal-cart reload scenario on desktop, including its retry. A controlled pending IndexedDB write reproduced the failure. After adding cart recovery, the same scenario exposed jeep-sqlite deleting the previous database before its replacement; both viewports then failed holding an Open Bill because the product was missing.

The pinned loader patch replaces the database atomically, while the synchronous draft journal preserves the latest unsaved cart edits. The same controlled scenario now passes on both viewports; the complete browser suite passed 12 checks. Portable restore also clears the destination device's existing cart. Formatting, lint, Nuxt types, a separate TypeScript check of the modified E2E source, 21 Vitest tests, 4 Node tests, documentation checks, and frozen-lock installation passed.

Manual QA used an owned browser with a fresh profile, suspended the database write, reloaded, and completed checkout through the rendered UI. The observed results were:

```text
RECOVERY: product retained; Lihat Keranjang Rp 10.000
CHECKOUT: Transaksi Berhasil; Rp 10.000; remaining stock 9,333 kg
```

Fresh cart captures cover 390-pixel phone and 1440-pixel desktop viewports in both themes, with CSS transitions settled before capture. Document widths match their viewports. Native debug APK, signed release APK, and signed release AAB were rebuilt after the fix; APK and AAB signature verification passed using the same persistent signer.

## Published v0.1.0 release

The [prepared main-branch CI run](https://github.com/bayurifkialghifari/pos-offline/actions/runs/40498813608) passed both quality and Android jobs on commit 8dd8b43. Its quality job passed 37 Vitest tests, 4 Node script tests and 20 browser checks. A fresh local static/Capacitor build, debug APK, signed release APK and signed release AAB also passed. The [tag workflow](https://github.com/bayurifkialghifari/pos-offline/actions/runs/40499224708) published [v0.1.0](https://github.com/bayurifkialghifari/pos-offline/releases/tag/v0.1.0) from that commit on October 27, 2026. GitHub reports a stable, published release with all three expected assets.

The workflow originally prefixed checksum filenames with ./, which the updater correctly rejects. A regression test executed the actual workflow command on temporary APK/AAB fixtures and failed before the fix. Removing that prefix made the same test pass. Additional tests exercise the real update client/parser with native installed-version fixtures, invalid metadata, GitHub errors, timeouts and offline retries. Fixture versions are confined to tests; only v0.1.0 was published.

Published downloads were verified directly:

| Asset                  |      Bytes | SHA-256                                                          |
| ---------------------- | ---------: | ---------------------------------------------------------------- |
| pos-offline-v0.1.0.apk | 16,116,500 | 1bc2a0cc21a976c8c69aaf462769b29a1ecf3c4abe07cf21e1aeb96f48d86b51 |
| pos-offline-v0.1.0.aab | 11,516,561 | 24309f9ca1a360f87cc1a265f49dacc3b17af3d90366856a7b7ce8eaf982431a |

The app's actual Java ReleaseDownload code fetched the published checksum file and APK using its repository/redirect rules, size bounds and streaming hash. The AAB was downloaded with GitHub CLI. Both downloaded files match SHA256SUMS.txt and GitHub's recorded byte sizes. The actual TypeScript release schema, asset checks and checksum parser accepted the published data; release notes match the dated changelog section exactly.

APK verification passed with one RSA-4096 signer and APK Signature Scheme v2. AAB JAR signature verification passed. Both published artifacts match the persistent local signer with certificate SHA-256 609b43d755d3f3905c5a389ea61c579deaa5f3391b76a1fdf4f75950cd805a07. APK manifest inspection confirmed com.karuhundeveloper.posoffline, version 0.1.0 and version code 1000.

Manual QA used an owned browser and fresh profile. The About page displayed version 0.1.0 and its bundled changelog, made no GitHub request before clicking, then received HTTP 200 from the real latest-release endpoint after clicking Periksa pembaruan. The UI correctly displayed Belum ada versi lebih baru yang tersedia. Newer-release notes, offline retry and foreign-asset errors were verified with controlled browser E2E responses. These checks prove release discovery and downloads; they do not prove Android installer or installed-package verification behavior on a device.

## Dashboard and Settings bento revision

The revision retains version 0.1.0 and records its changes under Unreleased. No new release tag is created.

- Quality: Prettier, ESLint, Nuxt types, documentation checks, 37 Vitest tests and 4 Node script tests passed. The complete browser suite passed 28 checks on phone and desktop, including Home shortcut order, unit/backup navigation, populated sales, About focus trapping and restoration, and manual update discovery inside the modal.
- Manual UI evidence: fresh captures cover Home, Reports, the Settings footer, the About modal and the standalone About route at 390, 1440 and 1920 pixels in both themes. Populated Home/Reports also cover 320, 390 and 1440 pixels, with top/end scroll positions and Home metric details. The owned browser uses fresh task profiles; production data is untouched.
- Data: a Rp10,000 nominal sale, Rp50,000 opening cash and Rp5,000 manual expense show sales/income of Rp10,000, an average of Rp10,000 and net cash movement of Rp5,000. A second Rp987,654,321 sale produces total sales/income of Rp987,664,321, two completed transactions, a rounded average of Rp493,832,161 and net cash movement of Rp987,659,321. Long store names and these totals remain readable on narrow screens.
- Android: static generation, Capacitor sync and a native debug APK build passed with JDK 21 and Android SDK 36. The ARM host uses the same temporary AAPT2 wrapper described above. This verifies compilation and packaging; physical installation remains a user acceptance check.

| Requested behavior                                               | Self-review evidence                                                                      |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Store management precedes analytics; units sit beside Products   | Home DOM order, both-theme captures and navigation E2E                                    |
| Icon-bearing bento cards use actual business totals              | Empty/populated captures, completed-sale E2E and recorded real UI transactions            |
| Full backup card is last on Home and near the bottom of Settings | End captures and real navigation to export/import                                         |
| About opens a modal from the bottom Settings button              | Phone sheet/desktop dialog captures, keyboard and manual-updater E2E                      |
| Both themes preserve scrolling and narrow layouts                | Measured viewport/document widths, scrolled captures and dark native scrollbar inspection |

These are implementation self-review and browser/build results. No independent-review pass or physical Android acceptance is claimed.

## Laundry-inspired Home and Settings revision — October 28, 2026

This revision retains version 0.1.1 and records changes under Unreleased. No release tag or new Android release is created.

- Quality: Prettier, ESLint, Nuxt type checking, documentation validation, 40 Vitest tests and 4 Node script tests passed. Static generation passed.
- Browser E2E: all 34 checks passed on phone and desktop. Coverage includes responsive Home order, persisted profile data at 320 pixels, inline version presentation, changelog focus trapping/restoration, Close and Escape, the actual hardware-Back dialog dismissal helper, manual update requests, current/newer/offline responses, clearing stale offers after a failed recheck and safe release-text rendering. Startup and opening changelog make no external update request.
- Manual UI evidence: 222 current-build captures cover 17 routes, changelog states and long-name Home/Settings layouts. Route captures use actual 390, 1440 and 1920 pixel viewports in both themes, at top/end scroll positions; additional long-name captures cover 320, 768 and 1024 pixels. PNG dimensions match recorded browser dimensions, with no measured horizontal overflow. Earlier task captures with incorrect viewport labels are excluded.
- Populated UI evidence: 71 additional captures cover nominal quantity, cart/payment, Home, Reports, Transactions, Cashflow and PIN setup. Reporting captures use 320, 390, 768 and 1440 pixels in both themes at top/end scroll positions. A Rp10,000 nominal purchase of rice priced at Rp15,000/kg records 0.667 kg. A second Rp987,654,321 sale yields sales/income of Rp987,664,321, two completed transactions and a rounded average of Rp493,832,161. After a Rp5,000 expense, net cash movement is Rp987,659,321. The rendered UI shows these values and remains within the measured viewport.
- Tablet layout: the 768-pixel breakpoint retains sidebar navigation, management-first Home order, combined sales/count/average tile and existing analytics grids. Phone Home uses the charcoal hero, daily bento, analytics, management and final backup order. Settings retains profile, logo, QRIS, PIN, theme and splash handlers, followed by backup, inline version/update controls and device prefix.
- Android: static generation and Capacitor sync passed. The native debug build could not complete because the SDK's Linux AAPT2 binary targets x86-64 while this development host is ARM. The historical temporary compatibility wrapper is unavailable; the attempted Windows AAPT2 bridge did not provide a successful build. No native compilation, APK installation or physical-device acceptance is claimed for this revision.
- Review: implementation self-review and real-browser QA were completed. Independent reviewers failed to start with HTTP 404 because their configured model requires the canonical OpenAI provider. No independent-review approval or exhaustive platform/accessibility conformance is claimed.

Task profiles use synthetic data and are separate from the user's browser. Screenshots, action logs and build output remain outside the repository.

## Published v0.1.2 release — October 28, 2026

The [prepared main-branch CI run](https://github.com/bayurifkialghifari/pos-offline/actions/runs/40628435637) passed both quality and Android jobs on commit 976d2f8. Prettier, ESLint, Nuxt types, documentation validation, 40 Vitest tests, 4 Node script tests and all 34 browser checks passed. Static generation, Capacitor sync and the Android debug APK build passed on GitHub's Ubuntu runner.

The [tag workflow](https://github.com/bayurifkialghifari/pos-offline/actions/runs/40628711334) passed the release checks, built and signed APK/AAB artifacts, verified the APK signature and published [v0.1.2](https://github.com/bayurifkialghifari/pos-offline/releases/tag/v0.1.2) from the same commit. The remote annotated tag resolves to 976d2f804e4fdfada0bd165a45802acbfca139b1. GitHub's latest-release endpoint returned v0.1.2 as a stable published release with all three expected assets.

Downloaded artifacts match SHA256SUMS.txt, GitHub's asset digests and recorded byte sizes:

| Asset                  |      Bytes | SHA-256                                                          |
| ---------------------- | ---------: | ---------------------------------------------------------------- |
| pos-offline-v0.1.2.apk | 16,124,071 | 7abbd5df497c088ec1cb26ed3bc7f71506f87cb6fae3de79cf3aee66201d02f1 |
| pos-offline-v0.1.2.aab | 11,524,480 | 3fa3b429d44d573a9a0a4c0daa890ab6b4f256e4cec781c3af78d452a0761197 |

The actual app release schema, asset selection and checksum parser accepted the published response and checksum file. Release notes match the dated changelog section exactly. APK manifest inspection confirmed com.karuhundeveloper.posoffline, version 0.1.2 and version code 1002, increasing from 1001 in the downloaded v0.1.1 APK. APK Signature Scheme v2 verification and AAB JAR signature verification passed. Both artifacts use the same RSA-4096 certificate as the published v0.1.1 APK, with SHA-256 609b43d755d3f3905c5a389ea61c579deaa5f3391b76a1fdf4f75950cd805a07.

## Limits and publication status

Physical camera permission/teardown, Bluetooth/USB receipt delivery, Android system file pick/save, restart durability and APK installation/update acceptance remain untested on a physical Android device.

The independent review attempt was inconclusive: its reviewer failed to start with a provider error (HTTP 404: Model gpt-6-astra requires the canonical openai provider). No independent-review pass is claimed.

The [first main-branch CI run](https://github.com/bayurifkialghifari/pos-offline/actions/runs/40472677094) passed the Android build but failed the desktop draft-reload scenario. The [corrected CI run](https://github.com/bayurifkialghifari/pos-offline/actions/runs/40488763234) on commit 36504eb passed both quality and Android jobs after the persistence fix.

Tag-triggered publication, real latest-release discovery, asset downloads, checksums and artifact signatures are verified above. Emulator testing was outside the requested scope. Physical installation, same-signer updates and tampered/wrong-signer/older APK rejection remain device acceptance checks for the user.

Task-only screenshots, action logs and build output stay outside the repository in temporary or ignored directories.

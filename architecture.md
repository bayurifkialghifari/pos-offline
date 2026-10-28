# Architecture

## Runtime and structure

A client-only Nuxt SPA is packaged by Capacitor from .output/public; no server URL is configured. Bootstrap initializes SQLite/schema/seeds and loads settings/cart. Android uses native SQLite; browser preview uses jeep-sqlite/sql.js persisted to IndexedDB.

The pinned jeep-sqlite 2.8.0 loader runtime and collection source are patched by Bun to overwrite the database with one IndexedDB transaction. The upstream remove-before-save sequence is removed so an interrupted replacement retains the previous committed database. Keep the patch when upgrading this dependency until the same durability guarantee is verified upstream.

Browser cart mutations write a synchronous localStorage recovery journal before their asynchronous SQLite/IndexedDB save. Bootstrap validates and replays interrupted journals; a completed save clears only its own current revision. Backup replacement drains pending cart writes and clears the draft and journal. This device-local recovery state is excluded from portable business data.

| Layer                  | Ownership                                                 |
| ---------------------- | --------------------------------------------------------- |
| app/pages              | Nuxt route wrappers and metadata                          |
| app/screens            | Screen orchestration                                      |
| app/components         | Atomic Design atoms, molecules, organisms and templates   |
| app/stores             | Reactive local state and actions                          |
| app/services           | Checkout, bills, voids, sessions, IO, backups and updates |
| app/repositories       | Parameterized SQL and persistence                         |
| app/db                 | Schema, seeds, typed contracts and serial executor        |
| android native plugins | Printer transport, system document IO and APK updater     |

## Transaction model

Root database operations share one serial executor. Transaction-scoped calls bypass the root queue and share the native transaction. Checkout writes sale/items/aggregate stock/cashflow together. Open Bills retain snapshots without stock reservation; completion revalidates current stock and product compatibility. Void restores historical stock tracking/base quantities exactly once and tombstones generated cashflow. Session close serializes with checkout and retains closing snapshots.

Units have dimension/factor, products have base stock, cart lines have independent IDs, and sale items have immutable name/price/unit/mode/total snapshots. Price and conversion changes cannot silently rewrite history.

## Backup boundary

Zod parses untrusted archive metadata. archive.ts owns byte helpers/digest/errors; inspect.ts owns safe ZIP/media checks; references.ts validates references and arithmetic; backup.service.ts exports/replaces rows; recovery.ts persists the private previous dataset. Native documents use Storage Access Framework; browsers use file input/download.

Re-inspect original archive bytes before replacement to prevent mutation of validated metadata. Validate paths, size limits, media MIME and SHA-256, IDs/references and totals. Save recovery first, delete in reverse dependency order and insert validated rows within one transaction. Only portable store settings travel. Native recovery uses private Data; browser recovery uses a separate IndexedDB database. A browser durability error after SQL commit still retains the recovery copy.

## Native capabilities and updater

Camera scanning uses getUserMedia, detector fallback and explicit teardown. Photos are local bytes with media:// references. ThermalPrinterPlugin transports ESC/POS over paired Bluetooth Classic SPP or USB bulk endpoints. DocumentsPlugin avoids broad storage permissions.

Only the manual version-card action in Settings and About requests public GitHub releases. The card's composable coordinates explicit update states and calls existing services; the changelog molecule renders text safely. Repository-scoped asset URLs, allowed HTTPS redirects, timeouts and bounded sizes protect downloads. ReleaseDownload verifies transfer SHA-256. ApkVerifier verifies package, exact release version/code, increasing version and installed signer. A verified cached APK is exposed via FileProvider to the Android installer after unknown-source permission. Installation stays interactive.

## Build/release

Bun locks dependencies. Prettier formats and organizes imports before each commit. Main/PR CI checks format/lint/types/domain tests/docs/static build/browser E2E and builds a debug APK. Stable tag CI validates package/changelog, signs APK/AAB with a persistent private key and publishes checksums. VersionCode = major × 1,000,000 + minor × 1,000 + patch, with minor/patch at most 999.

## Limits

Initial schema targets a fresh posoffline database; no POS Kacaw database upgrade is provided. Archive and schema versions are explicit. Browser preview is not a service-worker PWA. Physical camera/printer/document/installer acceptance requires Android hardware. PIN is not database encryption.

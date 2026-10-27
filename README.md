# POS Offline

An Indonesian Android point of sale with all business data on the device. Built with Nuxt 4, Vue 3, TypeScript, Tailwind CSS, Pinia and Capacitor 8. No Google login, server or cloud sync is required.

## Features

- Products, categories, local photos, barcode/camera and product XLSX/CSV import/export.
- Seeded pcs, kg and liter units, custom units, quantity or requested-rupiah entry.
- At Rp15,000/kg, buying Rp10,000 charges exactly Rp10,000 and deducts 667 grams (approximately 0.667kg).
- Persistent cart, Open Bills, cash/QRIS checkout, receipts and transaction cancellation.
- Cashier sessions, cashflow, period reports and spreadsheet exports.
- Bluetooth Classic/USB thermal printing on Android and browser receipt preview.
- Complete portable ZIP backups with media/history/Open Bills/sessions and a recovery copy before replacement.
- Local PIN, branding, light/dark themes, installed version, changelog and manual in-app updates.
- Signed APK/AAB GitHub releases triggered by stable tags.

## Install on Android

Download the signed [v0.1.1 APK](https://github.com/bayurifkialghifari/pos-offline/releases/download/v0.1.1/pos-offline-v0.1.1.apk) and open it on Android to follow the system installation prompts. The [release page](https://github.com/bayurifkialghifari/pos-offline/releases/tag/v0.1.1) also includes an AAB and SHA256SUMS.txt. See [verification](docs/verification.md) for the published artifact checks and remaining device acceptance checks.

## Development

Use Bun 1.4.0 and Node 22 or newer. Android needs JDK 21, SDK platform 36 and build-tools 36.0.0 on a supported SDK host.

    bun install --frozen-lockfile
    bun run prepare:hooks
    bun run dev

Before committing:

    bun run format
    bun run check
    bun run generate
    bunx playwright install chromium
    bun run test:e2e

Build Android with bun run android:build and ANDROID_HOME pointing at your SDK. The app embeds .output/public with native SQLite database posoffline and app ID com.karuhundeveloper.posoffline. Browser preview uses SQLite WASM/IndexedDB and is a development surface, not an installed offline PWA.

## Moving devices

Open Setelan → Cadangan data, export a ZIP and import it on the other device. Preview and confirm replacement. A private recovery copy is created first. PIN, device identity/prefix, printer pairing, updater cache and active cart are excluded. Hold unfinished carts as Open Bills before exporting. Backups are not encrypted; keep copies somewhere you control.

## Releases and updates

Stable tags must match package.json and a dated CHANGELOG.md section. See [Android release](docs/android-release.md) for signing secrets and release steps. The first release, v0.1.0, was published on October 27, 2026 by the tag workflow; future release tags are created explicitly.

Update checks require internet and happen only when requested. Business features run offline. QRIS amount/CRC generation is local; settlement depends on the customer's payment provider and is confirmed manually in the app.

## Documentation

Read [PRD](PRD.md), [architecture](architecture.md), [design](DESIGN.md), [agent guide](AGENTS.md), [changelog](CHANGELOG.md), [feature index](docs/features.md), [verification](docs/verification.md) and [provenance](docs/provenance.md).

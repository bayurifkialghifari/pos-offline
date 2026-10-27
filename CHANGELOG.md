# Changelog

All notable changes are recorded here. Releases follow Semantic Versioning.

## [Unreleased]

## [0.1.0] - 2026-10-27

### Added

- Offline Nuxt and Capacitor point of sale with native SQLite.
- Quantity and exact nominal checkout with seeded and custom units.
- Product photos, barcode scanning, thermal receipts, dynamic QRIS, and Open Bills.
- Cashier sessions, transaction voids, cashflow, and period reports.
- Portable validated ZIP backups with a durable recovery copy.
- Local PIN lock, store branding, light and dark themes.
- App version, bundled changelog, and manual verified Android updates.
- Tag-triggered signed Android APK and AAB releases with checksums.
- Product and report CSV/XLSX import/export with formula and archive validation.
- A charcoal and lime responsive interface with blue money and green/red cashflow.

### Fixed

- Generate release checksums with canonical asset filenames that the in-app updater can verify.
- Recover browser cart edits after reload interrupts an IndexedDB save, and clear the local draft after a successful backup restore.
- Preserve the previous browser database until its replacement commits atomically, so an interrupted save cannot erase products or transactions.

# POS Offline Agent Guide

## Product

POS Offline is a local Android point of sale built with Nuxt 4, Vue 3, Tailwind, Pinia and Capacitor 8. Production output is a static SPA in .output/public. Android uses native SQLite; browsers are a development surface.

## Commands

- bun install --frozen-lockfile
- bun run dev
- bun run format and bun run format:check before every commit
- bun run lint, bun run typecheck, bun run test, bun run check:docs
- bun run generate, bun run cap:sync, bun run android:build
- bun run prepare:hooks after cloning

## Structure and boundaries

app/pages owns route metadata. app/screens composes screen templates. app/components/atoms, molecules, organisms and templates implement Atomic Design. Composables coordinate stores and services. Services own transactions; repositories own SQL. Platform adapters and capabilities own native integration. Bootstrap is client-only.

## Domain invariants

Money is integer rupiah; stock is integer pieces, grams or milliliters. Products reference custom unit definitions. Conversion changes are forbidden once referenced. Cart line IDs are independent of product IDs. Quantity mode rounds totals half up. Nominal mode charges exactly the requested rupiah and rounds stock to the nearest base quantity. Persist unit and price snapshots through sales, Open Bills, receipts, exports and voids. Aggregate stock demand by product before checkout. Never add incompatible units into a quantity total.

Sale, items, stock and cashflow commit together. Void restores recorded base quantities only once. Open Bills do not reserve stock; completion revalidates stock. Restored bills and sessions work on another device. Never recalculate history from current prices or units.

## Offline and backup

No Google login, cloud sync, outbox or remote media. No startup network requests. Public GitHub update checks are user-triggered. Backups contain business data and actual media; exclude PIN credentials, device identity, printer pairing and updater cache. Validate the full archive, create a durable recovery copy, then replace transactionally. Cancelled or invalid imports preserve existing data.

## Documentation and commits

Markdown, comments, commit messages and release notes are English; UI is Indonesian. Feature documents live directly in docs/ and describe actual behavior and acceptance checks. Update CHANGELOG.md under Unreleased with each behavior. Use atomic commits with direct tests/docs. Never commit signing keys, secrets, APKs or local SDK paths. Do not create a release tag unless requested.

## Releases

Stable tags use vMAJOR.MINOR.PATCH. Version code is major * 1000000 + minor * 1000 + patch. Tag, package version and changelog must agree. CI signs APK/AAB using persistent protected secrets and publishes checksums. The updater verifies checksum, package identity, installed signer and increasing version before opening the system installer.

## Verification

Pricing, stock aggregation, rollback, portable restore and release parsing need meaningful regression tests. Browser E2E verifies real rendered flows. Report unavailable physical hardware tests explicitly. A web build is not evidence of an Android build or update installation.

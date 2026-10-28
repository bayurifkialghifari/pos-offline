# Product Requirements: POS Offline

## Purpose and users

Give Indonesian small-shop owners and cashiers an Android POS that operates without an account/server and can move complete business data through a file. Support goods sold by pieces, weight, volume and requested rupiah. UI is Indonesian; documentation, comments, commits and release notes are English.

## Platform

Nuxt 4/Vue 3/TypeScript, Tailwind, Pinia and Capacitor 8 are required. Use Atomic Design for Vue components. Production is a client-only static SPA bundled in Android with native SQLite. No Google/Firebase login, cloud synchronization, outbox, background update checking or remote product media.

## Scope and acceptance

| Capability         | Required behavior                                          | Acceptance                                                                        |
| ------------------ | ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Catalog            | Products/categories, media, barcode, stock and custom unit | Create a kg product with a local photo and retain both after restore              |
| Units              | Idempotent pcs/kg/liter seeds; custom count/weight/volume  | Preserve conversion snapshots through history                                     |
| Cart               | Quantity or requested-rupiah entry and local draft         | Rp15,000/kg + Rp10,000 charges Rp10,000 and deducts 667g                          |
| Checkout           | Cash/QRIS, discount, change and atomic accounting          | Underpayment, insufficient aggregate stock or failed write leaves no partial sale |
| Open Bills         | Hold/resume/complete/cancel with no stock reservation      | Restored bills complete on another device after revalidation                      |
| History            | Detail, receipts, void and export                          | Restore recorded stock exactly once; retain cancelled history                     |
| Sessions           | Opening cash, live drawer balance, closing difference      | One active session; closed sessions reject attached sales                         |
| Cashflow/reporting | Manual/system income, expenses and aligned periods         | Completed sales only; QRIS excluded from cash drawer                              |
| Printing/scanning  | Local Android camera and Bluetooth/USB ESC/POS             | Visible permission/error states and resource teardown                             |
| Portability        | Complete archive, preview, confirmation and recovery       | Invalid archive and failed SQL replacement preserve existing data                 |
| Settings           | Store/QRIS branding, local PIN, theme and device prefix    | Target device credentials/preferences survive business restore                    |
| About/update       | Installed version, changelog and manual APK update         | Verify checksum/package/signer/increasing version before installer                |
| Delivery           | Public GitHub, atomic commits and signed tag CI            | Prettier before each commit; package/tag/changelog agree                          |

## Domain rules

Money is integer rupiah; stock is integer pieces, grams or milliliters. Each unit maps one displayed quantity to an integer factor. Quantity pricing rounds half up. Requested-rupiah pricing rounds stock to the nearest base quantity and charges exactly the requested amount. Reject invalid, unsafe, zero and sub-base quantities. Aggregate stock demand by product across repeated cart lines before any write.

Persist sale-item name, price, unit, factor, base quantity, mode and authoritative total snapshots. Today's settings never recalculate history. Open Bills do not reserve stock. Void restores recorded stock once and tombstones generated cashflow. Closing session snapshots remain historical if a sale is cancelled later.

## Portable backup contract

Include all business tables with soft-deleted history, actual media, Open Bills, sessions and store/QRIS settings. Exclude PIN, device/printer preferences, appearance, active cart and updater cache. Validate schema, references, IDs, amount math, paths, MIME/checksums and bounded sizes before confirmation. Save a durable recovery ZIP, then replace business rows transactionally. Import is replacement, not merge or direct POS Kacaw database migration.

## Design

Combine the existing POS Kacaw layout with Laundry Stitch charcoal, mint, sky blue and white surfaces. Preserve tablet navigation and dashboard grids. Phone Home starts with a store hero, daily bento and analytics, followed by management and backup. Settings retains its controls and shows an inline version/update card with a changelog modal. Dashboard/reports use real data, empty and error states. Phone/tablet/desktop and both themes must be usable. Dialogs trap focus, expose titles and support Escape and Android Back. Local icons, visible focus and reduced motion are required.

## Exclusions

No online synchronization, payment-settlement verification, silent Android installation or multi-device concurrent merge. PIN gates the UI; it does not encrypt SQLite/backups. Android permission and installation confirmations remain controlled by the user.

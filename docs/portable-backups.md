# Portable backups

## Behavior

Versioned ZIP with all business tables, soft-deleted history, actual media, Open Bills, sessions and store/QRIS allowlist. Exclude PIN, device/printer/theme/updater preferences and active cart. Limits: 64MB compressed, 128MB expanded, 8MB/photo and 10001 entries. Validate schema, references, IDs, math, paths, MIME and SHA-256.

## Implementation

[app/services/backup/backup.service.ts](../app/services/backup/backup.service.ts).

## Acceptance checks

Move media/history/bills/sessions while retaining target PIN/device identity. Reject bad paths/corrupt media before replacement.

# History and voids

## Behavior

Transaction list/search/detail/reprint/export and confirmed cancellation. Void restores recorded base quantities once even if current stock tracking changed. Retain sales/items, tombstone generated cashflow and exclude voids from completed totals.

## Implementation

[app/services/void.service.ts](../app/services/void.service.ts).

## Acceptance checks

Void a nominal sale twice and restore only 667g once. Preserve cancelled history and exclude it from reports.

# Barcode scanning

## Behavior

Camera scanning with detector fallback, debounce and teardown. Known bulk products open quantity entry; unknown codes can start product creation. Inactive/out-of-stock products show feedback.

## Implementation

[app/screens/pos/ScanPage.vue](../app/screens/pos/ScanPage.vue).

## Acceptance checks

Deny camera permission and retain manual workflows. Scan a kg product and enter a nominal purchase. Unknown-code creation is prefilled.

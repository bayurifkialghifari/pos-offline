# Receipts and printing

## Behavior

Receipt content comes from historical sale snapshots, including units/nominal annotations. Android transports ESC/POS to paired Bluetooth Classic SPP or USB bulk endpoints. Pairing/paper width remain device preferences; browser preview is for development.

## Implementation

[app/lib/receipt.ts](../app/lib/receipt.ts).

## Acceptance checks

Print nominal weighted receipts on 58mm/80mm printers. Deny permissions and verify errors. Reprint after changing current product price.

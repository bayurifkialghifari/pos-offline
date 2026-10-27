# Cart and checkout

## Behavior

Independent cart lines, quantity/nominal input, locally persisted draft with retry feedback, discount, cash/QRIS and change. Aggregate stock across repeated product lines; write sale/items/stock/cashflow transactionally.

Browser preview writes a synchronous local recovery journal before saving the draft to SQLite and IndexedDB. Reload restores and validates an interrupted journal, then persists it again. Only the latest completed save removes the journal. Android saves directly to native SQLite. The draft and its journal are excluded from portable backups and cleared after successful replacement.

## Implementation

[app/stores/cart.ts](../app/stores/cart.ts).

## Acceptance checks

Restart a cart. Reject underpayment and aggregate stock overdraw with no writes. Inject SQL failure in cashflow creation and verify complete rollback.

Suspend the browser's IndexedDB draft write, reload, and verify that the product catalog remains intact and a Rp10,000 nominal line retains 667 grams and completes an Open Bill for exactly Rp10,000.

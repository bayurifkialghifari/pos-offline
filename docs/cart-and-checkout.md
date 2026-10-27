# Cart and checkout

## Behavior

Independent cart lines, quantity/nominal input, locally persisted draft with retry feedback, discount, cash/QRIS and change. Aggregate stock across repeated product lines; write sale/items/stock/cashflow transactionally.

## Implementation

[app/stores/cart.ts](../app/stores/cart.ts).

## Acceptance checks

Restart a cart. Reject underpayment and aggregate stock overdraw with no writes. Inject SQL failure in cashflow creation and verify complete rollback.

# Cashflow

## Behavior

Manual income/expenses with local categories/date/note, optional current session attachment and green/red indicators. Sale completion generates business income. Edit/delete manual records; sale-generated accounting is controlled by sale operations.

## Implementation

[app/screens/cashflow/CashflowPage.vue](../app/screens/cashflow/CashflowPage.vue).

## Acceptance checks

Create expense and verify period net/session balance. Void a sale and remove its generated income exactly once.

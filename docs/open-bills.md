# Open Bills

## Behavior

Hold labelled snapshot lines without stock reservation. Resume/complete after current stock and product compatibility checks. Cancel open bills without restoring stock. Origin device metadata is historical and does not prevent completion after portable restore.

## Implementation

[app/services/openBill.service.ts](../app/services/openBill.service.ts).

## Acceptance checks

Hold a nominal purchase, restore on another device and complete once. Insufficient stock preserves the open bill.

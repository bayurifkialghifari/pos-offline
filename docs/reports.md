# Dashboard and reports

## Behavior

Real daily dashboard sales/cashflow/session/activity. Reports align sales/count/average/income/expense/net with selected period. Accessible date-selectable SVG trends aggregate long periods and query every matching record.

Home puts store-management shortcuts before the analytics bento, with Products and Product units adjacent. The sales tile shows today's completed total, count and average; icon cards show incoming/outgoing cash and a separate row shows their net. The wide period trend sits beside cashier status and recent activity. The final backup section has a heading, icon, explanation and explicit button. Empty states display real zero totals and links to start selling.

## Implementation

[app/screens/reports/ReportsPage.vue](../app/screens/reports/ReportsPage.vue).

## Acceptance checks

Change period and verify card/chart/export alignment. Return from cashflow reporting to dashboard and retain a sales chart. Exclude cancelled sales.

Verify the shortcut order, unit and backup navigation, responsive wrapping in both themes, and that the backup card remains the last Home section. Complete a sale and verify the daily tile, period trend and recent activity refresh together.

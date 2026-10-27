# Dashboard and reports

## Behavior

Real daily dashboard sales/cashflow/session/activity. Reports align sales/count/average/income/expense/net with selected period. Accessible date-selectable SVG trends aggregate long periods and query every matching record.

## Implementation

[app/screens/reports/ReportsPage.vue](../app/screens/reports/ReportsPage.vue).

## Acceptance checks

Change period and verify card/chart/export alignment. Return from cashflow reporting to dashboard and retain a sales chart. Exclude cancelled sales.

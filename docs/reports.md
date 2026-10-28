# Dashboard and reports

## Behavior

Real daily dashboard sales/cashflow/session/activity. Reports align sales/count/average/income/expense/net with selected period. Accessible date-selectable SVG trends aggregate long periods and query every matching record.

Phone Home starts with a charcoal store hero and mint transaction action, followed by store-management shortcuts above the daily summary. A blue sales tile spans two rows beside transaction count and average, followed by incoming/outgoing cash and a full-width net row. Below 360 pixels the summary stacks to keep amounts readable. Analytics follow the summary, with backup last. Products and Product units remain adjacent. At 768 pixels and above, retain the management-first order, combined sales/count/average tile, sidebar and existing analytics grids. The final backup section has a heading, icon, explanation and explicit button. Empty states display real zero totals and links to start selling.

## Implementation

[app/screens/reports/ReportsPage.vue](../app/screens/reports/ReportsPage.vue).

## Acceptance checks

Change period and verify card/chart/export alignment. Return from cashflow reporting to dashboard and retain a sales chart. Exclude cancelled sales.

Verify the phone/tablet section order, unit and backup navigation, responsive wrapping in both themes, and that backup remains the last Home section. Complete a sale and verify the daily total, count, average, period trend and recent activity refresh together. Check 320, 390, 768 and 1024 pixels with long store names and large monetary values.

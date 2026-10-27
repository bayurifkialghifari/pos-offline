# Cashier sessions

## Behavior

One open session with opening cash, live cash drawer and counted/expected/difference closing snapshots. Cash/manual session entries affect drawer; QRIS remains business income but not drawer cash. Closed snapshots are not rewritten by later voids.

## Implementation

[app/services/cashier.service.ts](../app/services/cashier.service.ts).

## Acceptance checks

Reject a second active session and checkout attached to a closed session. Complete restored active sessions on another device.

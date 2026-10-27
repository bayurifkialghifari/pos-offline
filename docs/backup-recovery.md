# Replacement and recovery

## Behavior

Inspect, preview and explicitly confirm replacement. Save durable private recovery first, then replace business rows in one transaction and reload. Cancelled selection/confirmation preserves data. Browser persistence errors after SQL commit retain recovery.

## Implementation

[app/services/backup/recovery.ts](../app/services/backup/recovery.ts).

## Acceptance checks

Inject import insertion failure and verify rollback/recovery. Cancel import and export the previous dataset from recovery.

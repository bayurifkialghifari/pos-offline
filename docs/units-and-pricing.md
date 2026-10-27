# Units and pricing

## Behavior

Idempotent pcs/kg/liter seeds; custom count/weight/volume definitions and activation. Factors are immutable after use. Decimal dot/comma quantity is constrained to integral base precision. Nominal mode charges the requested integer rupiah and rounds stock to nearest base unit.

## Implementation

[app/lib/quantity.ts](../app/lib/quantity.ts).

## Acceptance checks

Rp15,000/kg + Rp10,000 charges exactly Rp10,000, deducts 667g and displays approximately 0.667kg. Reject unsafe/zero/sub-base quantities.

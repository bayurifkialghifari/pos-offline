# Service Guide

Services own complete business operations, with repositories responsible for SQL. Keep checkout, sale completion, stock deductions and cashflow in one transaction. Aggregate product demand across cart lines; Open Bills never reserve stock and revalidate on completion. Void is idempotent and restores recorded base quantities. Closed-session history must remain stable.

Nominal pricing charges the requested rupiah exactly. Derive base quantity with integer half-up rounding and retain mode, requested amount and snapshots through history, receipts, backups and voids. Cart draft persistence is device-local and separate from portable Open Bills.

Backup imports validate bounded ZIP contents, checksums, schema and references before touching live data. Reinspect at confirmation, write a durable recovery copy, then replace transactionally. Preserve the allowlist of portable settings. Spreadsheet imports reject formulas and bounded archive violations. Updates are user-triggered and scoped to this repository's releases. Hardware capabilities expose unavailable states instead of pretending success.

Keep direct regression tests with implementation changes. Run bun run check and applicable rendered browser flows. Record hardware tests separately from browser and Android build evidence.

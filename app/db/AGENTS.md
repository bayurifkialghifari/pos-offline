# Database Guide

The database name is posoffline and the fresh schema version is 1. Existing POS Kacaw databases are separate. Default seeds contain units and cashflow categories only; no demo products or sales. New schema changes need an ordered migration and a restart check.

SqliteDb serializes operations on the shared connection. Inside a transaction use the supplied tx instance for every query/write; never call the global connection or persist() from its callback. Persist the browser store only after commit. Keep foreign keys enabled and bind user values through SQL parameters.

Money is integer rupiah; quantities are integer base units. Sales and Open Bills preserve unit, price and quantity snapshots. Include every portable business table in backup validation and replacement; do not export credentials or device preferences. Regression tests use the real SQL.js adapter in tests/unit/database.ts to verify rollback and concurrent stock checks.

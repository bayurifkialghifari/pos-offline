import type { Db } from "./types"

const LOCAL_COLUMNS =
  "created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, deleted_at INTEGER"
export const SCHEMA_VERSION = 1

export async function runMigrations(db: Db): Promise<void> {
  await db.execute(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at INTEGER NOT NULL);",
  )
  const applied = await db.query<{ version: number }>(
    "SELECT version FROM schema_migrations",
  )
  if (applied.some((row) => row.version === SCHEMA_VERSION)) return
  await db.transaction(async (tx) => {
    await tx.execute(
      [
        "CREATE TABLE units (id TEXT PRIMARY KEY, label TEXT NOT NULL, symbol TEXT NOT NULL UNIQUE, dimension TEXT NOT NULL CHECK(dimension IN ('count','weight','volume')), factor INTEGER NOT NULL CHECK(factor > 0), active INTEGER NOT NULL DEFAULT 1, " +
          LOCAL_COLUMNS +
          ");",
        "CREATE TABLE categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, color TEXT, " +
          LOCAL_COLUMNS +
          ");",
        "CREATE TABLE products (id TEXT PRIMARY KEY, category_id TEXT REFERENCES categories(id), unit_id TEXT NOT NULL REFERENCES units(id), name TEXT NOT NULL, sku TEXT, barcode TEXT, barcode_type TEXT NOT NULL DEFAULT 'EAN13', price INTEGER NOT NULL CHECK(price >= 0), cost INTEGER NOT NULL DEFAULT 0 CHECK(cost >= 0), track_stock INTEGER NOT NULL DEFAULT 0, stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0), image_path TEXT, active INTEGER NOT NULL DEFAULT 1, " +
          LOCAL_COLUMNS +
          ");",
        "CREATE TABLE cashier_sessions (id TEXT PRIMARY KEY, opened_at INTEGER NOT NULL, closed_at INTEGER, opening_cash INTEGER NOT NULL DEFAULT 0, expected_cash INTEGER NOT NULL DEFAULT 0, counted_cash INTEGER, difference INTEGER, status TEXT NOT NULL CHECK(status IN ('open','closed')), opened_by TEXT, note TEXT, " +
          LOCAL_COLUMNS +
          ");",
        "CREATE TABLE sales (id TEXT PRIMARY KEY, session_id TEXT REFERENCES cashier_sessions(id), number TEXT NOT NULL UNIQUE, subtotal INTEGER NOT NULL, discount INTEGER NOT NULL DEFAULT 0, tax INTEGER NOT NULL DEFAULT 0, total INTEGER NOT NULL, paid INTEGER NOT NULL, change_due INTEGER NOT NULL, payment_method TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('open','completed','void')), open_bill_label TEXT, opened_at INTEGER, origin_device_id TEXT, sold_at INTEGER, " +
          LOCAL_COLUMNS +
          ");",
        "CREATE TABLE sale_items (id TEXT PRIMARY KEY, sale_id TEXT NOT NULL REFERENCES sales(id), product_id TEXT REFERENCES products(id), name_snapshot TEXT NOT NULL, price_snapshot INTEGER NOT NULL, qty REAL NOT NULL, stock_tracked INTEGER NOT NULL, line_id TEXT NOT NULL, unit_id TEXT NOT NULL, unit_label TEXT NOT NULL, unit_symbol TEXT NOT NULL, unit_dimension TEXT NOT NULL, unit_factor INTEGER NOT NULL, base_qty INTEGER NOT NULL CHECK(base_qty > 0), input_mode TEXT NOT NULL CHECK(input_mode IN ('quantity','nominal')), requested_nominal INTEGER, discount INTEGER NOT NULL DEFAULT 0, line_total INTEGER NOT NULL, " +
          LOCAL_COLUMNS +
          ");",
        "CREATE TABLE cashflow_categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('income','expense')), is_system INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL DEFAULT 0, " +
          LOCAL_COLUMNS +
          ");",
        "CREATE TABLE cashflow_entries (id TEXT PRIMARY KEY, category_id TEXT REFERENCES cashflow_categories(id), session_id TEXT REFERENCES cashier_sessions(id), direction TEXT NOT NULL CHECK(direction IN ('debit','credit')), amount INTEGER NOT NULL CHECK(amount >= 0), source TEXT NOT NULL CHECK(source IN ('manual','sale')), source_ref TEXT, note TEXT, occurred_at INTEGER NOT NULL, " +
          LOCAL_COLUMNS +
          ");",
        "CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL);",
        "CREATE TABLE media (id TEXT PRIMARY KEY, mime TEXT NOT NULL, width INTEGER, height INTEGER, bytes INTEGER, hash TEXT, data TEXT NOT NULL, " +
          LOCAL_COLUMNS +
          ");",
        "CREATE INDEX idx_products_category ON products(category_id);",
        "CREATE INDEX idx_products_barcode ON products(barcode);",
        "CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);",
        "CREATE INDEX idx_sales_time ON sales(status, sold_at);",
        "CREATE INDEX idx_cashflow_session ON cashflow_entries(session_id);",
        "CREATE INDEX idx_cashflow_time ON cashflow_entries(occurred_at);",
        "CREATE INDEX idx_media_hash ON media(hash);",
        "CREATE UNIQUE INDEX idx_open_session ON cashier_sessions(status) WHERE status = 'open' AND deleted_at IS NULL;",
        "CREATE TRIGGER immutable_unit BEFORE UPDATE OF dimension, factor ON units WHEN (NEW.dimension <> OLD.dimension OR NEW.factor <> OLD.factor) AND (EXISTS(SELECT 1 FROM products WHERE unit_id = OLD.id) OR EXISTS(SELECT 1 FROM sale_items WHERE unit_id = OLD.id)) BEGIN SELECT RAISE(ABORT, 'Referenced unit conversion is immutable'); END;",
        "CREATE TRIGGER immutable_product_unit BEFORE UPDATE OF unit_id ON products WHEN NEW.unit_id <> OLD.unit_id AND (OLD.stock <> 0 OR EXISTS(SELECT 1 FROM sale_items WHERE product_id = OLD.id)) BEGIN SELECT RAISE(ABORT, 'Product unit cannot change with stock or sales'); END;",
      ].join("\n"),
    )
    await tx.run("INSERT INTO schema_migrations VALUES (?, ?, ?)", [
      SCHEMA_VERSION,
      "offline-initial-schema",
      Date.now(),
    ])
  })
}

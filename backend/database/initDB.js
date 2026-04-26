const db = require("./db");

db.exec(`
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_id INTEGER,
  unit TEXT,
  cost_price REAL NOT NULL DEFAULT 0,
  retail_price REAL NOT NULL DEFAULT 0,
  wholesale_price REAL NOT NULL DEFAULT 0,

  base_unit TEXT DEFAULT 'unit',
  cost_price_base REAL NOT NULL DEFAULT 0,

  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS product_units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  unit_name TEXT NOT NULL,
  conversion_qty INTEGER NOT NULL DEFAULT 1,
  retail_price REAL NOT NULL DEFAULT 0,
  wholesale_price REAL NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_no TEXT NOT NULL UNIQUE,
  sale_date TEXT DEFAULT CURRENT_TIMESTAMP,
  subtotal REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  note TEXT
);

CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name_snapshot TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price_type TEXT NOT NULL CHECK(price_type IN ('retail', 'wholesale')),
  unit_price REAL NOT NULL,
  cost_price_snapshot REAL NOT NULL,
  total_price REAL NOT NULL,
  profit REAL NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  movement_type TEXT NOT NULL CHECK(movement_type IN ('stock_in', 'sale', 'adjustment', 'damage', 'expired')),
  quantity INTEGER NOT NULL,
  old_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reference_type TEXT,
  reference_id INTEGER,
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
`);

console.log("Database tables created successfully.");
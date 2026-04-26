const db = require("./db");

function columnExists(table, column) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  return columns.some((col) => col.name === column);
}

const migrate = db.transaction(() => {
  if (!columnExists("products", "base_unit")) {
    db.prepare(`
      ALTER TABLE products ADD COLUMN base_unit TEXT DEFAULT 'unit'
    `).run();
  }

  if (!columnExists("products", "cost_price_base")) {
    db.prepare(`
      ALTER TABLE products ADD COLUMN cost_price_base REAL DEFAULT 0
    `).run();
  }

  db.exec(`
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
  `);

  const products = db.prepare(`SELECT * FROM products`).all();

  for (const product of products) {
    const existingUnit = db
      .prepare(`SELECT * FROM product_units WHERE product_id = ? LIMIT 1`)
      .get(product.id);

    if (!existingUnit) {
      db.prepare(`
        INSERT INTO product_units (
          product_id,
          unit_name,
          conversion_qty,
          retail_price,
          wholesale_price
        )
        VALUES (?, ?, ?, ?, ?)
      `).run(
        product.id,
        product.unit || product.base_unit || "unit",
        1,
        product.retail_price || 0,
        product.wholesale_price || 0
      );
    }

    db.prepare(`
      UPDATE products
      SET 
        base_unit = COALESCE(base_unit, unit, 'unit'),
        cost_price_base = CASE
          WHEN cost_price_base = 0 THEN COALESCE(cost_price, 0)
          ELSE cost_price_base
        END
      WHERE id = ?
    `).run(product.id);
  }
});

migrate();

console.log("Product units migration completed successfully.");
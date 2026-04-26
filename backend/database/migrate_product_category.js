const db = require("./db");

function columnExists(table, column) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  return columns.some((col) => col.name === column);
}

if (!columnExists("products", "category")) {
  db.prepare(`
    ALTER TABLE products ADD COLUMN category TEXT DEFAULT 'beer'
  `).run();

  console.log("Added category column to products table.");
} else {
  console.log("Category column already exists.");
}
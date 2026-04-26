const express = require("express");
const db = require("../database/db");

const router = express.Router();

// Add stock when buying from supplier
router.post("/in", (req, res) => {
  const { product_id, quantity, note } = req.body;

  if (!product_id || !quantity || quantity <= 0) {
    return res.status(400).json({
      message: "product_id and quantity greater than 0 are required",
    });
  }

  const product = db.prepare("SELECT * FROM products WHERE id = ? AND active = 1").get(product_id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const oldStock = product.current_stock;
  const newStock = oldStock + quantity;

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE products
      SET current_stock = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStock, product_id);

    db.prepare(`
      INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity,
        old_stock,
        new_stock,
        reference_type,
        reference_id,
        note
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      product_id,
      "stock_in",
      quantity,
      oldStock,
      newStock,
      "manual",
      null,
      note || "Stock added"
    );
  });

  transaction();

  res.json({
    message: "Stock added successfully",
    product_id,
    old_stock: oldStock,
    added_quantity: quantity,
    new_stock: newStock,
  });
});

// Adjust stock for correction, damage, expired
router.post("/adjust", (req, res) => {
  const { product_id, quantity, movement_type, note } = req.body;

  const allowedTypes = ["adjustment", "damage", "expired"];

  if (!product_id || quantity === undefined || !allowedTypes.includes(movement_type)) {
    return res.status(400).json({
      message: "product_id, quantity, and valid movement_type are required",
      allowed_movement_types: allowedTypes,
    });
  }

  const product = db.prepare("SELECT * FROM products WHERE id = ? AND active = 1").get(product_id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const oldStock = product.current_stock;
  const newStock = oldStock + quantity;

  if (newStock < 0) {
    return res.status(400).json({
      message: "Stock cannot be negative",
      current_stock: oldStock,
    });
  }

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE products
      SET current_stock = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStock, product_id);

    db.prepare(`
      INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity,
        old_stock,
        new_stock,
        reference_type,
        reference_id,
        note
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      product_id,
      movement_type,
      quantity,
      oldStock,
      newStock,
      "manual",
      null,
      note || "Stock adjusted"
    );
  });

  transaction();

  res.json({
    message: "Stock adjusted successfully",
    product_id,
    movement_type,
    old_stock: oldStock,
    quantity,
    new_stock: newStock,
  });
});

// View stock movement history
router.get("/movements", (req, res) => {
  const movements = db
    .prepare(`
      SELECT
        stock_movements.*,
        products.name AS product_name
      FROM stock_movements
      JOIN products ON stock_movements.product_id = products.id
      ORDER BY stock_movements.created_at DESC
    `)
    .all();

  res.json(movements);
});

// View movement history for one product
router.get("/movements/:productId", (req, res) => {
  const movements = db
    .prepare(`
      SELECT
        stock_movements.*,
        products.name AS product_name
      FROM stock_movements
      JOIN products ON stock_movements.product_id = products.id
      WHERE stock_movements.product_id = ?
      ORDER BY stock_movements.created_at DESC
    `)
    .all(req.params.productId);

  res.json(movements);
});

module.exports = router;
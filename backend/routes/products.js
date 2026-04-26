const express = require("express");
const db = require("../database/db");

const router = express.Router();

// Get all active products
router.get("/", (req, res) => {
  const products = db.prepare(`SELECT * FROM products WHERE active = 1`).all();

  const result = products.map((product) => {
    const units = db
      .prepare(`SELECT * FROM product_units WHERE product_id = ? AND active = 1`)
      .all(product.id);

    return {
      ...product,
      units,
    };
  });

  res.json(result);
});

// Get single product
router.get("/:id", (req, res) => {
  const product = db
    .prepare(`
      SELECT 
        products.*,
        categories.name AS category_name
      FROM products
      LEFT JOIN categories ON products.category_id = categories.id
      WHERE products.id = ?
    `)
    .get(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
});

// Create product
router.post("/", (req, res) => {
  const {
    name,
    category,
    category_id,
    base_unit,
    cost_price_base,
    current_stock,
    min_stock,
    units,
  } = req.body;

  if (!name || !base_unit) {
    return res.status(400).json({ message: "Name and base unit required" });
  }

  if (!units || units.length === 0) {
    return res.status(400).json({ message: "At least one unit is required" });
  }

  try {
    const transaction = db.transaction(() => {
      const result = db
        .prepare(`
          INSERT INTO products (
            name,
            category,
            category_id,
            unit,
            base_unit,
            cost_price_base,
            current_stock,
            min_stock
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          name,
          category || "beer",
          category_id || null,
          base_unit,
          base_unit,
          Number(cost_price_base || 0),
          Number(current_stock || 0),
          Number(min_stock || 0)
        );

      const productId = result.lastInsertRowid;

      for (const unit of units) {
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
          productId,
          unit.unit_name,
          Number(unit.conversion_qty || 1),
          Number(unit.retail_price || 0),
          Number(unit.wholesale_price || 0)
        );
      }

      return productId;
    });

    const productId = transaction();

    res.status(201).json({
      message: "Product created successfully",
      product_id: productId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update product
// Update product with units
router.put("/:id", (req, res) => {

  

  const productId = req.params.id;

  const {
    name,
    category_id,
    base_unit,
    cost_price_base,
    current_stock,
    min_stock,
    units,
  } = req.body;

  const product = db
    .prepare("SELECT * FROM products WHERE id = ? AND active = 1")
    .get(productId);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (!name || !base_unit) {
    return res.status(400).json({
      message: "Product name and base unit are required",
    });
  }

  if (!units || !Array.isArray(units) || units.length === 0) {
    return res.status(400).json({
      message: "At least one selling unit is required",
    });
  }

  for (const unit of units) {
    if (!unit.unit_name || Number(unit.conversion_qty) <= 0) {
      return res.status(400).json({
        message: "Each unit must have unit_name and conversion_qty greater than 0",
      });
    }
  }

  try {
    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE products
SET
  name = ?,
  category = ?,
  category_id = ?,
  unit = ?,
  base_unit = ?,
  cost_price_base = ?,
  current_stock = ?,
  min_stock = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?
      `).run(
        name,
        category_id || null,
        base_unit,
        base_unit,
        Number(cost_price_base || 0),
        Number(current_stock || 0),
        Number(min_stock || 0),
        productId
      );

      // Soft-disable old units
      db.prepare(`
        UPDATE product_units
        SET active = 0
        WHERE product_id = ?
      `).run(productId);

      // Insert new unit rows
      for (const unit of units) {
        db.prepare(`
          INSERT INTO product_units (
            product_id,
            unit_name,
            conversion_qty,
            retail_price,
            wholesale_price,
            active
          )
          VALUES (?, ?, ?, ?, ?, 1)
        `).run(
          productId,
          unit.unit_name,
          Number(unit.conversion_qty || 1),
          Number(unit.retail_price || 0),
          Number(unit.wholesale_price || 0)
        );
      }
    });

    const {
  name,
  category,
  category_id,
  base_unit,
  cost_price_base,
  current_stock,
  min_stock,
  units,
} = req.body;

    transaction();

    const updatedProduct = db
      .prepare("SELECT * FROM products WHERE id = ?")
      .get(productId);

    const updatedUnits = db
      .prepare(`
        SELECT *
        FROM product_units
        WHERE product_id = ? AND active = 1
      `)
      .all(productId);

    res.json({
      message: "Product updated successfully",
      product: {
        ...updatedProduct,
        units: updatedUnits,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
   
 
  
});

// Disable product instead of deleting
router.delete("/:id", (req, res) => {
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  db.prepare(`
    UPDATE products
    SET active = 0, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);

  res.json({ message: "Product disabled successfully" });
});




module.exports = router;
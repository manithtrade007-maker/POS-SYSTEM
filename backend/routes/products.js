const express = require("express");
const db = require("../database/db");

const router = express.Router();

function getActiveUnits(productId) {
  return db
    .prepare(
      `
        SELECT *
        FROM product_units
        WHERE product_id = ? AND active = 1
        ORDER BY conversion_qty ASC, id ASC
      `,
    )
    .all(productId);
}

function attachUnits(product) {
  return {
    ...product,
    units: getActiveUnits(product.id),
  };
}

function normalizeProductPayload(body) {
  const name = String(body.name || "").trim();
  const category = String(body.category || "beer").trim() || "beer";
  const baseUnit = String(body.base_unit || "").trim();
  const units = Array.isArray(body.units) ? body.units : [];
  const costPriceBase = Number(body.cost_price_base ?? 0);
  const currentStock = Number(body.current_stock ?? 0);
  const minStock = Number(body.min_stock ?? 0);

  if (!name || !baseUnit) {
    return { error: "Product name and base unit are required" };
  }

  if (!Number.isFinite(costPriceBase) || costPriceBase < 0) {
    return { error: "Cost price must be a valid number" };
  }

  if (!Number.isFinite(currentStock) || currentStock < 0) {
    return { error: "Current stock must be a valid number" };
  }

  if (!Number.isFinite(minStock) || minStock < 0) {
    return { error: "Minimum stock must be a valid number" };
  }

  if (units.length === 0) {
    return { error: "At least one selling unit is required" };
  }

  const normalizedUnits = [];

  for (const unit of units) {
    const unitName = String(unit.unit_name || "").trim();
    const conversionQty = Number(unit.conversion_qty ?? 1);
    const retailPrice = Number(unit.retail_price ?? 0);
    const wholesalePrice = Number(unit.wholesale_price ?? 0);

    if (!unitName || !Number.isFinite(conversionQty) || conversionQty <= 0) {
      return {
        error: "Each unit must have a name and conversion quantity above 0",
      };
    }

    if (
      !Number.isFinite(retailPrice) ||
      retailPrice < 0 ||
      !Number.isFinite(wholesalePrice) ||
      wholesalePrice < 0
    ) {
      return { error: "Unit prices must be valid numbers" };
    }

    normalizedUnits.push({
      unit_name: unitName,
      conversion_qty: conversionQty,
      retail_price: retailPrice,
      wholesale_price: wholesalePrice,
    });
  }

  return {
    product: {
      name,
      category,
      category_id: body.category_id || null,
      base_unit: baseUnit,
      cost_price_base: costPriceBase,
      current_stock: currentStock,
      min_stock: minStock,
      units: normalizedUnits,
    },
  };
}

router.get("/", (req, res) => {
  const products = db
    .prepare(
      `
        SELECT *
        FROM products
        WHERE active = 1
        ORDER BY name COLLATE NOCASE ASC, id ASC
      `,
    )
    .all();

  res.json(products.map(attachUnits));
});

router.get("/:id", (req, res) => {
  const product = db
    .prepare(
      `
        SELECT
          products.*,
          categories.name AS category_name
        FROM products
        LEFT JOIN categories ON products.category_id = categories.id
        WHERE products.id = ? AND products.active = 1
      `,
    )
    .get(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(attachUnits(product));
});

router.post("/", (req, res) => {
  const { product, error } = normalizeProductPayload(req.body);

  if (error) {
    return res.status(400).json({ message: error });
  }

  try {
    const createProduct = db.transaction((payload) => {
      const result = db
        .prepare(
          `
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
          `,
        )
        .run(
          payload.name,
          payload.category,
          payload.category_id,
          payload.base_unit,
          payload.base_unit,
          payload.cost_price_base,
          payload.current_stock,
          payload.min_stock,
        );

      const productId = result.lastInsertRowid;

      for (const unit of payload.units) {
        db.prepare(
          `
            INSERT INTO product_units (
              product_id,
              unit_name,
              conversion_qty,
              retail_price,
              wholesale_price
            )
            VALUES (?, ?, ?, ?, ?)
          `,
        ).run(
          productId,
          unit.unit_name,
          unit.conversion_qty,
          unit.retail_price,
          unit.wholesale_price,
        );
      }

      return productId;
    });

    const productId = createProduct(product);

    res.status(201).json({
      message: "Product created successfully",
      product_id: productId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", (req, res) => {
  const productId = req.params.id;
  const { product, error } = normalizeProductPayload(req.body);

  if (error) {
    return res.status(400).json({ message: error });
  }

  const existingProduct = db
    .prepare("SELECT * FROM products WHERE id = ? AND active = 1")
    .get(productId);

  if (!existingProduct) {
    return res.status(404).json({ message: "Product not found" });
  }

  try {
    const updateProduct = db.transaction((payload) => {
      db.prepare(
        `
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
        `,
      ).run(
        payload.name,
        payload.category,
        payload.category_id,
        payload.base_unit,
        payload.base_unit,
        payload.cost_price_base,
        payload.current_stock,
        payload.min_stock,
        productId,
      );

      db.prepare(
        `
          UPDATE product_units
          SET active = 0
          WHERE product_id = ?
        `,
      ).run(productId);

      for (const unit of payload.units) {
        db.prepare(
          `
            INSERT INTO product_units (
              product_id,
              unit_name,
              conversion_qty,
              retail_price,
              wholesale_price,
              active
            )
            VALUES (?, ?, ?, ?, ?, 1)
          `,
        ).run(
          productId,
          unit.unit_name,
          unit.conversion_qty,
          unit.retail_price,
          unit.wholesale_price,
        );
      }
    });

    updateProduct(product);

    const updatedProduct = db
      .prepare("SELECT * FROM products WHERE id = ?")
      .get(productId);

    res.json({
      message: "Product updated successfully",
      product: attachUnits(updatedProduct),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", (req, res) => {
  const product = db
    .prepare("SELECT * FROM products WHERE id = ? AND active = 1")
    .get(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  db.prepare(
    `
      UPDATE products
      SET active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
  ).run(req.params.id);

  res.json({ message: "Product disabled successfully" });
});

module.exports = router;

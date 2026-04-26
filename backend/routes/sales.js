const express = require("express");
const db = require("../database/db");


const router = express.Router();


function generateInvoiceNo() {
  const now = new Date();

  const datePart = now.toISOString().slice(0, 10).replaceAll("-", "");

  const count = db
    .prepare(`
      SELECT COUNT(*) AS total
      FROM sales
      WHERE DATE(sale_date) = DATE('now')
    `)
    .get();

  const number = String(count.total + 1).padStart(4, "0");

  return `INV-${datePart}-${number}`;
}


// Get all sales / invoice history
router.get("/", (req, res) => {
  const sales = db
    .prepare(`
      SELECT *
      FROM sales
      ORDER BY sale_date DESC
    `)
    .all();

  res.json(sales);
});

// Get invoice detail
router.get("/:id", (req, res) => {
  const sale = db
    .prepare(`
      SELECT *
      FROM sales
      WHERE id = ?
    `)
    .get(req.params.id);

  if (!sale) {
    return res.status(404).json({ message: "Sale not found" });
  }

  const items = db
    .prepare(`
      SELECT *
      FROM sale_items
      WHERE sale_id = ?
    `)
    .all(req.params.id);

  res.json({
    sale,
    items,
  });
});

// Create sale / invoice
router.post("/", (req, res) => {
  const { items, discount = 0, payment_method = "cash", note = "" } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "Sale items are required",
    });
  }

  try {
    const transaction = db.transaction(() => {
      let subtotal = 0;
      let totalProfit = 0;

      const invoiceNo = generateInvoiceNo();

      const checkedItems = items.map((item) => {
        const { product_id, product_unit_id, quantity, price_type } = item;

        if (!product_id || !product_unit_id || !quantity || quantity <= 0) {
          throw new Error(
            "Each item needs product_id, product_unit_id, and quantity greater than 0"
          );
        }

        if (!["retail", "wholesale"].includes(price_type)) {
          throw new Error("price_type must be retail or wholesale");
        }

        const product = db
          .prepare("SELECT * FROM products WHERE id = ? AND active = 1")
          .get(product_id);

        if (!product) {
          throw new Error(`Product not found: ${product_id}`);
        }

        const unit = db
          .prepare(
            `
            SELECT *
            FROM product_units
            WHERE id = ?
              AND product_id = ?
              AND active = 1
          `
          )
          .get(product_unit_id, product_id);

        if (!unit) {
          throw new Error(`Selling unit not found for product: ${product.name}`);
        }

        const stockToDeduct = quantity * unit.conversion_qty;

        if (product.current_stock < stockToDeduct) {
          throw new Error(
            `Not enough stock for ${product.name}. Available: ${product.current_stock} ${product.base_unit}`
          );
        }

        const unitPrice =
          price_type === "retail" ? unit.retail_price : unit.wholesale_price;

        const totalPrice = unitPrice * quantity;

        const costPerSellingUnit =
          product.cost_price_base * unit.conversion_qty;

        const profit = (unitPrice - costPerSellingUnit) * quantity;

        subtotal += totalPrice;
        totalProfit += profit;

        return {
          product,
          unit,
          quantity,
          price_type,
          unitPrice,
          totalPrice,
          profit,
          stockToDeduct,
        };
      });

      const total = subtotal - discount;

      const saleResult = db
        .prepare(
          `
          INSERT INTO sales (
            invoice_no,
            subtotal,
            discount,
            total,
            payment_method,
            note
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `
        )
        .run(invoiceNo, subtotal, discount, total, payment_method, note);

      const saleId = saleResult.lastInsertRowid;

      for (const item of checkedItems) {
        const oldStock = item.product.current_stock;
        const newStock = oldStock - item.stockToDeduct;

        db.prepare(
          `
          INSERT INTO sale_items (
            sale_id,
            product_id,
            product_name_snapshot,
            quantity,
            price_type,
            unit_price,
            cost_price_snapshot,
            total_price,
            profit
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        ).run(
          saleId,
          item.product.id,
          `${item.product.name} - ${item.unit.unit_name}`,
          item.quantity,
          item.price_type,
          item.unitPrice,
          item.product.cost_price_base * item.unit.conversion_qty,
          item.totalPrice,
          item.profit
        );

        db.prepare(
          `
          UPDATE products
          SET current_stock = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `
        ).run(newStock, item.product.id);

        db.prepare(
          `
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
        `
        ).run(
          item.product.id,
          "sale",
          -item.stockToDeduct,
          oldStock,
          newStock,
          "sale",
          saleId,
          `Sold ${item.quantity} ${item.unit.unit_name} in invoice ${invoiceNo}`
        );
      }

      return {
        sale_id: saleId,
        invoice_no: invoiceNo,
        subtotal,
        discount,
        total,
        profit: totalProfit,
        payment_method,
      };
    });

    const result = transaction();

    res.status(201).json({
      message: "Sale created successfully",
      sale: result,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

module.exports = router;
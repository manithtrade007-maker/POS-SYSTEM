const express = require("express");
const db = require("../database/db");

const router = express.Router();

// Daily summary
router.get("/daily", (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);

  const summary = db
    .prepare(`
      SELECT
        COUNT(*) AS total_invoices,
        IFNULL(SUM(subtotal), 0) AS subtotal,
        IFNULL(SUM(discount), 0) AS total_discount,
        IFNULL(SUM(total), 0) AS total_sales
      FROM sales
      WHERE DATE(sale_date) = DATE(?)
    `)
    .get(date);

  const profit = db
    .prepare(`
      SELECT
        IFNULL(SUM(profit), 0) AS total_profit
      FROM sale_items
      JOIN sales ON sale_items.sale_id = sales.id
      WHERE DATE(sales.sale_date) = DATE(?)
    `)
    .get(date);

  res.json({
    date,
    total_invoices: summary.total_invoices,
    subtotal: summary.subtotal,
    total_discount: summary.total_discount,
    total_sales: summary.total_sales,
    total_profit: profit.total_profit,
  });
});

// Items sold by date
router.get("/items-sold", (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);

  const items = db
    .prepare(`
      SELECT
        sale_items.product_id,
        sale_items.product_name_snapshot AS product_name,
        SUM(sale_items.quantity) AS total_quantity,
        SUM(sale_items.total_price) AS total_sales,
        SUM(sale_items.profit) AS total_profit
      FROM sale_items
      JOIN sales ON sale_items.sale_id = sales.id
      WHERE DATE(sales.sale_date) = DATE(?)
      GROUP BY sale_items.product_id, sale_items.product_name_snapshot
      ORDER BY total_quantity DESC
    `)
    .all(date);

  res.json({
    date,
    items,
  });
});

// Low stock products
router.get("/low-stock", (req, res) => {
  const products = db
    .prepare(`
      SELECT
        id,
        name,
        unit,
        current_stock,
        min_stock
      FROM products
      WHERE active = 1
        AND current_stock <= min_stock
      ORDER BY current_stock ASC
    `)
    .all();

  res.json(products);
});

// Top selling products
router.get("/top-products", (req, res) => {
  const limit = Number(req.query.limit) || 10;

  const products = db
    .prepare(`
      SELECT
        sale_items.product_id,
        sale_items.product_name_snapshot AS product_name,
        SUM(sale_items.quantity) AS total_quantity_sold,
        SUM(sale_items.total_price) AS total_sales,
        SUM(sale_items.profit) AS total_profit
      FROM sale_items
      GROUP BY sale_items.product_id, sale_items.product_name_snapshot
      ORDER BY total_quantity_sold DESC
      LIMIT ?
    `)
    .all(limit);

  res.json(products);
});

module.exports = router;
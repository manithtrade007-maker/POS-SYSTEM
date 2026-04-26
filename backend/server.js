const express = require("express");
const cors = require("cors");
const db = require("./database/db");
const productRoutes = require("./routes/products");
const stockRoutes = require("./routes/stock");
const salesRoutes = require("./routes/sales");
const reportRoutes = require("./routes/reports");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "POS backend is running" });
});

app.get("/health/db", (req, res) => {
  const result = db.prepare("SELECT datetime('now') as now").get();

  res.json({
    message: "SQLite database connected",
    time: result.now,
  });
});

app.use("/api/stock", stockRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/reports", reportRoutes);

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";

export default function Dashboard() {
  const [daily, setDaily] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const dailyData = await apiRequest("/reports/daily");
      const topData = await apiRequest("/reports/top-products?limit=5");
      const lowStockData = await apiRequest("/reports/low-stock");

      setDaily(dailyData);
      setTopProducts(topData);
      setLowStock(lowStockData);
    } catch (error) {
      alert("Failed to load dashboard");
      console.error(error);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Today&apos;s sales, profit, top products, and stock alerts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="text-3xl font-black mt-2">
            ${Number(daily?.total_sales || 0).toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm text-gray-500">Profit</p>
          <p className="text-3xl font-black mt-2">
            ${Number(daily?.total_profit || 0).toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm text-gray-500">Invoices</p>
          <p className="text-3xl font-black mt-2">
            {daily?.total_invoices || 0}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm text-gray-500">Low Stock</p>
          <p className="text-3xl font-black mt-2">{lowStock.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-xl font-black mb-4">Top Products</h2>

          {topProducts.length === 0 ? (
            <p className="text-gray-400">No sales yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, index) => (
                <div
                  key={p.product_id}
                  className="flex items-center justify-between rounded-2xl bg-gray-50 p-4"
                >
                  <div>
                    <p className="font-bold text-gray-900">
                      #{index + 1} {p.product_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Sold: {p.total_quantity_sold}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-black">
                      ${Number(p.total_sales || 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-green-600 font-bold">
                      Profit ${Number(p.total_profit || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-xl font-black mb-4">Low Stock Alerts</h2>

          {lowStock.length === 0 ? (
            <p className="text-gray-400">All products have enough stock.</p>
          ) : (
            <div className="space-y-3">
              {lowStock.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl bg-red-50 p-4"
                >
                  <div>
                    <p className="font-bold text-red-900">{p.name}</p>
                    <p className="text-sm text-red-600">
                      Minimum stock: {p.min_stock}
                    </p>
                  </div>

                  <p className="font-black text-red-700">
                    {p.current_stock} left
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
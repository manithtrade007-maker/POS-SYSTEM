import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";

export default function Reports() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [daily, setDaily] = useState(null);
  const [itemsSold, setItemsSold] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    loadReports();
  }, [date]);

  async function loadReports() {
    try {
      const dailyData = await apiRequest(`/reports/daily?date=${date}`);
      const itemsData = await apiRequest(`/reports/items-sold?date=${date}`);
      const topData = await apiRequest("/reports/top-products?limit=10");

      setDaily(dailyData);
      setItemsSold(itemsData.items || []);
      setTopProducts(topData);
    } catch (error) {
      alert("Failed to load reports");
      console.error(error);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">
            Sales, profit, and product performance.
          </p>
        </div>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-2xl border border-gray-200 px-4 py-3 bg-white"
        />
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
          <p className="text-sm text-gray-500">Discount</p>
          <p className="text-3xl font-black mt-2">
            ${Number(daily?.total_discount || 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-xl font-black mb-4">Items Sold on {date}</h2>

          {itemsSold.length === 0 ? (
            <p className="text-gray-400">No items sold on this date.</p>
          ) : (
            <div className="space-y-3">
              {itemsSold.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center justify-between rounded-2xl bg-gray-50 p-4"
                >
                  <div>
                    <p className="font-bold text-gray-900">
                      {item.product_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Quantity sold: {item.total_quantity}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-black">
                      ${Number(item.total_sales || 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-green-600 font-bold">
                      Profit ${Number(item.total_profit || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-xl font-black mb-4">All-Time Top Products</h2>

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
      </div>
    </div>
  );
}
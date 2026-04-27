import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function todayCambodiaDate() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Phnom_Penh",
  });
}

function StatCard({ title, value, sub }) {
  return (
    <div className="rounded-3xl bg-white border border-gray-200 p-5 shadow-sm">
      <p className="text-sm font-bold text-gray-500">{title}</p>
      <p className="text-3xl font-black text-gray-900 mt-2">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Reports() {
  const [selectedDate, setSelectedDate] = useState(todayCambodiaDate());
  const [summary, setSummary] = useState(null);
  const [itemsSold, setItemsSold] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, [selectedDate]);

  async function loadReports() {
    try {
      setLoading(true);

      const [dailyData, itemsData, topData, lowStockData] = await Promise.all([
        apiRequest(`/reports/daily?date=${selectedDate}`),
        apiRequest(`/reports/items-sold?date=${selectedDate}`),
        apiRequest("/reports/top-products?limit=10"),
        apiRequest("/reports/low-stock"),
      ]);

      setSummary(dailyData);
      setItemsSold(itemsData.items || []);
      setTopProducts(topData || []);
      setLowStock(lowStockData || []);
    } catch (error) {
      alert("បរាជ័យក្នុងការទាញយករបាយការណ៍");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const totalSales = Number(summary?.total_sales || 0);
  const totalProfit = Number(summary?.total_profit || 0);
  const totalInvoices = Number(summary?.total_invoices || 0);
  const totalDiscount = Number(summary?.total_discount || 0);

  const averageInvoice =
    totalInvoices > 0 ? totalSales / totalInvoices : 0;

  const profitMargin =
    totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">របាយការណ៍</h1>
          <p className="text-gray-500 mt-1">
            មើលព័ត៌មានលក់ ចំណេញ ស្តុក និងផលិតផលលក់ដាច់
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-gray-200 p-2 shadow-sm">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl px-4 py-3 font-bold text-gray-900 outline-none"
          />
        </div>
      </div>

      {loading && (
        <div className="mb-5 rounded-3xl bg-white border border-gray-200 p-5 text-gray-400">
          កំពុងទាញយកទិន្នន័យ...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="សរុបលក់" value={money(totalSales)} />
        <StatCard title="ចំណេញ" value={money(totalProfit)} />
        <StatCard title="វិក្កយបត្រ" value={totalInvoices} />
        <StatCard title="បញ្ចុះតម្លៃ" value={money(totalDiscount)} />
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="មធ្យមក្នុងមួយវិក្កយបត្រ"
          value={money(averageInvoice)}
        />
        <StatCard
          title="ភាគរយចំណេញ"
          value={`${profitMargin.toFixed(1)}%`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <section className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5">
          <div className="mb-5">
            <h2 className="text-xl font-black text-gray-900">
              ផលិតផលលក់បាន
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              ថ្ងៃទី {selectedDate}
            </p>
          </div>

          {itemsSold.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 p-10 text-center text-gray-400">
              មិនមានការលក់សម្រាប់ថ្ងៃនេះទេ
            </div>
          ) : (
            <div className="space-y-3">
              {itemsSold.map((item) => (
                <div
                  key={`${item.product_id}-${item.product_name}`}
                  className="rounded-2xl bg-gray-50 p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-black text-gray-900">
                      {item.product_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      លក់បាន: {item.total_quantity}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-black text-gray-900">
                      {money(item.total_sales)}
                    </p>
                    <p className="text-sm font-bold text-green-600">
                      ចំណេញ {money(item.total_profit)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5">
          <div className="mb-5">
            <h2 className="text-xl font-black text-gray-900">
              ផលិតផលលក់ដាច់បំផុត
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              រាប់ពីការលក់ទាំងអស់
            </p>
          </div>

          {topProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 p-10 text-center text-gray-400">
              មិនទាន់មានទិន្នន័យទេ
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((item, index) => (
                <div
                  key={`${item.product_id}-${item.product_name}`}
                  className="rounded-2xl bg-gray-50 p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-black text-gray-900">
                      #{index + 1} {item.product_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      លក់បាន: {item.total_quantity_sold}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-black text-gray-900">
                      {money(item.total_sales)}
                    </p>
                    <p className="text-sm font-bold text-green-600">
                      ចំណេញ {money(item.total_profit)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-3xl bg-white border border-gray-200 shadow-sm p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              ផលិតផលជិតអស់ស្តុក
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              ផលិតផលដែលស្តុកនៅស្មើ ឬ តិចជាងចំនួនកំណត់
            </p>
          </div>

          <span className="rounded-full bg-red-100 px-4 py-2 text-sm font-black text-red-700">
            {lowStock.length}
          </span>
        </div>

        {lowStock.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 p-10 text-center text-gray-400">
            មិនមានផលិតផលជិតអស់ស្តុកទេ
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {lowStock.map((product) => (
              <div
                key={product.id}
                className="rounded-2xl bg-red-50 border border-red-100 p-4"
              >
                <p className="font-black text-gray-900">{product.name}</p>
                <p className="text-sm text-red-700 mt-1">
                  នៅសល់: {product.current_stock} {product.unit}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  កំណត់ជិតអស់ស្តុក: {product.min_stock} {product.unit}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/api";

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function todayCambodiaDate() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Phnom_Penh",
  });
}

function stockPercent(product) {
  const currentStock = Number(product.current_stock || 0);
  const minStock = Number(product.min_stock || 0);

  if (minStock <= 0) {
    return 8;
  }

  return Math.max(8, Math.min(100, (currentStock / minStock) * 100));
}

function StatCard({ title, value, sub, tone = "gray" }) {
  const toneClass = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  }[tone];

  return (
    <div className="rounded-3xl bg-white border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-bold text-gray-500">{title}</p>
        <span className={`h-3 w-3 rounded-full ${toneClass}`} />
      </div>
      <p className="text-3xl font-black text-gray-900 mt-3">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <div className="rounded-3xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
      {children}
    </div>
  );
}

function QuickLink({ to, code, title, sub }) {
  return (
    <Link
      to={to}
      className="rounded-3xl bg-white border border-gray-200 p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gray-950 text-xs font-black text-white">
          {code}
        </span>
        <div>
          <p className="font-black text-gray-900">{title}</p>
          <p className="text-sm text-gray-500 mt-1">{sub}</p>
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [today, setToday] = useState(todayCambodiaDate());
  const [daily, setDaily] = useState(null);
  const [itemsSold, setItemsSold] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    loadDashboard();

    function refreshDashboard() {
      loadDashboard();
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        loadDashboard();
      }
    }

    function refreshFromStorage(event) {
      if (event.key === "pos-last-sale-at") {
        loadDashboard();
      }
    }

    window.addEventListener("focus", refreshDashboard);
    window.addEventListener("pos-sale-completed", refreshDashboard);
    window.addEventListener("storage", refreshFromStorage);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.removeEventListener("focus", refreshDashboard);
      window.removeEventListener("pos-sale-completed", refreshDashboard);
      window.removeEventListener("storage", refreshFromStorage);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  async function loadDashboard() {
    try {
      const dashboardDate = todayCambodiaDate();

      setLoading(true);
      setErrorMessage("");
      setToday(dashboardDate);

      const [dailyData, itemsData, topData, lowStockData] =
        await Promise.all([
          apiRequest(`/reports/daily?date=${dashboardDate}`),
          apiRequest(`/reports/items-sold?date=${dashboardDate}`),
          apiRequest("/reports/top-products?limit=3"),
          apiRequest("/reports/low-stock"),
        ]);

      setDaily(dailyData);
      setItemsSold(itemsData.items || []);
      setTopProducts(topData || []);
      setLowStock(lowStockData || []);
      setLastUpdated(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Phnom_Penh",
        }),
      );
    } catch (error) {
      setErrorMessage("បរាជ័យក្នុងការទាញយកទិន្នន័យផ្ទាំងគ្រប់គ្រង");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const totalSales = Number(daily?.total_sales || 0);
  const totalProfit = Number(daily?.total_profit || 0);
  const totalInvoices = Number(daily?.total_invoices || 0);
  const totalDiscount = Number(daily?.total_discount || 0);
  const totalQuantitySold = itemsSold.reduce(
    (sum, item) => sum + Number(item.total_quantity || 0),
    0,
  );
  const averageInvoice = totalInvoices > 0 ? totalSales / totalInvoices : 0;
  const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
  const bestSeller = topProducts[0];
  const urgentStock = lowStock.slice(0, 5);
  const activeItems = itemsSold.slice(0, 4);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            ផ្ទាំងគ្រប់គ្រង
          </h1>
          <p className="text-gray-500 mt-1">
            ទិដ្ឋភាពសរុបប្រតិបត្តិការថ្ងៃនេះ {today}
          </p>
          {lastUpdated && (
            <p className="mt-1 text-xs font-bold text-gray-400">
              បានធ្វើបច្ចុប្បន្នភាពចុងក្រោយ {lastUpdated}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="rounded-2xl bg-white border border-gray-200 px-5 py-3 text-sm font-black text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            ធ្វើបច្ចុប្បន្នភាព
          </button>
          <Link
            to="/reports"
            className="rounded-2xl bg-gray-950 px-5 py-3 text-sm font-black text-white hover:bg-gray-800"
          >
            របាយការណ៍លម្អិត
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-5 flex flex-col gap-3 rounded-3xl border border-red-100 bg-red-50 p-5 text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-bold">{errorMessage}</p>
          <button
            onClick={loadDashboard}
            className="w-fit rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700"
          >
            ព្យាយាមម្តងទៀត
          </button>
        </div>
      )}

      {loading && (
        <div className="mb-5 rounded-3xl bg-white border border-gray-200 p-5 text-gray-400">
          កំពុងទាញយកទិន្នន័យ...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="លក់ថ្ងៃនេះ" value={money(totalSales)} tone="blue" />
        <StatCard
          title="ចំណេញថ្ងៃនេះ"
          value={money(totalProfit)}
          sub={`ភាគរយចំណេញ ${profitMargin.toFixed(1)}%`}
          tone="green"
        />
        <StatCard
          title="វិក្កយបត្រថ្ងៃនេះ"
          value={totalInvoices}
          sub={`មធ្យម ${money(averageInvoice)}`}
        />
        <StatCard
          title="ត្រូវបំពេញស្តុក"
          value={lowStock.length}
          sub={lowStock.length > 0 ? "មានការងារត្រូវធ្វើ" : "ស្តុកស្ថិតក្នុងកម្រិតល្អ"}
          tone={lowStock.length > 0 ? "red" : "green"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 rounded-3xl bg-white border border-gray-200 shadow-sm p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900">
                សកម្មភាពលក់ថ្ងៃនេះ
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                សង្ខេបផលិតផលដែលកំពុងលក់ចេញ
              </p>
            </div>
            <span className="w-fit rounded-full bg-blue-100 px-4 py-2 text-sm font-black text-blue-700">
              {totalQuantitySold} ឯកតា
            </span>
          </div>

          {activeItems.length === 0 ? (
            <EmptyState>មិនទាន់មានការលក់សម្រាប់ថ្ងៃនេះទេ</EmptyState>
          ) : (
            <div className="space-y-3">
              {activeItems.map((item) => (
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

        <section className="rounded-3xl bg-gray-950 p-5 text-white shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-black">ស្ថានភាពថ្ងៃនេះ</h2>
            <p className="text-sm text-gray-400 mt-1">
              ចំណុចសំខាន់សម្រាប់ម្ចាស់ហាង
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm text-gray-400">ផលិតផលលក់ដាច់</p>
              <p className="mt-2 text-lg font-black">
                {bestSeller?.product_name || "មិនទាន់មាន"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {bestSeller
                  ? `${bestSeller.total_quantity_sold} ឯកតា | ${money(
                      bestSeller.total_sales,
                    )}`
                  : "មិនទាន់មានទិន្នន័យលក់"}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm text-gray-400">បញ្ចុះតម្លៃថ្ងៃនេះ</p>
              <p className="mt-2 text-lg font-black">{money(totalDiscount)}</p>
              <p className="text-sm text-gray-400 mt-1">
                ពិនិត្យលម្អិតនៅទំព័ររបាយការណ៍
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 rounded-3xl bg-white border border-gray-200 shadow-sm p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900">
                ការងារបន្ទាន់
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                ផលិតផលដែលត្រូវពិនិត្យស្តុកមុនគេ
              </p>
            </div>
            <Link
              to="/products"
              className="w-fit rounded-xl bg-gray-100 px-4 py-2 text-sm font-black text-gray-700 hover:bg-gray-200"
            >
              គ្រប់គ្រងស្តុក
            </Link>
          </div>

          {urgentStock.length === 0 ? (
            <EmptyState>មិនមានផលិតផលជិតអស់ស្តុកទេ</EmptyState>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {urgentStock.map((product) => (
                <div
                  key={product.id}
                  className="rounded-2xl bg-red-50 border border-red-100 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        នៅសល់: {product.current_stock} {product.unit}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-red-700">
                      ទាប
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-red-100">
                    <div
                      className="h-full rounded-full bg-red-600"
                      style={{ width: `${stockPercent(product)}%` }}
                    />
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    កំណត់ជិតអស់ស្តុក: {product.min_stock} {product.unit}
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

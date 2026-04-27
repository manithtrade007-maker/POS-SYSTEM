import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/api";

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function todayCambodiaDate() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Phnom_Penh",
  });
}

function paymentLabel(value) {
  if (value === "cash") return "សាច់ប្រាក់";
  if (value === "aba") return "ABA";
  if (value === "other") return "ផ្សេងៗ";
  return value || "-";
}

function priceTypeLabel(value) {
  if (value === "wholesale") return "លក់ដុំ";
  if (value === "retail") return "លក់រាយ";
  return value || "-";
}

function datePart(value) {
  return value?.slice(0, 10) || "";
}

function timePart(value) {
  return value?.slice(11, 16) || "";
}

function StatCard({ title, value, sub }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-black text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function Invoices() {
  const [sales, setSales] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayCambodiaDate());
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const invoicesPerPage = 10;

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, selectedDate, paymentFilter]);

  async function loadInvoices() {
    try {
      setLoading(true);
      setErrorMessage("");

      const data = await apiRequest("/sales");
      setSales(data);

      if (!selectedInvoiceId && data.length > 0) {
        viewInvoice(data[0].id);
      }
    } catch (error) {
      setErrorMessage("បរាជ័យក្នុងការទាញយកវិក្កយបត្រ");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function viewInvoice(id) {
    try {
      setDetailLoading(true);
      setSelectedInvoiceId(id);

      const data = await apiRequest(`/sales/${id}`);
      setSelectedInvoice(data);
    } catch (error) {
      setErrorMessage("បរាជ័យក្នុងការទាញយកព័ត៌មានវិក្កយបត្រ");
      console.error(error);
    } finally {
      setDetailLoading(false);
    }
  }

  const today = todayCambodiaDate();
  const todaySales = sales.filter((sale) => datePart(sale.sale_date) === today);
  const todayTotal = todaySales.reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0,
  );

  const filteredSales = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return sales.filter((sale) => {
      const matchesSearch = sale.invoice_no?.toLowerCase().includes(keyword);
      const matchesDate =
        !selectedDate || datePart(sale.sale_date) === selectedDate;
      const matchesPayment =
        paymentFilter === "all" || sale.payment_method === paymentFilter;

      return matchesSearch && matchesDate && matchesPayment;
    });
  }, [sales, search, selectedDate, paymentFilter]);

  const filteredTotal = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0,
  );
  const averageInvoice =
    filteredSales.length > 0 ? filteredTotal / filteredSales.length : 0;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredSales.length / invoicesPerPage),
  );
  const startIndex = (page - 1) * invoicesPerPage;
  const currentSales = filteredSales.slice(
    startIndex,
    startIndex + invoicesPerPage,
  );

  useEffect(() => {
    if (loading) {
      return;
    }

    if (filteredSales.length === 0) {
      setSelectedInvoice(null);
      setSelectedInvoiceId(null);
      return;
    }

    const selectedIsVisible = filteredSales.some(
      (sale) => sale.id === selectedInvoiceId,
    );

    if (!selectedIsVisible) {
      viewInvoice(filteredSales[0].id);
    }
  }, [filteredSales, loading, selectedInvoiceId]);

  function resetFilters() {
    setSearch("");
    setSelectedDate(todayCambodiaDate());
    setPaymentFilter("all");
  }

  function printInvoice() {
    window.print();
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">វិក្កយបត្រ</h1>
          <p className="mt-1 text-gray-500">
            ស្វែងរក មើលព័ត៌មាន និងបោះពុម្ពវិក្កយបត្រលក់
          </p>
        </div>

        <button
          type="button"
          onClick={loadInvoices}
          disabled={loading}
          className="w-fit rounded-2xl bg-gray-950 px-5 py-3 text-sm font-black text-white hover:bg-gray-800 disabled:opacity-40"
        >
          ធ្វើបច្ចុប្បន្នភាព
        </button>
      </div>

      {errorMessage && (
        <div className="mb-5 rounded-3xl border border-red-100 bg-red-50 p-4 font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="វិក្កយបត្រថ្ងៃនេះ" value={todaySales.length} />
        <StatCard title="ចំណូលថ្ងៃនេះ" value={money(todayTotal)} />
        <StatCard
          title="កំពុងបង្ហាញ"
          value={filteredSales.length}
          sub={selectedDate ? `ថ្ងៃទី ${selectedDate}` : "ថ្ងៃទាំងអស់"}
        />
        <StatCard
          title="សរុបកំពុងបង្ហាញ"
          value={money(filteredTotal)}
          sub={`មធ្យម ${money(averageInvoice)}`}
        />
      </div>

      <div className="mt-5 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ស្វែងរកលេខវិក្កយបត្រ..."
            className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold text-gray-900 outline-none focus:border-gray-900 focus:bg-white"
          />

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-2xl border border-gray-200 px-4 py-3 font-bold text-gray-900 outline-none focus:border-gray-900"
          />

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-2xl border border-gray-200 px-4 py-3 font-bold text-gray-900 outline-none focus:border-gray-900"
          >
            <option value="all">ការទូទាត់ទាំងអស់</option>
            <option value="cash">សាច់ប្រាក់</option>
            <option value="aba">ABA</option>
            <option value="other">ផ្សេងៗ</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-200"
          >
            សម្អាតតម្រង
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="min-w-0 rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <div>
              <h2 className="text-xl font-black text-gray-900">
                ប្រវត្តិវិក្កយបត្រ
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                ចុចលើវិក្កយបត្រដើម្បីមើលព័ត៌មានខាងស្តាំ
              </p>
            </div>
            {loading && (
              <span className="text-sm font-bold text-gray-400">កំពុងទាញ...</span>
            )}
          </div>

          {currentSales.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              មិនមានវិក្កយបត្រត្រូវនឹងតម្រងទេ
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {currentSales.map((sale) => {
                const isSelected = selectedInvoiceId === sale.id;

                return (
                  <button
                    type="button"
                    key={sale.id}
                    onClick={() => viewInvoice(sale.id)}
                    className={`grid w-full grid-cols-1 gap-3 p-5 text-left transition hover:bg-gray-50 md:grid-cols-[minmax(0,1fr)_140px_120px] md:items-center ${
                      isSelected ? "bg-gray-50 ring-1 ring-inset ring-gray-200" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-black text-gray-900">
                          {sale.invoice_no}
                        </p>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600">
                          {paymentLabel(sale.payment_method)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {datePart(sale.sale_date)} | {timePart(sale.sale_date)}
                      </p>
                    </div>

                    <div className="text-sm text-gray-500 md:text-right">
                      <p>សរុបរង {money(sale.subtotal)}</p>
                      {Number(sale.discount || 0) > 0 && (
                        <p>បញ្ចុះ {money(sale.discount)}</p>
                      )}
                    </div>

                    <p className="text-xl font-black text-gray-900 md:text-right">
                      {money(sale.total)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              បង្ហាញ {filteredSales.length === 0 ? 0 : startIndex + 1} -{" "}
              {Math.min(startIndex + invoicesPerPage, filteredSales.length)} នៃ{" "}
              {filteredSales.length}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-black text-gray-700 disabled:opacity-40"
              >
                មុន
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="rounded-xl bg-gray-950 px-4 py-2 text-sm font-black text-white disabled:opacity-40"
              >
                បន្ទាប់
              </button>
            </div>
          </div>
        </section>

        <section className="h-fit rounded-3xl border border-gray-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-gray-900">
                ព័ត៌មានវិក្កយបត្រ
              </h2>
              <p className="mt-1 text-sm text-gray-500">ទម្រង់បែបបង្កាន់ដៃ</p>
            </div>

            {selectedInvoice && (
              <button
                type="button"
                onClick={printInvoice}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-black text-gray-700 hover:bg-gray-200"
              >
                បោះពុម្ព
              </button>
            )}
          </div>

          {detailLoading && (
            <div className="mb-4 rounded-2xl bg-gray-50 p-4 text-sm font-bold text-gray-400">
              កំពុងទាញព័ត៌មាន...
            </div>
          )}

          {!selectedInvoice ? (
            <div className="rounded-3xl border-2 border-dashed border-gray-200 py-12 text-center">
              <p className="font-bold text-gray-400">
                ជ្រើសរើសវិក្កយបត្រដើម្បីមើលព័ត៌មាន
              </p>
            </div>
          ) : (
            <div>
              <div className="rounded-3xl bg-gray-950 p-5 text-white">
                <p className="text-sm text-gray-400">លេខវិក្កយបត្រ</p>
                <p className="mt-1 text-xl font-black">
                  {selectedInvoice.sale.invoice_no}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400">កាលបរិច្ឆេទ</p>
                    <p className="mt-1 font-bold">
                      {datePart(selectedInvoice.sale.sale_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">ម៉ោង</p>
                    <p className="mt-1 font-bold">
                      {timePart(selectedInvoice.sale.sale_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">ការទូទាត់</p>
                    <p className="mt-1 font-bold">
                      {paymentLabel(selectedInvoice.sale.payment_method)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">ចំនួនមុខ</p>
                    <p className="mt-1 font-bold">
                      {selectedInvoice.items.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {selectedInvoice.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-gray-900">
                          {item.product_name_snapshot}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {item.quantity} x {money(item.unit_price)}
                        </p>
                      </div>

                      <span
                        className={`h-fit rounded-full px-3 py-1 text-xs font-black ${
                          item.price_type === "wholesale"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {priceTypeLabel(item.price_type)}
                      </span>
                    </div>

                    <p className="mt-3 text-right font-black text-gray-900">
                      {money(item.total_price)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2 border-t border-gray-100 pt-5">
                <div className="flex justify-between text-gray-500">
                  <span>សរុបរង</span>
                  <span>{money(selectedInvoice.sale.subtotal)}</span>
                </div>

                {Number(selectedInvoice.sale.discount || 0) > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>បញ្ចុះតម្លៃ</span>
                    <span>{money(selectedInvoice.sale.discount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-black text-gray-900">សរុប</span>
                  <span className="text-3xl font-black text-gray-900">
                    {money(selectedInvoice.sale.total)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

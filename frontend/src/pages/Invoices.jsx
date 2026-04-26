import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";

export default function Invoices() {
  const [sales, setSales] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      const data = await apiRequest("/sales");
      setSales(data);
    } catch (error) {
      alert("Failed to load invoices");
      console.error(error);
    }
  }

  async function viewInvoice(id) {
    try {
      const data = await apiRequest(`/sales/${id}`);
      setSelectedInvoice(data);
    } catch (error) {
      alert("Failed to load invoice detail");
      console.error(error);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900">Invoices</h1>
        <p className="text-gray-500 mt-1">
          View past sales and invoice details.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-xl font-black text-gray-900">Invoice History</h2>
          </div>

          {sales.length === 0 ? (
            <div className="p-8 text-gray-400">No invoices yet.</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-4 text-sm font-bold text-gray-500">
                    Invoice
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-gray-500">
                    Date
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-gray-500">
                    Total
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-gray-500">
                    Payment
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-900">
                        {sale.invoice_no}
                      </p>
                      <p className="text-sm text-gray-400">ID: {sale.id}</p>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {sale.sale_date}
                    </td>

                    <td className="px-5 py-4 font-black">
                      ${Number(sale.total || 0).toFixed(2)}
                    </td>

                    <td className="px-5 py-4">
                      <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-bold">
                        {sale.payment_method}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => viewInvoice(sale.id)}
                        className="rounded-xl bg-gray-950 text-white px-4 py-2 text-sm font-bold hover:bg-gray-800"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 h-fit">
          <h2 className="text-xl font-black text-gray-900 mb-4">
            Invoice Detail
          </h2>

          {!selectedInvoice ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-3xl">
              <p className="text-gray-400">Select an invoice to view details.</p>
            </div>
          ) : (
            <div>
              <div className="rounded-2xl bg-gray-50 p-4 mb-4">
                <p className="text-sm text-gray-500">Invoice No</p>
                <p className="font-black text-gray-900">
                  {selectedInvoice.sale.invoice_no}
                </p>

                <p className="text-sm text-gray-500 mt-3">Date</p>
                <p className="font-bold text-gray-700">
                  {selectedInvoice.sale.sale_date}
                </p>

                <p className="text-sm text-gray-500 mt-3">Payment</p>
                <p className="font-bold text-gray-700">
                  {selectedInvoice.sale.payment_method}
                </p>
              </div>

              <div className="space-y-3">
                {selectedInvoice.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-bold text-gray-900">
                          {item.product_name_snapshot}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                        </p>
                      </div>

                      <span className="h-fit px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                        {item.price_type}
                      </span>
                    </div>

                    <p className="text-right font-black mt-3">
                      ${Number(item.total_price).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t mt-5 pt-5 space-y-2">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>${Number(selectedInvoice.sale.subtotal).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-500">
                  <span>Discount</span>
                  <span>${Number(selectedInvoice.sale.discount).toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-3xl font-black text-gray-900">
                    ${Number(selectedInvoice.sale.total).toFixed(2)}
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
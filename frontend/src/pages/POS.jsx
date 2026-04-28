import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/api";

const categories = [
  { label: "ទាំងអស់", value: "all" },
  { label: "ស្រាបៀរ", value: "beer" },
  { label: "ភេសជ្ជៈ", value: "drink" },
  { label: "អាហារសម្រន់", value: "snack" },
  { label: "ស្ករគ្រាប់", value: "sweet" },
];

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function categoryLabel(value) {
  return (
    categories.find((category) => category.value === value)?.label || "ផ្សេងៗ"
  );
}

function priceTypeLabel(value) {
  if (value === "wholesale") return "លក់ដុំ";
  return "លក់រាយ";
}

function paymentLabel(value) {
  if (value === "cash") return "សាច់ប្រាក់";
  if (value === "aba") return "ABA";
  if (value === "other") return "ផ្សេងៗ";
  return value || "-";
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getRetailUnit(product) {
  return product.units?.find((unit) => Number(unit.conversion_qty) === 1);
}

function getWholesaleUnit(product) {
  return product.units?.find((unit) => Number(unit.conversion_qty) > 1);
}

function getBoxStock(product) {
  const boxUnit = getWholesaleUnit(product);

  if (!boxUnit) {
    return null;
  }

  const boxSize = Number(boxUnit.conversion_qty);
  const totalStock = Number(product.current_stock || 0);

  return {
    fullBoxes: Math.floor(totalStock / boxSize),
    remainingUnits: totalStock % boxSize,
    unitName: boxUnit.unit_name,
  };
}

function ProductCard({ product, onAdd, getSelectedQuantity }) {
  const retailUnit = getRetailUnit(product);
  const wholesaleUnit = getWholesaleUnit(product);
  const boxStock = getBoxStock(product);
  const currentStock = Number(product.current_stock || 0);
  const minStock = Number(product.min_stock || 0);
  const isOut = currentStock <= 0;
  const isLow = !isOut && currentStock <= minStock;
  const retailSelected = retailUnit
    ? getSelectedQuantity(product.id, retailUnit.id, "retail")
    : 0;
  const wholesaleSelected = wholesaleUnit
    ? getSelectedQuantity(product.id, wholesaleUnit.id, "wholesale")
    : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-gray-900">
            {product.name}
          </p>
          <p className="mt-1 text-xs font-bold text-gray-400">
            {categoryLabel(product.category || "beer")}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
            isOut
              ? "bg-red-100 text-red-700"
              : isLow
                ? "bg-amber-100 text-amber-700"
                : "bg-green-100 text-green-700"
          }`}
        >
          {isOut ? "អស់" : isLow ? "ជិតអស់" : "មានស្តុក"}
        </span>
      </div>

      <div className="mt-3 rounded-xl bg-gray-50 p-2.5">
        <p className="truncate text-xs font-black text-gray-900">
          {boxStock
            ? `${boxStock.fullBoxes} ${boxStock.unitName}${
                boxStock.remainingUnits > 0
                  ? ` + ${boxStock.remainingUnits} ${
                      product.base_unit || product.unit
                    }`
                  : ""
              }`
            : `${currentStock} ${product.base_unit || product.unit}`}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          សរុប: {currentStock} {product.base_unit || product.unit}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {retailUnit && (
          <button
            type="button"
            disabled={isOut}
            onClick={() => onAdd(product, retailUnit, "retail")}
            className={`rounded-xl border p-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
              retailSelected > 0
                ? "border-green-300 bg-green-50 ring-2 ring-green-100"
                : "border-transparent bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <span
              className={`block text-xs font-black ${
                retailSelected > 0 ? "text-green-700" : "text-gray-500"
              }`}
            >
              {retailSelected > 0 ? `លក់រាយ x${retailSelected}` : "លក់រាយ"}
            </span>
            <span className="mt-0.5 block text-base font-black text-gray-900">
              {money(retailUnit.retail_price)}
            </span>
            <span className="block text-xs text-gray-500">
              / {retailUnit.unit_name}
            </span>
          </button>
        )}

        {wholesaleUnit && (
          <button
            type="button"
            disabled={currentStock < Number(wholesaleUnit.conversion_qty)}
            onClick={() => onAdd(product, wholesaleUnit, "wholesale")}
            className={`rounded-xl border p-2.5 text-left text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
              wholesaleSelected > 0
                ? "border-blue-300 bg-blue-600 ring-2 ring-blue-100"
                : "border-transparent bg-gray-950 hover:bg-gray-800"
            }`}
          >
            <span className="block text-xs font-black text-gray-300">
              {wholesaleSelected > 0
                ? `លក់ដុំ x${wholesaleSelected}`
                : "លក់ដុំ"}
            </span>
            <span className="mt-0.5 block text-base font-black">
              {money(wholesaleUnit.wholesale_price)}
            </span>
            <span className="block text-xs text-gray-400">
              / {wholesaleUnit.unit_name}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await apiRequest("/products");
      setProducts(data);
    } catch (error) {
      setNotice({
        type: "error",
        text: "បរាជ័យក្នុងការទាញយកផលិតផល",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const categoryCounts = useMemo(() => {
    return categories.reduce((counts, category) => {
      if (category.value === "all") {
        counts[category.value] = products.length;
      } else {
        counts[category.value] = products.filter(
          (product) => (product.category || "beer") === category.value,
        ).length;
      }

      return counts;
    }, {});
  }, [products]);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products
      .filter((product) => {
        const productCategory = product.category || "beer";
        const matchesCategory =
          selectedCategory === "all" || productCategory === selectedCategory;
        const matchesSearch = product.name.toLowerCase().includes(keyword);

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const aOut = Number(a.current_stock || 0) <= 0;
        const bOut = Number(b.current_stock || 0) <= 0;

        if (aOut !== bOut) {
          return aOut ? 1 : -1;
        }

        return a.name.localeCompare(b.name);
      });
  }, [products, search, selectedCategory]);

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.price),
    0,
  );
  const total = subtotal;
  const cartQuantity = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );

  function getSelectedQuantity(productId, unitId, priceType) {
    const item = cart.find(
      (cartItem) =>
        cartItem.product_id === productId &&
        cartItem.product_unit_id === unitId &&
        cartItem.price_type === priceType,
    );

    return Number(item?.quantity || 0);
  }

  function getUsedBaseStock(productId, cartItems = cart) {
    return cartItems
      .filter((item) => item.product_id === productId)
      .reduce(
        (sum, item) =>
          sum + Number(item.quantity || 0) * Number(item.conversion_qty || 1),
        0,
      );
  }

  function addToCart(product, unit, priceType) {
    const stockToAdd = Number(unit.conversion_qty || 1);
    const currentStock = Number(product.current_stock || 0);
    const usedStock = getUsedBaseStock(product.id);

    if (usedStock + stockToAdd > currentStock) {
      setNotice({
        type: "error",
        text: `ស្តុក ${product.name} មិនគ្រប់គ្រាន់ទេ`,
      });
      return;
    }

    const unitPrice =
      priceType === "retail" ? unit.retail_price : unit.wholesale_price;

    setNotice(null);
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.product_id === product.id &&
          item.product_unit_id === unit.id &&
          item.price_type === priceType,
      );

      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id &&
          item.product_unit_id === unit.id &&
          item.price_type === priceType
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...prev,
        {
          product_id: product.id,
          product_unit_id: unit.id,
          name: product.name,
          unit_name: unit.unit_name,
          quantity: 1,
          price_type: priceType,
          price: Number(unitPrice || 0),
          conversion_qty: Number(unit.conversion_qty || 1),
        },
      ];
    });
  }

  function setCartQuantity(index, requestedQty) {
    setCart((prev) => {
      const item = prev[index];

      if (!item) {
        return prev;
      }

      const product = products.find((p) => p.id === item.product_id);

      if (!product) {
        return prev;
      }

      const usedByOtherRows = prev
        .filter(
          (row, rowIndex) =>
            rowIndex !== index && row.product_id === item.product_id,
        )
        .reduce(
          (sum, row) =>
            sum + Number(row.quantity || 0) * Number(row.conversion_qty || 1),
          0,
        );
      const availableBaseStock = Math.max(
        0,
        Number(product.current_stock || 0) - usedByOtherRows,
      );
      const maxQty = Math.max(
        1,
        Math.floor(availableBaseStock / Number(item.conversion_qty || 1)),
      );
      const nextQty = Math.min(Math.max(1, requestedQty), maxQty);

      if (nextQty < Math.max(1, requestedQty)) {
        setNotice({
          type: "error",
          text: `ស្តុក ${item.name} អាចលក់បានត្រឹម ${nextQty} ${item.unit_name}`,
        });
      } else {
        setNotice(null);
      }

      return prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, quantity: nextQty } : row,
      );
    });
  }

  function updateQty(index, value) {
    setCartQuantity(index, Number(value || 1));
  }

  function changeQty(index, amount) {
    const currentQty = Number(cart[index]?.quantity || 1);
    setCartQuantity(index, currentQty + amount);
  }

  function removeItem(index) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  function clearCart() {
    setCart([]);
    setShowReviewModal(false);
    setNotice(null);
  }

  function openReviewModal() {
    if (cart.length === 0) {
      return;
    }

    setNotice(null);
    setShowReviewModal(true);
  }

  function printReceipt(receiptData = receipt) {
    if (!receiptData) {
      return;
    }

    const rows = receiptData.items
      .map(
        (item) => `
          <tr>
            <td>
              <strong>${escapeHtml(item.name)}</strong>
              <div>${escapeHtml(priceTypeLabel(item.price_type))} / ${escapeHtml(
                item.unit_name,
              )}</div>
            </td>
            <td>${Number(item.quantity)}</td>
            <td>${money(item.price)}</td>
            <td>${money(Number(item.quantity) * Number(item.price))}</td>
          </tr>
        `,
      )
      .join("");

    const printWindow = window.open("", "_blank", "width=420,height=720");

    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(receiptData.sale.invoice_no)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #111827;
              margin: 24px;
            }
            .center { text-align: center; }
            .muted { color: #6b7280; font-size: 12px; }
            .invoice { font-size: 18px; font-weight: 800; margin-top: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th {
              border-bottom: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 12px;
              padding: 8px 0;
              text-align: left;
            }
            td {
              border-bottom: 1px solid #f3f4f6;
              font-size: 12px;
              padding: 10px 0;
              vertical-align: top;
            }
            td:nth-child(2), td:nth-child(3), td:nth-child(4),
            th:nth-child(2), th:nth-child(3), th:nth-child(4) {
              text-align: right;
            }
            .summary {
              margin-top: 18px;
              display: grid;
              gap: 8px;
            }
            .line {
              display: flex;
              justify-content: space-between;
              font-size: 14px;
            }
            .total {
              font-size: 22px;
              font-weight: 900;
              border-top: 1px solid #e5e7eb;
              padding-top: 12px;
            }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="center">
            <h2>GrocyPOS</h2>
            <div class="muted">ប្រព័ន្ធលក់ដុំ និងលក់រាយ</div>
            <div class="invoice">${escapeHtml(receiptData.sale.invoice_no)}</div>
            <div class="muted">${escapeHtml(receiptData.sale.sale_date)} | ${escapeHtml(
              paymentLabel(receiptData.sale.payment_method),
            )}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>ទំនិញ</th>
                <th>ចំនួន</th>
                <th>តម្លៃ</th>
                <th>សរុប</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <div class="summary">
            <div class="line">
              <span>ចំនួនមុខ</span>
              <strong>${receiptData.items.length}</strong>
            </div>
            <div class="line">
              <span>បរិមាណសរុប</span>
              <strong>${receiptData.quantity}</strong>
            </div>
            <div class="line total">
              <span>សរុបត្រូវបង់</span>
              <span>${money(receiptData.total)}</span>
            </div>
          </div>

          <p class="center muted">អរគុណសម្រាប់ការទិញ</p>
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  async function completeSale() {
    if (cart.length === 0) {
      return;
    }

    try {
      setSaving(true);
      setNotice(null);

      const soldItems = cart.map((item) => ({ ...item }));
      const items = cart.map((item) => ({
        product_id: item.product_id,
        product_unit_id: item.product_unit_id,
        quantity: Number(item.quantity),
        price_type: item.price_type,
      }));

      const data = await apiRequest("/sales", {
        method: "POST",
        body: JSON.stringify({
          items,
          discount: 0,
          payment_method: paymentMethod,
          note: "Sale from POS screen",
        }),
      });

      setReceipt({
        sale: data.sale,
        items: soldItems,
        quantity: cartQuantity,
        total,
      });
      setCart([]);
      setShowReviewModal(false);
      await loadProducts();
      localStorage.setItem("pos-last-sale-at", String(Date.now()));
      window.dispatchEvent(new Event("pos-sale-completed"));
      setNotice({
        type: "success",
        text: `លក់បានជោគជ័យ ${data.sale?.invoice_no || ""}`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "បរាជ័យក្នុងការលក់",
      });
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900">លក់ទំនិញ</h1>
            <p className="mt-1 text-gray-500">
              ស្វែងរកផលិតផល ជ្រើសឯកតា ហើយបញ្ចប់ការលក់
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white px-3 py-2.5 shadow-sm border border-gray-200">
              <p className="text-xs font-bold text-gray-400">ផលិតផល</p>
              <p className="text-lg font-black text-gray-900">
                {products.length}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-2.5 shadow-sm border border-gray-200">
              <p className="text-xs font-bold text-gray-400">ក្នុងកន្ត្រក</p>
              <p className="text-lg font-black text-gray-900">
                {cartQuantity}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-950 px-3 py-2.5 text-white shadow-sm">
              <p className="text-xs font-bold text-gray-400">សរុប</p>
              <p className="text-lg font-black">{money(total)}</p>
            </div>
          </div>
        </div>

        {notice && (
          <div
            className={`mb-5 rounded-3xl border p-4 font-bold ${
              notice.type === "success"
                ? "border-green-100 bg-green-50 text-green-700"
                : "border-red-100 bg-red-50 text-red-700"
            }`}
          >
            {notice.text}
          </div>
        )}

        <div className="mb-4 rounded-3xl bg-white p-3 shadow-sm border border-gray-200">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ស្វែងរកឈ្មោះផលិតផល..."
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold text-gray-900 outline-none focus:border-gray-900 focus:bg-white focus:ring-4 focus:ring-gray-100"
            />

            <button
              type="button"
              onClick={loadProducts}
              disabled={loading}
              className="rounded-2xl bg-gray-950 px-4 py-3 text-sm font-black text-white hover:bg-gray-800 disabled:opacity-40"
            >
              ធ្វើបច្ចុប្បន្នភាព
            </button>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => setSelectedCategory(category.value)}
                className={`shrink-0 rounded-2xl px-3 py-2 text-sm font-black transition ${
                  selectedCategory === category.value
                    ? "bg-gray-950 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {category.label}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    selectedCategory === category.value
                      ? "bg-white/15 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {categoryCounts[category.value] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-gray-500">
            បង្ហាញ {filteredProducts.length} នៃ {products.length} ផលិតផល
          </p>
          {loading && (
            <p className="text-sm font-bold text-gray-400">កំពុងទាញ...</p>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-400">
            មិនមានផលិតផលត្រូវនឹងការស្វែងរកទេ
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={addToCart}
                getSelectedQuantity={getSelectedQuantity}
              />
            ))}
          </div>
        )}
      </section>

      <section className="h-fit rounded-3xl border border-gray-200 bg-white p-4 shadow-sm lg:sticky lg:top-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900">កន្ត្រកលក់</h2>
            <p className="mt-1 text-sm text-gray-500">
              {cart.length} មុខ | {cartQuantity} ឯកតា
            </p>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="rounded-xl bg-red-50 px-3 py-2 text-sm font-black text-red-700 hover:bg-red-100"
            >
              សម្អាត
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 py-12 text-center">
            <p className="font-bold text-gray-400">មិនទាន់មានទំនិញទេ</p>
            <p className="mt-1 text-sm text-gray-400">
              ជ្រើសរើសផលិតផលពីបញ្ជីខាងឆ្វេង
            </p>
          </div>
        ) : (
          <div className="max-h-[44vh] space-y-2 overflow-y-auto pr-1">
            {cart.map((item, index) => {
              const lineTotal = Number(item.quantity) * Number(item.price);

              return (
                <div
                  key={`${item.product_id}-${item.product_unit_id}-${item.price_type}`}
                  className="rounded-2xl border border-gray-200 p-3"
                >
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-gray-900">
                        {item.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-black ${
                            item.price_type === "wholesale"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {priceTypeLabel(item.price_type)}
                        </span>
                        <span className="text-xs font-bold text-gray-500">
                          {item.unit_name}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs font-bold text-gray-400">
                        សរុប
                      </p>
                      <p className="text-base font-black text-gray-950">
                        {money(lineTotal)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="mt-1 rounded-lg px-2 py-1 text-xs font-black text-red-500 hover:bg-red-50"
                      >
                        លុប
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-[136px_minmax(0,1fr)] gap-2">
                    <div>
                      <label className="text-xs font-bold text-gray-500">
                        ចំនួន
                      </label>
                      <div className="mt-1 grid grid-cols-[32px_minmax(0,1fr)_32px] overflow-hidden rounded-xl border border-gray-200">
                        <button
                          type="button"
                          onClick={() => changeQty(index, -1)}
                          disabled={Number(item.quantity) <= 1}
                          className="bg-gray-50 text-lg font-black text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQty(index, e.target.value)}
                          className="w-full border-x border-gray-200 px-2 py-1.5 text-center font-bold text-gray-900 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => changeQty(index, 1)}
                          className="bg-gray-950 text-lg font-black text-white hover:bg-gray-800"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-gray-500">
                        តម្លៃមួយឯកតា
                      </p>
                      <div className="mt-1 rounded-xl bg-gray-50 px-3 py-2 font-black text-gray-900">
                        {money(item.price)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl bg-gray-950 px-3 py-2 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-gray-300">
                        សរុបមុខនេះ
                      </span>
                      <span className="text-lg font-black">
                        {money(lineTotal)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3 text-xs text-gray-400">
                      <span>
                        {item.quantity} x {money(item.price)}
                      </span>
                      <span>
                        កាត់ស្តុក {item.quantity * item.conversion_qty}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-500">
              <span>សរុប</span>
              <span className="font-bold text-gray-900">{money(subtotal)}</span>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-500">
                ការទូទាត់
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-2.5 font-bold text-gray-900 outline-none focus:border-gray-900"
              >
                <option value="cash">សាច់ប្រាក់</option>
                <option value="aba">ABA</option>
                <option value="other">ផ្សេងៗ</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-gray-500">សរុបត្រូវបង់</p>
            <p className="text-2xl font-black text-gray-900">{money(total)}</p>
          </div>

          <button
            type="button"
            disabled={cart.length === 0 || saving}
            onClick={openReviewModal}
            className="mt-4 w-full rounded-2xl bg-gray-950 py-3.5 font-black text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ពិនិត្យមុនលក់
          </button>
        </div>
      </section>
      </div>

      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
              <div>
                <h2 className="text-2xl font-black text-gray-900">
                  ពិនិត្យមុនលក់
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  សូមផ្ទៀងផ្ទាត់ទំនិញ ចំនួន និងតម្លៃ មុនបញ្ជាក់ការលក់
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                disabled={saving}
                className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-black text-gray-700 hover:bg-gray-200 disabled:opacity-40"
              >
                បិទ
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-5">
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={`${item.product_id}-${item.product_unit_id}-${item.price_type}`}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-black text-gray-900">
                          {item.name}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              item.price_type === "wholesale"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {priceTypeLabel(item.price_type)}
                          </span>
                          <span className="text-sm font-bold text-gray-500">
                            {item.unit_name}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-black text-gray-900">
                          {money(Number(item.quantity) * Number(item.price))}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {item.quantity} x {money(item.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-3xl bg-gray-50 p-5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>ការទូទាត់</span>
                  <span className="font-black text-gray-900">
                    {paymentLabel(paymentMethod)}
                  </span>
                </div>
                <div className="mt-3 flex justify-between text-sm text-gray-500">
                  <span>ចំនួនមុខ</span>
                  <span className="font-black text-gray-900">
                    {cart.length} មុខ | {cartQuantity} ឯកតា
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                  <span className="font-black text-gray-900">សរុបត្រូវបង់</span>
                  <span className="text-3xl font-black text-gray-900">
                    {money(total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 border-t border-gray-100 p-5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                disabled={saving}
                className="rounded-2xl bg-gray-100 py-3 font-black text-gray-700 hover:bg-gray-200 disabled:opacity-40"
              >
                ត្រឡប់ទៅកែ
              </button>
              <button
                type="button"
                onClick={completeSale}
                disabled={saving}
                className="rounded-2xl bg-gray-950 py-3 font-black text-white hover:bg-gray-800 disabled:opacity-40"
              >
                {saving ? "កំពុងរក្សាទុក..." : "បញ្ជាក់លក់"}
              </button>
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 p-5 text-center">
              <p className="text-sm font-bold text-green-600">
                លក់បានជោគជ័យ
              </p>
              <h2 className="mt-1 text-2xl font-black text-gray-900">
                {receipt.sale.invoice_no}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {receipt.sale.sale_date} |{" "}
                {paymentLabel(receipt.sale.payment_method)}
              </p>
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-5">
              <div className="space-y-3">
                {receipt.items.map((item) => (
                  <div
                    key={`${item.product_id}-${item.product_unit_id}-${item.price_type}`}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-black text-gray-900">
                          {item.name}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {priceTypeLabel(item.price_type)} / {item.unit_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-gray-900">
                          {money(Number(item.quantity) * Number(item.price))}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {item.quantity} x {money(item.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-3xl bg-gray-950 p-5 text-white">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>ចំនួនមុខ</span>
                  <span className="font-black text-white">
                    {receipt.items.length}
                  </span>
                </div>
                <div className="mt-3 flex justify-between text-sm text-gray-400">
                  <span>បរិមាណសរុប</span>
                  <span className="font-black text-white">
                    {receipt.quantity}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="font-black">សរុបត្រូវបង់</span>
                  <span className="text-3xl font-black">
                    {money(receipt.total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 border-t border-gray-100 p-5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setReceipt(null)}
                className="rounded-2xl bg-gray-100 py-3 font-black text-gray-700 hover:bg-gray-200"
              >
                បិទ
              </button>
              <button
                type="button"
                onClick={() => printReceipt(receipt)}
                className="rounded-2xl bg-gray-950 py-3 font-black text-white hover:bg-gray-800"
              >
                បោះពុម្ពវិក្កយបត្រ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

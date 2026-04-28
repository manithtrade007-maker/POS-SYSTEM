import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/api";

const productCategories = [
  {
    value: "beer",
    label: "ស្រាបៀរ",
    retailUnit: "កំប៉ុង",
    wholesaleUnit: "កេស",
    boxSize: "24",
  },
  {
    value: "drink",
    label: "ភេសជ្ជៈ",
    retailUnit: "ដប",
    wholesaleUnit: "កេស",
    boxSize: "24",
  },
  {
    value: "snack",
    label: "អាហារសម្រន់",
    retailUnit: "កញ្ចប់",
    wholesaleUnit: "ស្បោង",
    boxSize: "12",
  },
  {
    value: "sweet",
    label: "ស្ករគ្រាប់",
    retailUnit: "កញ្ចប់",
    wholesaleUnit: "ស្បោង",
    boxSize: "50",
  },
];

const categoryTabs = [{ value: "all", label: "ទាំងអស់" }, ...productCategories];

const stockFilters = [
  { value: "all", label: "ស្តុកទាំងអស់" },
  { value: "healthy", label: "មានស្តុក" },
  { value: "low", label: "ជិតអស់" },
  { value: "out", label: "អស់ស្តុក" },
];

function getCategoryDefaults(category) {
  return (
    productCategories.find((item) => item.value === category) ||
    productCategories[0]
  );
}

function createEmptyForm() {
  return {
    name: "",
    category: "",
    wholesale_unit_name: "",
    box_size: "",
    box_cost: "",
    wholesale_box_price: "",
    stock_boxes: "",
    min_stock_boxes: "",
    retail_unit_name: "",
    retail_price_per_unit: "",
  };
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function profitClass(value) {
  return Number(value || 0) >= 0 ? "text-green-700" : "text-red-700";
}

function formatNumber(value) {
  const number = Number(value || 0);
  return Number.isInteger(number) ? number.toString() : number.toFixed(2);
}

function categoryLabel(value) {
  return (
    productCategories.find((category) => category.value === value)?.label ||
    "ផ្សេងៗ"
  );
}

function getRetailUnit(product) {
  return product.units?.find((unit) => Number(unit.conversion_qty) === 1);
}

function getWholesaleUnit(product) {
  return product.units?.find((unit) => Number(unit.conversion_qty) > 1);
}

function getStockStatus(product) {
  const currentStock = Number(product.current_stock || 0);
  const minStock = Number(product.min_stock || 0);

  if (currentStock <= 0) {
    return {
      value: "out",
      label: "អស់ស្តុក",
      className: "bg-red-100 text-red-700",
    };
  }

  if (currentStock <= minStock) {
    return {
      value: "low",
      label: "ជិតអស់",
      className: "bg-amber-100 text-amber-700",
    };
  }

  return {
    value: "healthy",
    label: "មានស្តុក",
    className: "bg-green-100 text-green-700",
  };
}

function getBoxStock(product) {
  const wholesaleUnit = getWholesaleUnit(product);

  if (!wholesaleUnit) {
    return null;
  }

  const boxSize = Number(wholesaleUnit.conversion_qty || 0);
  const totalStock = Number(product.current_stock || 0);

  if (!boxSize) {
    return null;
  }

  return {
    fullBoxes: Math.floor(totalStock / boxSize),
    remainingUnits: totalStock % boxSize,
    unitName: wholesaleUnit.unit_name,
    boxSize,
  };
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function StatCard({ label, value, detail, tone = "gray" }) {
  const tones = {
    gray: "bg-white text-gray-900",
    green: "bg-green-50 text-green-900",
    amber: "bg-amber-50 text-amber-900",
    red: "bg-red-50 text-red-900",
  };

  return (
    <div className={`rounded-2xl border border-gray-200 p-4 ${tones[tone]}`}>
      <p className="text-xs font-black text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold text-gray-500">{detail}</p>
    </div>
  );
}

function ProductCard({ product, onEdit, onDelete }) {
  const retailUnit = getRetailUnit(product);
  const wholesaleUnit = getWholesaleUnit(product);
  const boxStock = getBoxStock(product);
  const status = getStockStatus(product);
  const baseUnit = product.base_unit || product.unit || "ឯកតា";
  const totalStock = Number(product.current_stock || 0);
  const costPerUnit = Number(product.cost_price_base || 0);
  const retailProfit =
    retailUnit && Number.isFinite(Number(retailUnit.retail_price))
      ? Number(retailUnit.retail_price || 0) - costPerUnit
      : null;
  const wholesaleCost = wholesaleUnit
    ? costPerUnit * Number(wholesaleUnit.conversion_qty || 1)
    : null;
  const wholesaleProfit = wholesaleUnit
    ? Number(wholesaleUnit.wholesale_price || 0) - wholesaleCost
    : null;

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600">
              {categoryLabel(product.category || "beer")}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${status.className}`}
            >
              {status.label}
            </span>
          </div>

          <h3 className="mt-3 truncate text-lg font-black text-gray-950">
            {product.name}
          </h3>
          <p className="mt-1 text-xs font-bold text-gray-400">
            លេខកូដ #{product.id}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-gray-50 p-3">
        <p className="text-sm font-black text-gray-950">
          {boxStock
            ? `${formatNumber(boxStock.fullBoxes)} ${boxStock.unitName}${
                boxStock.remainingUnits > 0
                  ? ` + ${formatNumber(boxStock.remainingUnits)} ${baseUnit}`
                  : ""
              }`
            : `${formatNumber(totalStock)} ${baseUnit}`}
        </p>
        <p className="mt-1 text-xs font-bold text-gray-500">
          សរុប {formatNumber(totalStock)} {baseUnit}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-black text-gray-400">លក់រាយ</p>
          <p className="mt-1 text-base font-black text-gray-950">
            {retailUnit ? money(retailUnit.retail_price) : "-"}
          </p>
          <p className="text-xs text-gray-500">
            / {retailUnit?.unit_name || baseUnit}
          </p>
        </div>

        <div>
          <p className="text-xs font-black text-gray-400">លក់ដុំ</p>
          <p className="mt-1 text-base font-black text-gray-950">
            {wholesaleUnit ? money(wholesaleUnit.wholesale_price) : "-"}
          </p>
          <p className="text-xs text-gray-500">
            / {wholesaleUnit?.unit_name || "ឯកតា"}
          </p>
        </div>
      </div>

      {wholesaleUnit && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 text-xs">
          <span className="font-bold text-gray-500">ខ្នាតលក់ដុំ</span>
          <span className="font-black text-gray-800">
            {formatNumber(wholesaleUnit.conversion_qty)} {baseUnit} /{" "}
            {wholesaleUnit.unit_name}
          </span>
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-gray-50 p-3">
        <p className="text-xs font-black text-gray-500">ទិញចូល និងចំណេញ</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-bold text-gray-400">ទិញចូលរាយ</p>
            <p className="font-black text-gray-950">
              {money(costPerUnit)}
            </p>
            <p className="text-xs text-gray-500">/ {baseUnit}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400">ចំណេញលក់រាយ</p>
            <p className={`font-black ${profitClass(retailProfit)}`}>
              {retailProfit === null ? "-" : money(retailProfit)}
            </p>
            <p className="text-xs text-gray-500">/ {baseUnit}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400">ទិញចូលដុំ</p>
            <p className="font-black text-gray-950">
              {wholesaleCost === null ? "-" : money(wholesaleCost)}
            </p>
            <p className="text-xs text-gray-500">
              / {wholesaleUnit?.unit_name || "ឯកតា"}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400">ចំណេញលក់ដុំ</p>
            <p className={`font-black ${profitClass(wholesaleProfit)}`}>
              {wholesaleProfit === null ? "-" : money(wholesaleProfit)}
            </p>
            <p className="text-xs text-gray-500">
              / {wholesaleUnit?.unit_name || "ឯកតា"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="flex-1 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-black text-white hover:bg-gray-800"
        >
          កែប្រែ
        </button>
        <button
          type="button"
          onClick={() => onDelete(product)}
          className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-black text-red-700 hover:bg-red-100"
        >
          លុប
        </button>
      </div>
    </article>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [notice, setNotice] = useState(null);
  const [formError, setFormError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [form, setForm] = useState(() => createEmptyForm());

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
        text: "មិនអាចទាញយកបញ្ជីផលិតផលបានទេ។ សូមពិនិត្យ backend ម្តងទៀត។",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const categoryCounts = useMemo(() => {
    return categoryTabs.reduce((counts, category) => {
      counts[category.value] =
        category.value === "all"
          ? products.length
          : products.filter(
              (product) => (product.category || "beer") === category.value,
            ).length;

      return counts;
    }, {});
  }, [products]);

  const stats = useMemo(() => {
    const lowStock = products.filter(
      (product) => getStockStatus(product).value === "low",
    ).length;
    const outOfStock = products.filter(
      (product) => getStockStatus(product).value === "out",
    ).length;
    const inventoryCost = products.reduce((total, product) => {
      return (
        total +
        Number(product.current_stock || 0) * Number(product.cost_price_base || 0)
      );
    }, 0);

    return {
      total: products.length,
      lowStock,
      outOfStock,
      inventoryCost,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        String(product.name || "")
          .toLowerCase()
          .includes(query) ||
        String(product.id || "").includes(query);
      const matchesCategory =
        selectedCategory === "all" ||
        (product.category || "beer") === selectedCategory;
      const matchesStock =
        stockFilter === "all" || getStockStatus(product).value === stockFilter;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, selectedCategory, stockFilter]);

  function updateForm(field, value) {
    setFormError(null);
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function updateCategory(value) {
    setFormError(null);
    setForm((previous) => ({
      ...previous,
      category: value,
    }));
  }

  function openCreateModal() {
    setEditingProduct(null);
    setForm(createEmptyForm());
    setNotice(null);
    setFormError(null);
    setShowModal(true);
  }

  function openEditModal(product) {
    const wholesaleUnit = getWholesaleUnit(product);
    const retailUnit = getRetailUnit(product);
    const boxSize = Number(wholesaleUnit?.conversion_qty || 0);
    const stockBoxes = boxSize
      ? Number(product.current_stock || 0) / boxSize
      : "";
    const minStockBoxes = boxSize
      ? Number(product.min_stock || 0) / boxSize
      : "";
    const boxCost = boxSize ? Number(product.cost_price_base || 0) * boxSize : "";

    setEditingProduct(product);
    setForm({
      name: product.name || "",
      category: product.category || "beer",
      wholesale_unit_name:
        wholesaleUnit?.unit_name ||
        getCategoryDefaults(product.category || "beer").wholesaleUnit,
      box_size: boxSize || getCategoryDefaults(product.category || "beer").boxSize,
      box_cost: boxCost,
      wholesale_box_price: wholesaleUnit?.wholesale_price || "",
      stock_boxes: stockBoxes,
      min_stock_boxes: minStockBoxes,
      retail_unit_name:
        retailUnit?.unit_name ||
        getCategoryDefaults(product.category || "beer").retailUnit,
      retail_price_per_unit: retailUnit?.retail_price || "",
    });
    setNotice(null);
    setFormError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingProduct(null);
    setFormError(null);
    setForm(createEmptyForm());
  }

  function validateForm() {
    const textFields = [
      ["name", "សូមបញ្ចូលឈ្មោះផលិតផល"],
      ["category", "សូមជ្រើសរើសប្រភេទ"],
      ["wholesale_unit_name", "សូមជ្រើសរើសឯកតាលក់ដុំ"],
      ["retail_unit_name", "សូមជ្រើសរើសឯកតាលក់រាយ"],
    ];

    for (const [field, message] of textFields) {
      if (!String(form[field] || "").trim()) {
        return message;
      }
    }

    const numericFields = [
      ["box_size", "ចំនួនឯកតារាយក្នុងលក់ដុំត្រូវធំជាង 0", 0],
      ["box_cost", "តម្លៃទិញចូលត្រូវធំជាង 0", 0],
      ["wholesale_box_price", "តម្លៃលក់ដុំត្រូវធំជាង 0", 0],
      ["stock_boxes", "ស្តុកបច្ចុប្បន្នមិនអាចតិចជាង 0", -1],
      ["min_stock_boxes", "ស្តុកជូនដំណឹងមិនអាចតិចជាង 0", -1],
      ["retail_price_per_unit", "តម្លៃលក់រាយត្រូវធំជាង 0", 0],
    ];

    for (const [field, message, minimum] of numericFields) {
      const value = Number(form[field]);

      if (!Number.isFinite(value) || value <= minimum) {
        return message;
      }
    }

    return null;
  }

  function buildPayload() {
    const boxSize = Number(form.box_size);
    const boxCost = Number(form.box_cost);
    const stockBoxes = Number(form.stock_boxes);
    const minStockBoxes = Number(form.min_stock_boxes);
    const retailPrice = Number(form.retail_price_per_unit);
    const wholesalePrice = Number(form.wholesale_box_price);
    const retailUnit = form.retail_unit_name.trim();
    const wholesaleUnit = form.wholesale_unit_name.trim();

    return {
      name: form.name.trim(),
      category: form.category || "beer",
      category_id: null,
      base_unit: retailUnit,
      cost_price_base: boxCost / boxSize,
      current_stock: stockBoxes * boxSize,
      min_stock: minStockBoxes * boxSize,
      units: [
        {
          unit_name: retailUnit,
          conversion_qty: 1,
          retail_price: retailPrice,
          wholesale_price: retailPrice,
        },
        {
          unit_name: wholesaleUnit,
          conversion_qty: boxSize,
          retail_price: wholesalePrice,
          wholesale_price: wholesalePrice,
        },
      ],
    };
  }

  async function saveProduct(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      await apiRequest(
        editingProduct ? `/products/${editingProduct.id}` : "/products",
        {
          method: editingProduct ? "PUT" : "POST",
          body: JSON.stringify(buildPayload()),
        },
      );
      await loadProducts();
      closeModal();
      setNotice({
        type: "success",
        text: editingProduct
          ? "បានកែប្រែផលិតផលរួចរាល់"
          : "បានបន្ថែមផលិតផលថ្មីរួចរាល់",
      });
    } catch (error) {
      setFormError(error.message);
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      setSaving(true);
      await apiRequest(`/products/${deleteCandidate.id}`, {
        method: "DELETE",
      });
      await loadProducts();
      setNotice({
        type: "success",
        text: "បានលុបផលិតផលចេញពីបញ្ជីលក់",
      });
      setDeleteCandidate(null);
    } catch (error) {
      setNotice({ type: "error", text: error.message });
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1.5 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-900 outline-none focus:border-gray-950 focus:ring-2 focus:ring-gray-100";
  const selectClass = `${inputClass} appearance-none`;
  const previewBoxSize = Number(form.box_size || 0);
  const previewBoxCost = Number(form.box_cost || 0);
  const previewRetailPrice = Number(form.retail_price_per_unit || 0);
  const previewWholesalePrice = Number(form.wholesale_box_price || 0);
  const previewUnitCost = previewBoxSize > 0 ? previewBoxCost / previewBoxSize : 0;
  const previewRetailProfit = previewRetailPrice - previewUnitCost;
  const previewWholesaleProfit = previewWholesalePrice - previewBoxCost;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black text-gray-500">គ្រប់គ្រងស្តុក</p>
          <h1 className="mt-1 text-3xl font-black text-gray-950">ផលិតផល</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            រៀបចំផលិតផល តម្លៃលក់រាយ លក់ដុំ និងចំនួនស្តុកសម្រាប់ការលក់ប្រចាំថ្ងៃ។
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-2xl bg-gray-950 px-5 py-3 text-sm font-black text-white hover:bg-gray-800"
        >
          បន្ថែមផលិតផល
        </button>
      </header>

      {notice && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
            notice.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {notice.text}
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-4">
        <StatCard
          label="ផលិតផលសរុប"
          value={stats.total}
          detail="ចំនួនមុខទំនិញកំពុងលក់"
        />
        <StatCard
          label="តម្លៃស្តុក"
          value={money(stats.inventoryCost)}
          detail="គិតតាមតម្លៃទិញចូល"
          tone="green"
        />
        <StatCard
          label="ជិតអស់"
          value={stats.lowStock}
          detail="ត្រូវពិនិត្យស្តុកឡើងវិញ"
          tone="amber"
        />
        <StatCard
          label="អស់ស្តុក"
          value={stats.outOfStock}
          detail="មិនអាចលក់បាន"
          tone="red"
        />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ស្វែងរកតាមឈ្មោះ ឬលេខកូដផលិតផល"
              className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold text-gray-900 outline-none focus:border-gray-950 focus:bg-white focus:ring-4 focus:ring-gray-100"
            />
          </div>

          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value)}
            className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-black text-gray-700 outline-none focus:border-gray-950 focus:bg-white"
          >
            {stockFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {categoryTabs.map((category) => {
            const active = selectedCategory === category.value;

            return (
              <button
                key={category.value}
                type="button"
                onClick={() => setSelectedCategory(category.value)}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black transition ${
                  active
                    ? "bg-gray-950 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {category.label}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    active
                      ? "bg-white/15 text-white"
                      : "bg-white text-gray-500"
                  }`}
                >
                  {categoryCounts[category.value] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white"
              />
            ))
          : filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={openEditModal}
                onDelete={setDeleteCandidate}
              />
            ))}
      </section>

      {!loading && filteredProducts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <p className="text-lg font-black text-gray-900">
            មិនមានផលិតផលតាមលក្ខខណ្ឌនេះទេ
          </p>
          <p className="mt-2 text-sm text-gray-500">
            សាកល្បងប្តូរពាក្យស្វែងរក ប្រភេទ ឬស្ថានភាពស្តុក។
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm">
          <form
            onSubmit={saveProduct}
            className="flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="shrink-0 border-b border-gray-100 px-5 py-3">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-black text-gray-700 hover:bg-gray-200"
                >
                  ត្រឡប់ក្រោយ
                </button>
                <div className="min-w-0 flex-1 text-center">
                  <p className="text-xs font-black text-gray-400">
                    {editingProduct ? "កែប្រែព័ត៌មាន" : "ផលិតផលថ្មី"}
                  </p>
                  <h2 className="truncate text-xl font-black text-gray-950">
                    {editingProduct ? "កែប្រែផលិតផល" : "បន្ថែមផលិតផល"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-9 w-9 rounded-xl bg-gray-100 text-base font-black text-gray-600 hover:bg-gray-200"
                  aria-label="Close product form"
                >
                  x
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {formError && (
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid gap-4">
                <section>
                  <h3 className="text-sm font-black text-gray-950">
                    ព័ត៌មានផលិតផល
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field label="ឈ្មោះផលិតផល">
                        <input
                        value={form.name}
                        onChange={(event) =>
                          updateForm("name", event.target.value)
                        }
                        className={inputClass}
                        autoFocus
                      />
                    </Field>
                    </div>

                    <Field label="ប្រភេទ">
                      <select
                        value={form.category}
                        onChange={(event) => updateCategory(event.target.value)}
                        className={selectClass}
                      >
                        <option value="">ជ្រើសរើសប្រភេទ</option>
                        {productCategories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="ស្តុកបច្ចុប្បន្ន">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.stock_boxes}
                        onChange={(event) =>
                          updateForm("stock_boxes", event.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </section>

                <section className="border-t border-gray-100 pt-3">
                  <h3 className="text-sm font-black text-gray-950">
                    លក់ដុំ
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="ឯកតាលក់ដុំ">
                      <select
                        value={form.wholesale_unit_name}
                        onChange={(event) =>
                          updateForm("wholesale_unit_name", event.target.value)
                        }
                        className={selectClass}
                      >
                        <option value="">ជ្រើសរើសឯកតា</option>
                        <option value="កេស">កេស</option>
                        <option value="ស្បោង">ស្បោង</option>
                        <option value="ថង់">ថង់</option>
                        <option value="ប្រអប់">ប្រអប់</option>
                      </select>
                    </Field>

                    <Field label="ចំនួនរាយក្នុងមួយដុំ">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={form.box_size}
                        onChange={(event) =>
                          updateForm("box_size", event.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="តម្លៃទិញចូលក្នុងមួយដុំ">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.box_cost}
                        onChange={(event) =>
                          updateForm("box_cost", event.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="តម្លៃលក់ដុំ">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.wholesale_box_price}
                        onChange={(event) =>
                          updateForm(
                            "wholesale_box_price",
                            event.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="ជូនដំណឹងពេលនៅសល់">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.min_stock_boxes}
                        onChange={(event) =>
                          updateForm("min_stock_boxes", event.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </section>

                <section className="border-t border-gray-100 pt-3">
                  <h3 className="text-sm font-black text-gray-950">
                    លក់រាយ
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="ឯកតាលក់រាយ">
                      <select
                        value={form.retail_unit_name}
                        onChange={(event) =>
                          updateForm("retail_unit_name", event.target.value)
                        }
                        className={selectClass}
                      >
                        <option value="">ជ្រើសរើសឯកតា</option>
                        <option value="កំប៉ុង">កំប៉ុង</option>
                        <option value="ដប">ដប</option>
                        <option value="កញ្ចប់">កញ្ចប់</option>
                        <option value="ថង់">ថង់</option>
                        <option value="ស្បោង">ស្បោង</option>
                        <option value="ឯកតា">ឯកតា</option>
                      </select>
                    </Field>

                    <Field label="តម្លៃលក់រាយ">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.retail_price_per_unit}
                        onChange={(event) =>
                          updateForm(
                            "retail_price_per_unit",
                            event.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </section>

                <section className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-sm font-black text-gray-700">
                    សង្ខេបតម្លៃ និងចំណេញ
                  </p>
                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-black text-gray-500">
                        ស្តុកសរុប
                      </p>
                      <p className="mt-1 font-black text-gray-950">
                        {formatNumber(
                          Number(form.stock_boxes || 0) *
                            Number(form.box_size || 0),
                        )}{" "}
                        {form.retail_unit_name || "ឯកតា"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black text-gray-500">
                        ទិញចូលរាយ
                      </p>
                      <p className="mt-1 font-black text-gray-950">
                        {previewBoxSize > 0 ? money(previewUnitCost) : "$0.00"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black text-gray-500">
                        ចំណេញលក់ដុំ
                      </p>
                      <p
                        className={`mt-1 font-black ${profitClass(
                          previewWholesaleProfit,
                        )}`}
                      >
                        {money(previewWholesaleProfit)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black text-gray-500">
                        ចំណេញលក់រាយ
                      </p>
                      <p
                        className={`mt-1 font-black ${profitClass(
                          previewRetailProfit,
                        )}`}
                      >
                        {money(previewRetailProfit)}
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div className="shrink-0 border-t border-gray-100 bg-white px-5 py-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-12 rounded-2xl border border-gray-200 bg-white px-5 text-sm font-black text-gray-700 hover:bg-gray-50"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-12 rounded-2xl bg-gray-950 px-6 text-sm font-black text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving
                    ? "កំពុងរក្សាទុក..."
                    : editingProduct
                      ? "បញ្ជាក់កែប្រែផលិតផល"
                      : "បញ្ជាក់បន្ថែមផលិតផល"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <p className="text-sm font-black text-red-600">លុបផលិតផល</p>
            <h2 className="mt-2 text-2xl font-black text-gray-950">
              {deleteCandidate.name}
            </h2>
            <p className="mt-3 text-sm text-gray-500">
              ផលិតផលនេះនឹងត្រូវដកចេញពីបញ្ជីលក់ ប៉ុន្តែប្រវត្តិវិក្កយបត្រចាស់នៅតែរក្សាទុក។
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="rounded-2xl bg-gray-100 px-5 py-3 text-sm font-black text-gray-700 hover:bg-gray-200"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={saving}
                className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-700 disabled:opacity-50"
              >
                បញ្ជាក់លុប
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

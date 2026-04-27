import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";

const initialForm = {
  name: "",
  category: "",
  wholesale_unit_name: "", // 👈 THIS LINE
  box_size: "",
  box_cost: "",
  wholesale_box_price: "",
  stock_boxes: "",
  min_stock_boxes: "",
  retail_unit_name: "",
  retail_price_per_unit: "",
};

function getRetailUnitByCategory(category) {
  if (category === "beer") return "កំប៉ុង";
  if (category === "drink") return "កំប៉ុង";
  if (category === "snack") return "កញ្ចប់";
  if (category === "sweet") return "កញ្ចប់";
  return "";
}

function getBoxUnitByCategory(category) {
  if (category === "beer") return "កេស";
  if (category === "drink") return "កេស";
  if (category === "snack") return "ស្បោង";
  if (category === "sweet") return "ស្បោង";
  return "box";
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await apiRequest("/products");
      setProducts(data);
    } catch (error) {
      alert("Failed to load products");
      console.error(error);
    }
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function closeModal() {
    setShowAddModal(false);
    setEditingProduct(null);
    setForm(initialForm);
  }

  function openEditModal(product) {
    setEditingProduct(product);

    const boxUnit = product.units?.find((u) => Number(u.conversion_qty) > 1);
    const retailUnit = product.units?.find(
      (u) => Number(u.conversion_qty) === 1,
    );

    const boxSize = boxUnit?.conversion_qty || "";
    const stockBoxes = boxSize ? product.current_stock / boxSize : "";
    const minStockBoxes = boxSize ? product.min_stock / boxSize : "";
    const boxCost = boxSize ? product.cost_price_base * boxSize : "";

    setForm({
  name: product.name || "",
  category: product.category || "beer",
  wholesale_unit_name: boxUnit?.unit_name || "",
  box_size: boxSize,
  box_cost: boxCost,
  wholesale_box_price: boxUnit?.wholesale_price || "",
  stock_boxes: stockBoxes,
  min_stock_boxes: minStockBoxes,
  retail_unit_name: retailUnit?.unit_name || "",
  retail_price_per_unit: retailUnit?.retail_price || "",
});
    setShowAddModal(true);
  }

  async function deleteProduct(id) {
    const confirmed = confirm("Are you sure you want to delete this product?");
    if (!confirmed) return;

    try {
      await apiRequest(`/products/${id}`, {
        method: "DELETE",
      });

      await loadProducts();
      alert("Product deleted successfully!");
    } catch (error) {
      alert(error.message);
      console.error(error);
    }
  }

  async function createProduct(e) {
    e.preventDefault();

    if (
  !form.name ||
  !form.category ||
  !form.wholesale_unit_name ||
  !form.box_size ||
  !form.box_cost ||
  !form.wholesale_box_price ||
  !form.stock_boxes ||
  !form.min_stock_boxes ||
  !form.retail_unit_name ||
  !form.retail_price_per_unit
) {
  alert("Please fill all fields");
  return;
}

    try {
      setSaving(true);

      await apiRequest(
        editingProduct ? `/products/${editingProduct.id}` : "/products",
        {
          method: editingProduct ? "PUT" : "POST",
          body: JSON.stringify({
            name: form.name,
            category: form.category || "beer",
            category_id: null,
            base_unit: form.retail_unit_name,
            cost_price_base: Number(form.box_cost) / Number(form.box_size),
            current_stock: Number(form.stock_boxes) * Number(form.box_size),
            min_stock: Number(form.min_stock_boxes) * Number(form.box_size),
            units: [
              {
                unit_name: form.retail_unit_name,
                conversion_qty: 1,
                retail_price: Number(form.retail_price_per_unit),
                wholesale_price: Number(form.retail_price_per_unit),
              },
              {
                unit_name: form.wholesale_unit_name,
                conversion_qty: Number(form.box_size),
                retail_price: Number(form.wholesale_box_price),
                wholesale_price: Number(form.wholesale_box_price),
              },
            ],
          }),
        },
      );

      await loadProducts();
      closeModal();
      alert(editingProduct ? "Product updated!" : "Product created!");
    } catch (error) {
      alert(error.message);
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-gray-900 focus:ring-4 focus:ring-gray-100";
  const labelClass = "text-sm font-bold text-gray-700";

  function getBoxStock(product) {
    const boxUnit = product.units?.find((u) => Number(u.conversion_qty) > 1);

    if (!boxUnit) {
      return null;
    }

    const boxSize = Number(boxUnit.conversion_qty);
    const totalBaseStock = Number(product.current_stock);

    const fullBoxes = Math.floor(totalBaseStock / boxSize);
    const remainingUnits = totalBaseStock % boxSize;

    return {
      fullBoxes,
      remainingUnits,
      boxSize,
    };
  }

  return (
  <div>
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-black text-gray-900">ផលិតផល</h1>
        <p className="text-gray-500 mt-1">
          គ្រប់គ្រងផលិតផល ស្តុក និងតម្លៃលក់
        </p>
      </div>

      <button
        onClick={() => {
          setEditingProduct(null);
          setForm(initialForm);
          setShowAddModal(true);
        }}
        className="rounded-2xl bg-gray-950 text-white px-5 py-3 font-bold hover:bg-gray-800"
      >
        + បន្ថែមផលិតផល
      </button>
    </div>

    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-sm font-bold text-gray-500">ផលិតផល</th>
            <th className="px-6 py-4 text-sm font-bold text-gray-500">ស្តុក</th>
            <th className="px-6 py-4 text-sm font-bold text-gray-500">តម្លៃ</th>
            <th className="px-6 py-4 text-sm font-bold text-gray-500">ព័ត៌មានលក់ដុំ</th>
            <th className="px-6 py-4 text-sm font-bold text-gray-500 text-right">សកម្មភាព</th>
          </tr>
        </thead>

        <tbody>
          {products.map((p, index) => {
            const box = getBoxStock(p);
            const boxUnit = p.units?.find((u) => Number(u.conversion_qty) > 1);
            const retailUnit = p.units?.find((u) => Number(u.conversion_qty) === 1);

            return (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-5 align-middle">
                  <p className="text-base font-black text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-1">លេខរៀង #{index + 1}</p>
                </td>

                <td className="px-6 py-5 align-middle">
                  <div className="flex flex-col gap-2">
                    {box && (
                      <span className="w-fit rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-sm font-black">
                        {box.fullBoxes} {boxUnit?.unit_name || "កេស"}
                        {box.remainingUnits > 0
                          ? ` + ${box.remainingUnits} ${p.base_unit || p.unit}`
                          : ""}
                      </span>
                    )}

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                        p.current_stock <= p.min_stock
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      សរុប: {p.current_stock} {p.base_unit || p.unit}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-5 align-middle">
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-gray-400">ទិញចូល:</span>{" "}
                      <span className="font-bold text-gray-900">
                        ${Number(p.cost_price_base || 0).toFixed(2)} / {p.base_unit}
                      </span>
                    </p>

                    {retailUnit && (
                      <p>
                        <span className="text-gray-400">លក់រាយ:</span>{" "}
                        <span className="font-bold text-gray-900">
                          ${Number(retailUnit.retail_price || 0).toFixed(2)} /{" "}
                          {retailUnit.unit_name}
                        </span>
                      </p>
                    )}

                    {boxUnit && (
                      <p>
                        <span className="text-gray-400">លក់ដុំ:</span>{" "}
                        <span className="font-bold text-gray-900">
                          ${Number(boxUnit.wholesale_price || 0).toFixed(2)}
                        </span>
                      </p>
                    )}
                  </div>
                </td>

                <td className="px-6 py-5 align-middle">
                  {boxUnit ? (
                    <div className="space-y-1">
                      <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-700">
                        {boxUnit.conversion_qty} {p.base_unit} / {boxUnit.unit_name}
                      </span>
                      <p className="text-xs text-gray-400">
                        ជិតអស់ស្តុក:{" "}
                        {Math.floor(Number(p.min_stock) / Number(boxUnit.conversion_qty))}{" "}
                        {boxUnit.unit_name}
                      </p>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">មិនមានឯកតាលក់ដុំ</span>
                  )}
                </td>

                <td className="px-6 py-5 align-middle text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200"
                    >
                      កែប្រែ
                    </button>

                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-200"
                    >
                      លុប
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}

          {products.length === 0 && (
            <tr>
              <td colSpan="5" className="px-6 py-10 text-center text-gray-400">
                មិនទាន់មានផលិតផលទេ
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {showAddModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden">
          <div className="flex items-start justify-between border-b border-gray-100 px-7 py-6">
            <div>
              <div className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600 mb-3">
                ផលិតផល
              </div>

              <h2 className="text-3xl font-black text-gray-900">
                {editingProduct ? "កែប្រែផលិតផល" : "បន្ថែមផលិតផល"}
              </h2>

              <p className="text-gray-500 mt-1">
                បញ្ចូលព័ត៌មានលក់ដុំ និងលក់រាយ
              </p>
            </div>

            <button
              onClick={closeModal}
              className="rounded-2xl bg-gray-100 w-12 h-12 font-black text-gray-500 hover:bg-gray-200"
            >
              ×
            </button>
          </div>

          <form
            onSubmit={createProduct}
            className="p-7 space-y-5 overflow-y-auto max-h-[calc(92vh-120px)]"
          >
            <section className="rounded-3xl bg-gray-50 border border-gray-200 p-5">
              <h3 className="text-lg font-black text-gray-900 mb-4">
                ព័ត៌មានផលិតផល
              </h3>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>ឈ្មោះផលិតផល</label>
                  <input
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>ប្រភេទ</label>
                    <select
                      value={form.category}
                      onChange={(e) => updateForm("category", e.target.value)}
                      className={inputClass}
                    >
                      <option value="">ជ្រើសរើសប្រភេទ</option>
                      <option value="beer">ស្រាបៀរ</option>
                      <option value="drink">ភេសជ្ជៈ</option>
                      <option value="snack">អាហារសម្រន់</option>
                      <option value="sweet">អាហារបង្អែម</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>ឯកតាលក់ដុំ</label>
                    <select
                      value={form.wholesale_unit_name}
                      onChange={(e) => updateForm("wholesale_unit_name", e.target.value)}
                      className={inputClass}
                    >
                      <option value="">ជ្រើសរើសឯកតា</option>
                      <option value="កេស">កេស</option>
                      <option value="ស្បោង">ស្បោង</option>
                      <option value="ថង់">ថង់</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-gray-50 border border-gray-200 p-5">
              <h3 className="text-lg font-black text-gray-900 mb-4">លក់ដុំ</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>ចំនួនឥវ៉ាន់រាយក្នុងមួយកេស/ថង់</label>
                  <input
                    type="number"
                    value={form.box_size}
                    onChange={(e) => updateForm("box_size", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>តម្លៃទិញចូល</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.box_cost}
                    onChange={(e) => updateForm("box_cost", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    តម្លៃលក់ដុំក្នុងមួយ {form.wholesale_unit_name || "ឯកតា"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.wholesale_box_price}
                    onChange={(e) => updateForm("wholesale_box_price", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    ស្តុកបច្ចុប្បន្នជា {form.wholesale_unit_name || "ឯកតា"}
                  </label>
                  <input
                    type="number"
                    value={form.stock_boxes}
                    onChange={(e) => updateForm("stock_boxes", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    កំណាត់អោយជូនដំណឹងពេលផលិតផលជិតអស់ស្តុក {form.wholesale_unit_name || "ឯកតា"}
                  </label>
                  <input
                    type="number"
                    value={form.min_stock_boxes}
                    onChange={(e) => updateForm("min_stock_boxes", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-gray-50 border border-gray-200 p-5">
              <h3 className="text-lg font-black text-gray-900 mb-4">
                លក់រាយ
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>លក់រាយជា</label>
                  <select
                    value={form.retail_unit_name}
                    onChange={(e) => updateForm("retail_unit_name", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">ជ្រើសរើសឯកតា</option>      
                    <option value="កំប៉ុង">កំប៉ុង</option>
                    <option value="ស្បោង">ស្បោង</option>
                    <option value="ថង់">ថង់</option>
                    <option value="កញ្ចប់">កញ្ចប់</option>
                    <option value="ដប">ដប </option>

                  </select>
                </div>

                <div>
                  <label className={labelClass}>តម្លៃលក់រាយ</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.retail_price_per_unit}
                    onChange={(e) => updateForm("retail_price_per_unit", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <div className="sticky bottom-0 bg-white pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-2xl bg-gray-100 px-5 py-3 font-bold text-gray-700 hover:bg-gray-200"
              >
                បោះបង់
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-gray-950 text-white px-6 py-3 font-bold hover:bg-gray-800 disabled:opacity-50"
              >
                {saving
                  ? "កំពុងរក្សាទុក..."
                  : editingProduct
                  ? "កែប្រែ"
                  : "រក្សាទុក"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);
}

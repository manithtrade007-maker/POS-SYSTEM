import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");


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

  function getBoxStock(product) {
    const boxUnit = product.units?.find(
  (u) => Number(u.conversion_qty) > 1
);

    if (!boxUnit) return null;

    const boxSize = Number(boxUnit.conversion_qty);
    const totalStock = Number(product.current_stock);

    return {
      fullBoxes: Math.floor(totalStock / boxSize),
      remainingUnits: totalStock % boxSize,
      boxSize,
    };
  }

  function addToCart(product, unit, priceType) {
    const unitPrice =
      priceType === "retail" ? unit.retail_price : unit.wholesale_price;

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
          price: unitPrice,
          conversion_qty: unit.conversion_qty,
        },
      ];
    });
  }

  function updateQty(index, value) {
    const qty = Number(value);

    setCart((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: qty < 1 ? 1 : qty } : item,
      ),
    );
  }

  function removeItem(index) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  function getTotal() {
    return cart.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.price),
      0,
    );
  }

  async function completeSale() {
    try {
      const items = cart.map((item) => ({
        product_id: item.product_id,
        product_unit_id: item.product_unit_id,
        quantity: Number(item.quantity),
        price_type: item.price_type,
      }));

      await apiRequest("/sales", {
        method: "POST",
        body: JSON.stringify({
          items,
          discount: 0,
          payment_method: "cash",
          note: "Sale from POS screen",
        }),
      });

      alert("Sale completed successfully!");
      setCart([]);
      loadProducts();
    } catch (error) {
      alert(error.message);
      console.error(error);
    }
  }

    const categories = [
  { label: "All", value: "all" },
  { label: "Beer", value: "beer" },
  { label: "Drink", value: "drink" },
  { label: "Snack", value: "snack" },
  { label: "Sweet", value: "sweet" },
];

const filteredProducts = products.filter((product) => {
  const matchesSearch = product.name
    .toLowerCase()
    .includes(search.toLowerCase());

  const productCategory = product.category || "beer";

  const matchesCategory =
    selectedCategory === "all" || productCategory === selectedCategory;

  return matchesSearch && matchesCategory;
});

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <section className="xl:col-span-2">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-900">Sell / Invoice</h1>
          <p className="text-gray-500 mt-1">
            Select product, choose កំប៉ុង or កេស, then complete sale.
          </p>

          <div className="mt-5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product..."
              className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-gray-900 outline-none focus:border-gray-900 focus:ring-4 focus:ring-gray-100"
            />

            <div className="mt-4 flex flex-wrap gap-2">
  {categories.map((category) => (
    <button
      key={category.value}
      onClick={() => setSelectedCategory(category.value)}
      className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${
        selectedCategory === category.value
          ? "bg-gray-950 text-white"
          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
      }`}
    >
      {category.label}
    </button>
  ))}
</div>
          </div>
        </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {filteredProducts.length === 0 ? (
    <div className="col-span-full rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-400">
      មិនមានទំនិញទេ
    </div>
  ) : (
    filteredProducts.map((product) => {
      const retailUnit = product.units?.find(
        (u) => Number(u.conversion_qty) === 1
      );

      const boxUnit = product.units?.find((u) => Number(u.conversion_qty) > 1​ );
      const boxStock = getBoxStock(product);
      return (
        <div
          key={product.id}
          className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5"
        >
          <div
  key={product.id}
  className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5"
>
  <h2 className="text-xl font-black text-gray-900">
    {product.name}
  </h2>

  <p className="text-sm text-gray-500 mt-1">
    Stock: {boxStock?.fullBoxes} កេស / Total {product.current_stock} {product.base_unit}
  </p>

  <div className="mt-5 grid grid-cols-2 gap-3">
    {retailUnit && (
      <button
        onClick={() => addToCart(product, retailUnit, "retail")}
        className="rounded-2xl bg-gray-100 p-4"
      >
        <p>លក់រាយ</p>
        <p className="text-2xl font-bold">
          ${Number(retailUnit.retail_price).toFixed(2)}
        </p>
      </button>
    )}

    {boxUnit && (
      <button
        onClick={() => addToCart(product, boxUnit, "wholesale")}
        className="rounded-2xl bg-blue-600 text-white p-4"
      >
        <p>លក់ដុំ</p>
        <p className="text-2xl font-bold">
          ${Number(boxUnit.wholesale_price).toFixed(2)}
        </p>
      </button>
    )}
  </div>
</div>
        </div>
      );
    })
  )}
</div>
      </section>

      <section className="bg-white rounded-3xl shadow-sm border border-gray-200 p-5 h-fit sticky top-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-gray-900">Cart</h2>
          <span className="text-sm text-gray-500">{cart.length} items</span>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-3xl">
            <p className="text-gray-400">No items yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Select product to start sale
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item, index) => (
              <div
                key={`${item.product_id}-${item.product_unit_id}-${item.price_type}`}
                className="rounded-2xl border border-gray-200 p-4"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-black text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.price_type === "retail" ? "លក់រាយ" : "លក់ដុំ"} /{" "}
                      {item.unit_name}
                    </p>
                  </div>

                  <button
                    onClick={() => removeItem(index)}
                    className="text-red-500 text-sm font-bold"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQty(index, e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500">
                      Price
                    </label>
                    <div className="mt-1 rounded-xl bg-gray-50 px-3 py-2 font-bold">
                      ${Number(item.price).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex justify-between text-sm text-gray-500">
                  <span>
                    Stock reduce: {item.quantity * item.conversion_qty} unit
                  </span>
                  <span className="font-black text-gray-900">
                    ${(Number(item.quantity) * Number(item.price)).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t mt-5 pt-5">
          <div className="flex justify-between items-center">
            <p className="text-gray-500">Total</p>
            <p className="text-3xl font-black text-gray-900">
              ${getTotal().toFixed(2)}
            </p>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={completeSale}
            className="w-full mt-5 rounded-2xl bg-gray-950 text-white py-4 font-bold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Complete Sale
          </button>
        </div>
      </section>
    </div>
  );
}

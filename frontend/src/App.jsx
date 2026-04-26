import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import POS from "./pages/POS.jsx";
import Invoices from "./pages/Invoices.jsx";
import Reports from "./pages/Reports.jsx";

function App() {
  const linkClass = ({ isActive }) =>
    `px-4 py-3 rounded-xl text-sm font-medium transition ${
      isActive
        ? "bg-white text-gray-900 shadow"
        : "text-gray-300 hover:bg-gray-800 hover:text-white"
    }`;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 flex">
        <aside className="w-64 bg-gray-950 text-white p-5 flex flex-col">
          <div className="mb-8">
            <h1 className="text-2xl font-black tracking-tight">GrocyPOS</h1>
            <p className="text-sm text-gray-400 mt-1">Wholesale & Retail</p>
          </div>

          <nav className="grid gap-2">
            <NavLink to="/" className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/pos" className={linkClass}>
              Sell / Invoice
            </NavLink>
            <NavLink to="/products" className={linkClass}>
              Products
            </NavLink>
            <NavLink to="/invoices" className={linkClass}>
              Invoices
            </NavLink>
            <NavLink to="/reports" className={linkClass}>
              Reports
            </NavLink>
          </nav>

          <div className="mt-auto bg-gray-900 rounded-2xl p-4">
            <p className="text-sm text-gray-400">Local Mode</p>
            <p className="text-xs text-gray-500 mt-1">SQLite database active</p>
          </div>
        </aside>

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/products" element={<Products />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
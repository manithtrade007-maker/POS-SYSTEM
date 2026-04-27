import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import POS from "./pages/POS.jsx";
import Invoices from "./pages/Invoices.jsx";
import Reports from "./pages/Reports.jsx";

const navItems = [
  {
    to: "/",
    code: "DB",
    label: "ផ្ទាំងគ្រប់គ្រង",
    hint: "ស្ថានភាពថ្ងៃនេះ",
  },
  {
    to: "/pos",
    code: "POS",
    label: "លក់ទំនិញ",
    hint: "ចេញវិក្កយបត្រ",
  },
  {
    to: "/products",
    code: "ST",
    label: "ផលិតផល",
    hint: "ស្តុក និងតម្លៃ",
  },
  {
    to: "/invoices",
    code: "INV",
    label: "វិក្កយបត្រ",
    hint: "ប្រវត្តិការលក់",
  },
  {
    to: "/reports",
    code: "RPT",
    label: "របាយការណ៍",
    hint: "លក់ ចំណេញ ស្តុក",
  },
];

function App() {
  const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
      isActive
        ? "bg-white text-gray-950 shadow"
        : "text-gray-300 hover:bg-gray-900 hover:text-white"
    }`;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 flex">
        <aside className="w-72 shrink-0 bg-gray-950 text-white p-5 flex flex-col">
          <div className="mb-7">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-sm font-black text-gray-950">
                POS
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">
                  GrocyPOS
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  ប្រព័ន្ធលក់ដុំ និងលក់រាយ
                </p>
              </div>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between px-2">
            <p className="text-xs font-black uppercase tracking-wider text-gray-500">
              ម៉ឺនុយ
            </p>
            <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-black text-green-300">
              កំពុងដំណើរការ
            </span>
          </div>

          <nav className="grid gap-2">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xs font-black ${
                        isActive
                          ? "bg-gray-950 text-white"
                          : "bg-gray-900 text-gray-400 group-hover:bg-white group-hover:text-gray-950"
                      }`}
                    >
                      {item.code}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black">
                        {item.label}
                      </span>
                      <span
                        className={`mt-0.5 block truncate text-xs ${
                          isActive
                            ? "text-gray-500"
                            : "text-gray-500 group-hover:text-gray-300"
                        }`}
                      >
                        {item.hint}
                      </span>
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto rounded-3xl border border-white/10 bg-gray-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-black text-white">ប្រព័ន្ធមូលដ្ឋាន</p>
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>
            <div className="rounded-2xl bg-gray-950 p-4">
              <p className="text-xs font-bold text-gray-400">
                មូលដ្ឋានទិន្នន័យ
              </p>
              <p className="mt-1 text-sm font-black text-gray-100">
                SQLite កំពុងភ្ជាប់
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-6">
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

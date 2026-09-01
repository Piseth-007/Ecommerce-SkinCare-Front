import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  Sun,
  Moon,
  ShoppingBag,
  AlertTriangle,
} from "lucide-react";
import api from "../../api/axios";

const LOW_STOCK_THRESHOLD = 5;
const POLL_INTERVAL_MS = 60000; // refresh every 60s

export default function Navbar({ onMenuClick }) {
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  const dropdownRef = useRef(null);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  const loadAlerts = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        api.get("/admin/orders", { params: { status: "pending" } }),
        api.get("/products"),
      ]);

      const orders = ordersRes.data?.data || [];
      const products = productsRes.data?.data || productsRes.data || [];

      const lowStock = products.filter((product) => {
        const stock = Number(product.stock || 0);
        return stock > 0 && stock <= LOW_STOCK_THRESHOLD;
      });

      setPendingOrders(orders);
      setLowStockProducts(lowStock);
    } catch {
      // Fail silently — notifications aren't critical path, avoid noisy toasts
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();

    const interval = setInterval(loadAlerts, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalAlerts = pendingOrders.length + lowStockProducts.length;

  const goToOrders = () => {
    setOpen(false);
    navigate("/admin/orders");
  };

  const goToProducts = () => {
    setOpen(false);
    navigate("/admin/products");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-hairline bg-surface px-5 lg:px-10">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline text-stone transition-colors hover:bg-paper hover:text-ink lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={19} strokeWidth={1.75} />
        </button>

        <p className="font-display text-[17px] font-medium text-ink">
          Store Owner Panel
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-hairline text-stone transition-colors hover:bg-paper hover:text-ink"
            aria-label="Notifications"
          >
            <Bell size={17} strokeWidth={1.75} />

            {totalAlerts > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[9px] font-semibold text-white">
                {totalAlerts > 9 ? "9+" : totalAlerts}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-hairline bg-surface shadow-[0_12px_32px_rgba(33,31,27,0.12)]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
                <p className="text-[13px] font-medium text-ink">
                  Notifications
                </p>

                {totalAlerts > 0 && (
                  <span className="rounded-md bg-clay-tint px-2 py-0.5 text-[10.5px] font-medium text-clay">
                    {totalAlerts} new
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="px-4 py-6 text-center text-[12.5px] text-stone">
                    Loading...
                  </div>
                ) : totalAlerts === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell
                      size={20}
                      className="mx-auto mb-2 text-stone/40"
                      strokeWidth={1.5}
                    />
                    <p className="text-[12.5px] text-stone">
                      You're all caught up
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-hairline">
                    {/* Pending Orders */}
                    {pendingOrders.slice(0, 5).map((order) => (
                      <button
                        key={`order-${order.id}`}
                        type="button"
                        onClick={goToOrders}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-paper"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-moss-tint">
                          <ShoppingBag
                            size={14}
                            className="text-moss"
                            strokeWidth={1.75}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[12.5px] font-medium text-ink">
                            New order #{order.id}
                          </p>

                          <p className="mt-0.5 truncate text-[11.5px] text-stone">
                            {order.user?.name || "Customer"} · $
                            {Number(order.total || 0).toFixed(2)}
                          </p>
                        </div>
                      </button>
                    ))}

                    {/* Low Stock Products */}
                    {lowStockProducts.slice(0, 5).map((product) => (
                      <button
                        key={`stock-${product.id}`}
                        type="button"
                        onClick={goToProducts}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-paper"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-clay-tint">
                          <AlertTriangle
                            size={14}
                            className="text-clay"
                            strokeWidth={1.75}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-medium text-ink">
                            {product.name}
                          </p>

                          <p className="mt-0.5 text-[11.5px] text-stone">
                            Only {product.stock} left in stock
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {totalAlerts > 0 && (
                <div className="flex items-center gap-2 border-t border-hairline px-4 py-2.5">
                  <button
                    type="button"
                    onClick={goToOrders}
                    className="flex-1 rounded-lg py-1.5 text-center text-[11.5px] font-medium text-moss transition-colors hover:bg-moss-tint"
                  >
                    View Orders
                  </button>

                  <button
                    type="button"
                    onClick={goToProducts}
                    className="flex-1 rounded-lg py-1.5 text-center text-[11.5px] font-medium text-moss transition-colors hover:bg-moss-tint"
                  >
                    View Stock
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dark Mode */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline text-stone transition-colors hover:bg-paper hover:text-ink"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <Sun size={17} strokeWidth={1.75} />
          ) : (
            <Moon size={17} strokeWidth={1.75} />
          )}
        </button>
      </div>
    </header>
  );
}

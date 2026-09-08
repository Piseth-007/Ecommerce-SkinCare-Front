import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  Sun,
  Moon,
  ShoppingBag,
  AlertTriangle,
  X,
} from "lucide-react";
import api from "../../api/axios";
import { useTheme } from "../../hooks/useTheme";

const LOW_STOCK_THRESHOLD = 5;
const POLL_INTERVAL_MS = 60000;

export default function Navbar({ onMenuClick }) {
  const navigate = useNavigate();

  const { isDark: darkMode, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  const dropdownRef = useRef(null);
  const dismissedOrderIdsRef = useRef(new Set());
  const dismissedStockIdsRef = useRef(new Set());

  const loadAlerts = async () => {
    try {
      const [pendingOrdersRes, paidOrdersRes, productsRes] = await Promise.all([
        api.get("/admin/orders", { params: { status: "pending" } }),
        api.get("/admin/orders", { params: { status: "paid" } }),
        api.get("/products"),
      ]);

      const pendingOrders = pendingOrdersRes.data?.data || [];
      const paidOrders = paidOrdersRes.data?.data || [];
      const orders = [...pendingOrders, ...paidOrders]
        .filter(
          (order, index, allOrders) =>
            allOrders.findIndex((item) => item.id === order.id) === index,
        )
        .filter((order) => !dismissedOrderIdsRef.current.has(order.id))
        .sort(
          (first, second) =>
            new Date(second.created_at || 0) - new Date(first.created_at || 0),
        );
      const products = productsRes.data?.data || productsRes.data || [];

      const lowStock = products.filter((product) => {
        const stock = Number(product.stock || 0);
        return (
          stock > 0 &&
          stock <= LOW_STOCK_THRESHOLD &&
          !dismissedStockIdsRef.current.has(product.id)
        );
      });

      setPendingOrders(orders);
      setLowStockProducts(lowStock);
    } catch {
      // Ignore background notification fetch errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();

    const interval = setInterval(loadAlerts, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  
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

  const goToOrders = (orderId) => {
    setOpen(false);
    navigate(orderId ? `/admin/orders?order=${orderId}` : "/admin/orders");
  };

  const toggleNotifications = () => {
    setOpen((previousOpen) => {
      const nextOpen = !previousOpen;
      if (nextOpen) loadAlerts();
      return nextOpen;
    });
  };

  const clearNotifications = () => {
    pendingOrders.forEach((order) =>
      dismissedOrderIdsRef.current.add(order.id),
    );
    lowStockProducts.forEach((product) =>
      dismissedStockIdsRef.current.add(product.id),
    );
    setPendingOrders([]);
    setLowStockProducts([]);
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
   
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={toggleNotifications}
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
                
                    {pendingOrders.slice(0, 5).map((order) => (
                      <button
                        key={`order-${order.id}`}
                        type="button"
                        onClick={() => goToOrders(order.id)}
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

                  <button
                    type="button"
                    onClick={clearNotifications}
                    className="flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11.5px] font-medium text-stone transition-colors hover:bg-paper hover:text-ink"
                    title="Clear notifications"
                  >
                    <X size={13} />
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

 
        <button
          type="button"
          onClick={toggleTheme}
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

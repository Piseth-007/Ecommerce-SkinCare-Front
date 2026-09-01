import { useContext, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  RefreshCw,
  ShoppingBag,
  Clock3,
  CheckCircle2,
  Truck,
  XCircle,
  Package,
  User,
  MapPin,
  Printer,
  Search,
  X,
} from "lucide-react";
import api from "../../api/axios";
import { RowSkeleton } from "../../components/Skeleton";
import { ToastContext } from "../../context/ToastContext";
import Receipt from "../../components/Receipt";

const STATUSES = ["pending", "paid", "shipped", "completed", "cancelled"];

const statusStyles = {
  pending: "bg-stone/10 text-stone",
  paid: "bg-moss-tint text-moss-deep",
  shipped: "bg-moss-tint text-moss-deep",
  completed: "bg-moss-tint text-moss-deep",
  cancelled: "bg-clay-tint text-clay",
};

const statusIcons = {
  pending: Clock3,
  paid: CheckCircle2,
  shipped: Truck,
  completed: CheckCircle2,
  cancelled: XCircle,
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [printingOrder, setPrintingOrder] = useState(null);

  const { showToast } = useContext(ToastContext);

  const loadOrders = async (status = filter, isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await api.get("/admin/orders", {
        params: status ? { status } : {},
      });

      setOrders(res.data?.data || []);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load orders";

      setError(message);

      if (isRefresh) {
        showToast(message, "error");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders(filter);
  }, [filter]);

  const handleStatusChange = async (orderId, status) => {
    const currentOrder = orders.find((order) => order.id === orderId);

    if (currentOrder?.status === status) return;

    try {
      setUpdatingId(orderId);

      const res = await api.patch(`/admin/orders/${orderId}/status`, {
        status,
      });

      const updatedStatus = res.data?.status || status;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: updatedStatus } : order,
        ),
      );

      showToast(`Order #${orderId} updated to ${updatedStatus}`);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to update order status",
        "error",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePrint = (order) => {
    setPrintingOrder(order);
    setTimeout(() => window.print(), 50);
  };

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return orders;

    return orders.filter((order) => {
      const orderId = String(order.id || "");
      const customerName = order.user?.name?.toLowerCase() || "";
      const customerEmail = order.user?.email?.toLowerCase() || "";

      return (
        orderId.includes(keyword) ||
        customerName.includes(keyword) ||
        customerEmail.includes(keyword)
      );
    });
  }, [orders, search]);

  const toggleOrder = (id) => {
    setExpanded((current) => (current === id ? null : id));
  };

  const clearSearch = () => setSearch("");

  return (
    <div className="max-w-7xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-2 print:hidden">
        <div>

          <div className="flex items-center gap-3">
            <h1 className="font-display text-[28px] font-medium text-ink">
              Orders
            </h1>

            {!loading && (
              <span className="px-2 py-0.5 rounded-md bg-moss-tint text-moss text-[11px] font-medium">
                {orders.length}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadOrders(filter, true)}
          disabled={loading || refreshing}
          className="w-10 h-10 rounded-lg border border-hairline bg-surface flex items-center justify-center text-stone hover:text-ink hover:bg-paper transition-colors disabled:opacity-50"
          title="Refresh orders"
        >
          <RefreshCw
            size={16}
            strokeWidth={1.75}
            className={refreshing ? "animate-spin" : ""}
          />
        </button>
      </div>

      <div className="  rounded-xl  mb-5 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 lg:max-w-xs">
            <Search
              size={16}
              strokeWidth={1.75}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, customer..."
              className="w-100 pl-9 pr-9 py-2 rounded-lg border border-hairline bg-surface text-[13px] text-ink placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss transition-colors"
            />

            {search && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone hover:text-ink"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className=" bg-surface  border border-hairline rounded-xl flex items-center gap-2 overflow-x-auto lg:ml-auto">
            <FilterPill
              label="All"
              active={filter === ""}
              onClick={() => {
                setExpanded(null);
                setFilter("");
              }}
            />

            {STATUSES.map((status) => (
              <FilterPill
                key={status}
                label={status}
                active={filter === status}
                onClick={() => {
                  setExpanded(null);
                  setFilter(status);
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center justify-between gap-4 text-[13.5px] text-clay bg-clay-tint border border-clay/15 rounded-lg px-4 py-3 mb-5 print:hidden">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => loadOrders(filter)}
            className="text-[12.5px] font-medium underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="bg-surface border border-hairline rounded-xl overflow-hidden print:hidden">
          <div className="hidden md:grid grid-cols-[1.2fr_1.4fr_0.8fr_1fr_1fr] px-5 py-3 border-b border-hairline">
            {["Order", "Customer", "Total", "Date", "Status"].map((item) => (
              <p
                key={item}
                className="text-[10.5px] font-medium uppercase tracking-widest text-stone"
              >
                {item}
              </p>
            ))}
          </div>

          {Array.from({ length: 7 }).map((_, index) => (
            <RowSkeleton key={index} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState filter={filter} onClear={() => setFilter("")} />
      ) : filteredOrders.length === 0 ? (
        <SearchEmptyState search={search} onClear={clearSearch} />
      ) : (
        <div className="bg-surface border border-hairline rounded-xl overflow-hidden print:hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-187.5 text-left">
              <thead>
                <tr className="border-b border-hairline bg-paper/30">
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => {
                  const StatusIcon = statusIcons[order.status] || Clock3;

                  return (
                    <OrderRow
                      key={order.id}
                      order={order}
                      expanded={expanded === order.id}
                      updating={updatingId === order.id}
                      StatusIcon={StatusIcon}
                      onToggle={() => toggleOrder(order.id)}
                      onStatusChange={(status) =>
                        handleStatusChange(order.id, status)
                      }
                      onPrint={() => handlePrint(order)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Print-only receipt, mounted once outside the table */}
      <div className="print-area">
        <Receipt order={printingOrder} />
      </div>
    </div>
  );
}

function OrderRow({
  order,
  expanded,
  updating,
  StatusIcon,
  onToggle,
  onStatusChange,
  onPrint,
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`border-b border-hairline cursor-pointer transition-colors ${
          expanded ? "bg-paper/50" : "hover:bg-paper/60"
        }`}
      >
        {/* Order */}
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center transition-transform ${
                expanded ? "bg-moss-tint rotate-180" : "bg-paper"
              }`}
            >
              <ChevronDown
                size={14}
                className={expanded ? "text-moss" : "text-stone"}
              />
            </div>

            <span className="font-mono text-[13.5px] font-medium text-ink">
              #{order.id}
            </span>
          </div>
        </td>

        {/* Customer */}
        <td className="px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-moss-tint flex items-center justify-center shrink-0">
              <User size={14} className="text-moss" strokeWidth={1.75} />
            </div>

            <div className="min-w-0">
              <p className="text-[13.5px] font-medium text-ink truncate max-w-45">
                {order.user?.name || "Unknown customer"}
              </p>

              {order.user?.email && (
                <p className="text-[11.5px] text-stone truncate max-w-45">
                  {order.user.email}
                </p>
              )}
            </div>
          </div>
        </td>

        {/* Total */}
        <td className="px-5 py-4">
          <span className="font-mono text-[13.5px] font-medium text-ink">
            ${Number(order.total || 0).toFixed(2)}
          </span>
        </td>

        {/* Date */}
        <td className="px-5 py-4">
          <p className="text-[13px] text-ink">
            {order.created_at
              ? new Date(order.created_at).toLocaleDateString()
              : "-"}
          </p>

          {order.created_at && (
            <p className="text-[11.5px] text-stone mt-0.5">
              {new Date(order.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </td>

        {/* Status */}
        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
          <div className="relative inline-flex items-center">
            {updating && (
              <span className="absolute left-2.5 w-3 h-3 border-2 border-moss border-t-transparent rounded-full animate-spin z-10" />
            )}

            {!updating && (
              <StatusIcon
                size={13}
                className="absolute left-2.5 pointer-events-none"
                strokeWidth={1.75}
              />
            )}

            <select
              value={order.status}
              disabled={updating}
              onChange={(e) => onStatusChange(e.target.value)}
              className={`appearance-none pl-7 pr-3 py-1.5 rounded-md text-[11px] font-medium uppercase tracking-wide cursor-pointer border-0 focus:outline-none disabled:opacity-60 ${
                statusStyles[order.status] || "bg-stone/10 text-stone"
              }`}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </td>
      </tr>

      {/* Expanded Details */}
      {expanded && (
        <tr className="bg-paper/30 border-b border-hairline">
          <td colSpan={5} className="px-5 py-5">
            <div className="flex items-center justify-end mb-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrint();
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-hairline bg-surface text-[12.5px] font-medium text-ink hover:bg-paper transition-colors"
              >
                <Printer size={14} strokeWidth={1.75} />
                Print Receipt
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Shipping */}
              <div className="bg-surface border border-hairline rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={16} className="text-moss" strokeWidth={1.75} />

                  <div>
                    <p className="text-[10.5px] font-medium uppercase tracking-widest text-stone">
                      Shipping Address
                    </p>
                  </div>
                </div>

                <div className="text-[13px] text-ink leading-6">
                  <p className="font-medium">
                    {order.address?.full_name || "Not provided"}
                  </p>

                  {order.address?.phone && (
                    <p className="text-stone">{order.address.phone}</p>
                  )}

                  <p className="mt-1">
                    {[
                      order.address?.street_address,
                      order.address?.city,
                      order.address?.province_state,
                      order.address?.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || "No address available"}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="bg-surface border border-hairline rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Package
                      size={16}
                      className="text-moss"
                      strokeWidth={1.75}
                    />

                    <p className="text-[10.5px] font-medium uppercase tracking-widest text-stone">
                      Order Items
                    </p>
                  </div>

                  <span className="text-[11.5px] text-stone">
                    {order.items?.length || 0} items
                  </span>
                </div>

                {order.items?.length > 0 ? (
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 py-2 border-b border-hairline last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-ink truncate">
                            {item.product_name}
                          </p>

                          <p className="text-[11.5px] text-stone mt-0.5">
                            ${Number(item.price || 0).toFixed(2)} ×{" "}
                            {item.quantity}
                          </p>
                        </div>

                        <span className="font-mono text-[13px] text-ink whitespace-nowrap">
                          $
                          {(
                            Number(item.price || 0) * Number(item.quantity || 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-stone">
                    No item details available.
                  </p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}


function TableHead({ children }) {
  return (
    <th className="px-5 py-3 text-[10.5px] font-medium uppercase tracking-widest text-stone">
      {children}
    </th>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-lg text-[12px] font-medium capitalize transition-all whitespace-nowrap ${
        active
          ? "bg-moss text-white shadow-[0_2px_4px_rgba(33,31,27,0.1)]"
          : "text-stone hover:bg-paper hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({ filter, onClear }) {
  return (
    <div className="bg-surface border border-dashed border-hairline rounded-xl py-20 px-6 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-moss-tint flex items-center justify-center mb-4">
        <ShoppingBag size={22} className="text-moss" strokeWidth={1.75} />
      </div>

      <p className="text-[15px] font-medium text-ink mb-1">No orders found</p>

      <p className="max-w-sm text-[13px] leading-6 text-stone mb-5">
        {filter
          ? `There are currently no ${filter} orders.`
          : "Orders from your customers will appear here."}
      </p>

      {filter && (
        <button
          type="button"
          onClick={onClear}
          className="px-4 py-2 rounded-lg bg-paper border border-hairline text-[13px] font-medium text-ink hover:bg-hairline/30 transition-colors"
        >
          Show all orders
        </button>
      )}
    </div>
  );
}

function SearchEmptyState({ search, onClear }) {
  return (
    <div className="bg-surface border border-dashed border-hairline rounded-xl py-16 px-6 flex flex-col items-center text-center print:hidden">
      <div className="w-12 h-12 rounded-full bg-paper flex items-center justify-center mb-4">
        <Search size={20} className="text-stone" strokeWidth={1.75} />
      </div>

      <p className="text-[14px] font-medium text-ink mb-1">No orders found</p>

      <p className="text-[13px] text-stone mb-5">
        No results found for{" "}
        <span className="font-medium text-ink">"{search}"</span>
      </p>

      <button
        type="button"
        onClick={onClear}
        className="text-[13px] font-medium text-moss hover:text-moss-deep transition-colors"
      >
        Clear search
      </button>
    </div>
  );
}

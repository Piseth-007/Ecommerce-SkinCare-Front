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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../../api/axios";
import { RowSkeleton } from "../../components/Skeleton";
import { ToastContext } from "../../context/ToastContext";
import Receipt from "../../components/Receipt";

const STATUSES = ["pending", "paid", "shipped", "completed", "cancelled"];

const ORDERS_PER_PAGE = 10;

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
  const [currentPage, setCurrentPage] = useState(1);

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

  useEffect(() => {
    setCurrentPage(1);
    setExpanded(null);
  }, [filter, search]);

  const handleStatusChange = async (orderId, status) => {
    const currentOrder = orders.find((order) => order.id === orderId);

    if (currentOrder?.status === status) return;

    try {
      setUpdatingId(orderId);

      const res = await api.patch(`/admin/orders/${orderId}/status`, {
        status,
      });

      if (res.data?.deleted) {
        setOrders((prev) => prev.filter((order) => order.id !== orderId));

        setExpanded(null);

        showToast(`Order #${orderId} was cancelled and removed`);

        return;
      }

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

    setTimeout(() => {
      window.print();
    }, 50);
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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ORDERS_PER_PAGE),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;

    return filteredOrders.slice(startIndex, startIndex + ORDERS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const startOrder =
    filteredOrders.length === 0 ? 0 : (currentPage - 1) * ORDERS_PER_PAGE + 1;

  const endOrder = Math.min(
    currentPage * ORDERS_PER_PAGE,
    filteredOrders.length,
  );

  const toggleOrder = (id) => {
    setExpanded((current) => (current === id ? null : id));
  };

  const clearSearch = () => setSearch("");

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-2 flex flex-col gap-4 print:hidden sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[28px] font-medium text-ink">
              Orders
            </h1>

            {!loading && (
              <span className="rounded-md bg-moss-tint px-2 py-0.5 text-[11px] font-medium text-moss">
                {orders.length}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadOrders(filter, true)}
          disabled={loading || refreshing}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-surface text-stone transition-colors hover:bg-paper hover:text-ink disabled:opacity-50"
          title="Refresh orders"
          aria-label="Refresh orders"
        >
          <RefreshCw
            size={16}
            strokeWidth={1.75}
            className={refreshing ? "animate-spin" : ""}
          />
        </button>
      </div>

      <div className="mb-5 print:hidden">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
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
              className="w-full rounded-lg border border-hairline bg-surface py-2 pl-9 pr-9 text-[13px] text-ink placeholder:text-stone/50 transition-colors focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
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

          <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-hairline bg-surface p-1.5 lg:ml-auto">
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

        {!loading && orders.length > 0 && (
          <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
            <p className="text-[12px] text-stone">
              Showing{" "}
              <span className="font-medium text-ink">
                {filteredOrders.length}
              </span>{" "}
              of {orders.length} orders
            </p>

            {search && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-[12px] font-medium text-moss transition-colors hover:text-moss-deep"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {error && !loading && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-clay/15 bg-clay-tint px-4 py-3 text-[13.5px] text-clay print:hidden">
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

      {loading ? (
        <div className="overflow-hidden rounded-xl border border-hairline bg-surface print:hidden">
          <div className="hidden border-b border-hairline px-5 py-3 md:grid md:grid-cols-[1.2fr_1.4fr_0.8fr_1fr_1fr]">
            {["Order", "Customer", "Total", "Date", "Status"].map((item) => (
              <p
                key={item}
                className="text-[10.5px] font-medium uppercase tracking-widest text-stone"
              >
                {item}
              </p>
            ))}
          </div>

          {Array.from({ length: ORDERS_PER_PAGE }).map((_, index) => (
            <RowSkeleton key={index} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState filter={filter} onClear={() => setFilter("")} />
      ) : filteredOrders.length === 0 ? (
        <SearchEmptyState search={search} onClear={clearSearch} />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-hairline bg-surface print:hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left">
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
                  {paginatedOrders.map((order) => {
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

          {filteredOrders.length > ORDERS_PER_PAGE && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              startOrder={startOrder}
              endOrder={endOrder}
              totalOrders={filteredOrders.length}
              onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
              onNext={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
            />
          )}
        </>
      )}

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
        className={`cursor-pointer border-b border-hairline transition-colors ${
          expanded ? "bg-paper/50" : "hover:bg-paper/60"
        }`}
      >
        <td className="px-5 py-3">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-md transition-transform ${
                expanded ? "rotate-180 bg-moss-tint" : "bg-paper"
              }`}
            >
              <ChevronDown
                size={14}
                className={expanded ? "text-moss" : "text-stone"}
              />
            </div>

            <span className="font-mono text-[13px] font-medium text-ink">
              #{order.id}
            </span>
          </div>
        </td>

        <td className="px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-moss-tint">
              <User size={14} className="text-moss" strokeWidth={1.75} />
            </div>

            <div className="min-w-0">
              <p className="max-w-45 truncate text-[13px] font-medium text-ink">
                {order.user?.name || "Unknown customer"}
              </p>

              {order.user?.email && (
                <p className="max-w-45 truncate text-[11px] text-stone">
                  {order.user.email}
                </p>
              )}
            </div>
          </div>
        </td>

        <td className="px-5 py-3">
          <span className="font-mono text-[13px] font-medium text-ink">
            ${Number(order.total || 0).toFixed(2)}
          </span>
        </td>

        <td className="px-5 py-3">
          <p className="text-[12.5px] text-ink">
            {order.created_at
              ? new Date(order.created_at).toLocaleDateString()
              : "-"}
          </p>

          {order.created_at && (
            <p className="mt-0.5 text-[11px] text-stone">
              {new Date(order.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </td>

        <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="relative inline-flex items-center">
            {updating && (
              <span className="absolute left-2.5 z-10 h-3 w-3 animate-spin rounded-full border-2 border-moss border-t-transparent" />
            )}

            {!updating && (
              <StatusIcon
                size={13}
                className="pointer-events-none absolute left-2.5"
                strokeWidth={1.75}
              />
            )}

            <select
              value={order.status}
              disabled={updating}
              onChange={(e) => onStatusChange(e.target.value)}
              className={`cursor-pointer appearance-none rounded-md border-0 py-1.5 pl-7 pr-3 text-[11px] font-medium uppercase tracking-wide focus:outline-none disabled:opacity-60 ${
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

      {expanded && (
        <tr className="border-b border-hairline bg-paper/30">
          <td colSpan={5} className="px-5 py-4">
            <div className="mb-3 flex items-center justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrint();
                }}
                className="flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3.5 py-2 text-[12.5px] font-medium text-ink transition-colors hover:bg-paper"
              >
                <Printer size={14} strokeWidth={1.75} />
                Print Receipt
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-hairline bg-surface p-4">
                <div className="mb-3 flex items-center gap-2">
                  <MapPin size={16} className="text-moss" strokeWidth={1.75} />

                  <p className="text-[10.5px] font-medium uppercase tracking-widest text-stone">
                    Shipping Address
                  </p>
                </div>

                <div className="text-[13px] leading-6 text-ink">
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

              <div className="rounded-xl border border-hairline bg-surface p-4">
                <div className="mb-3 flex items-center justify-between">
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
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 border-b border-hairline py-2 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-ink">
                            {item.product_name}
                          </p>

                          <p className="mt-0.5 text-[11.5px] text-stone">
                            ${Number(item.price || 0).toFixed(2)} ×{" "}
                            {item.quantity}
                          </p>
                        </div>

                        <span className="whitespace-nowrap font-mono text-[13px] text-ink">
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

function Pagination({
  currentPage,
  totalPages,
  startOrder,
  endOrder,
  totalOrders,
  onPrevious,
  onNext,
}) {
  return (
    <div className="flex flex-col gap-3 py-5 print:hidden sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[12px] text-stone">
        Showing{" "}
        <span className="font-medium text-ink">
          {startOrder}–{endOrder}
        </span>{" "}
        of {totalOrders} orders
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage === 1}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-surface text-stone transition-colors hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="min-w-[85px] text-center text-[12px] text-stone">
          Page <span className="font-medium text-ink">{currentPage}</span> of{" "}
          {totalPages}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-surface text-stone transition-colors hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
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
      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11.5px] font-medium capitalize transition-all ${
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
    <div className="flex flex-col items-center rounded-xl border border-dashed border-hairline bg-surface px-6 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-moss-tint">
        <ShoppingBag size={22} className="text-moss" strokeWidth={1.75} />
      </div>

      <p className="mb-1 text-[15px] font-medium text-ink">No orders found</p>

      <p className="mb-5 max-w-sm text-[13px] leading-6 text-stone">
        {filter
          ? `There are currently no ${filter} orders.`
          : "Orders from your customers will appear here."}
      </p>

      {filter && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-hairline bg-paper px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-hairline/30"
        >
          Show all orders
        </button>
      )}
    </div>
  );
}

function SearchEmptyState({ search, onClear }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-hairline bg-surface px-6 py-16 text-center print:hidden">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-paper">
        <Search size={20} className="text-stone" strokeWidth={1.75} />
      </div>

      <p className="mb-1 text-[14px] font-medium text-ink">No orders found</p>

      <p className="mb-5 text-[13px] text-stone">
        No results found for{" "}
        <span className="font-medium text-ink">"{search}"</span>
      </p>

      <button
        type="button"
        onClick={onClear}
        className="text-[13px] font-medium text-moss transition-colors hover:text-moss-deep"
      >
        Clear search
      </button>
    </div>
  );
}

import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowRight,
  Clock3,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import api from "../../api/axios";
import { StatSkeleton } from "../../components/Skeleton";
import { ToastContext } from "../../context/ToastContext";

const RANGES = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "12m", label: "Last 12 months" },
];

const PIE_COLORS = {
  completed: "#3F5843",
  pending: "#D9A441",
  cancelled: "#C96A5B",
};

const CANCELLED_STATUSES = ["cancelled", "canceled", "rejected", "refunded"];

function useDarkMode() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const target = document.documentElement;

    const observer = new MutationObserver(() => {
      setIsDark(target.classList.contains("dark"));
    });

    observer.observe(target, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const isDark = useDarkMode();
  const { showToast } = useContext(ToastContext);

  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [trend, setTrend] = useState([]);
  const [range, setRange] = useState("7d");

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setSummaryLoading(true);
        setOrdersLoading(true);

        const [summaryResponse, ordersResponse] = await Promise.all([
          api.get("/admin/dashboard/summary"),
          api.get("/admin/orders"),
        ]);

        const summaryData = summaryResponse.data?.data ?? summaryResponse.data;

        const ordersData = ordersResponse.data?.data ?? ordersResponse.data;

        setSummary(summaryData || null);

        setOrders(extractOrders(ordersData));
      } catch (err) {
        setSummary(null);
        setOrders([]);

        showToast(
          err.response?.data?.message || "Failed to load dashboard",
          "error",
        );
      } finally {
        setSummaryLoading(false);
        setOrdersLoading(false);
      }
    };

    loadDashboard();
  }, [showToast]);

  useEffect(() => {
    const loadTrend = async () => {
      try {
        setTrendLoading(true);

        const res = await api.get("/admin/dashboard/sales-trend", {
          params: { range },
        });

        const data = res.data?.data ?? res.data;

        setTrend(Array.isArray(data) ? data : []);
      } catch (err) {
        setTrend([]);

        showToast(
          err.response?.data?.message || "Failed to load sales trend",
          "error",
        );
      } finally {
        setTrendLoading(false);
      }
    };

    loadTrend();
  }, [range, showToast]);

  const recentOrders = useMemo(() => {
    if (!Array.isArray(orders)) {
      return [];
    }

    return [...orders]
      .sort((a, b) => {
        const dateA = new Date(
          a.created_at || a.createdAt || a.order_date || a.date || 0,
        ).getTime();

        const dateB = new Date(
          b.created_at || b.createdAt || b.order_date || b.date || 0,
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [orders]);

  const topProducts = useMemo(() => {
    if (!Array.isArray(orders)) {
      return [];
    }

    const productMap = new Map();

    orders.forEach((order) => {
      const status = String(order.status || "").toLowerCase();

      if (CANCELLED_STATUSES.includes(status)) {
        return;
      }

      const items = Array.isArray(order.items)
        ? order.items
        : Array.isArray(order.order_items)
          ? order.order_items
          : [];

      items.forEach((item) => {
        const product =
          item.product || item.product_detail || item.productData || null;

        const productId = item.product_id ?? item.productId ?? product?.id;

        if (productId === undefined || productId === null) {
          return;
        }

        const quantity = Number(
          item.quantity ?? item.qty ?? item.order_quantity ?? 1,
        );

        if (!Number.isFinite(quantity) || quantity <= 0) {
          return;
        }

        const price = Number(
          item.price ??
            item.unit_price ??
            item.unitPrice ??
            product?.price ??
            0,
        );

        const revenue = price * quantity;

        const productName =
          item.product_name || item.productName || product?.name || "Product";

        const image =
          item.image ||
          item.image_url ||
          item.product_image ||
          item.productImage ||
          product?.image ||
          product?.image_url ||
          product?.images?.[0]?.url ||
          product?.images?.[0]?.image_url ||
          (typeof product?.images?.[0] === "string"
            ? product.images[0]
            : null) ||
          null;

        const existing = productMap.get(String(productId));

        if (existing) {
          existing.sold += quantity;
          existing.revenue += revenue;

          if (!existing.image && image) {
            existing.image = image;
          }
        } else {
          productMap.set(String(productId), {
            id: productId,
            name: productName,
            image,
            sold: quantity,
            revenue,
          });
        }
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => {
        if (b.sold !== a.sold) {
          return b.sold - a.sold;
        }

        return b.revenue - a.revenue;
      })
      .slice(0, 4);
  }, [orders]);

  const orderBreakdown = useMemo(() => {
    if (!Array.isArray(orders)) {
      return [];
    }

    let completed = 0;
    let pending = 0;
    let cancelled = 0;

    orders.forEach((order) => {
      const status = String(order.status || "")
        .trim()
        .toLowerCase();

      if (status === "completed" || status === "delivered") {
        completed += 1;
      } else if (
        status === "cancelled" ||
        status === "canceled" ||
        status === "rejected"
      ) {
        cancelled += 1;
      } else {
        pending += 1;
      }
    });

    return [
      {
        name: "Completed",
        value: completed,
        color: PIE_COLORS.completed,
      },
      {
        name: "Pending",
        value: pending,
        color: PIE_COLORS.pending,
      },
      {
        name: "Cancelled",
        value: cancelled,
        color: PIE_COLORS.cancelled,
      },
    ];
  }, [orders]);

  const totalBreakdownOrders = orderBreakdown.reduce(
    (total, item) => total + item.value,
    0,
  );

  const chartColors = isDark
    ? {
        grid: "#2b2d35",
        axisText: "#a6a29a",
        barFill: "#3e6344",
        cursorFill: "#3e6344",
        tooltipBg: "#18191e",
        tooltipBorder: "#2b2d35",
        tooltipText: "#f5f4f0",
      }
    : {
        grid: "#e4e0d8",
        axisText: "#736e63",
        barFill: "#38543c",
        cursorFill: "#38543c",
        tooltipBg: "#ffffff",
        tooltipBorder: "#e4e0d8",
        tooltipText: "#211f1b",
      };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-display text-[28px] font-medium text-ink">
            Dashboard
          </h1>
        </div>
      </div>

      {summaryLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatSkeleton key={index} />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            icon={DollarSign}
            label="Store Revenue"
            value={`$${Number(summary.total_sales || 0).toFixed(2)}`}
            change={summary.sales_growth || summary.revenue_growth}
            iconClass="bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15"
          />

          <DashboardStatCard
            icon={ShoppingBag}
            label="Total Orders"
            value={Number(summary.total_orders || 0).toLocaleString()}
            change={summary.orders_growth}
            iconClass="bg-orange-500/10 text-orange-500 dark:bg-orange-500/15"
          />

          <DashboardStatCard
            icon={Users}
            label="Total Shoppers"
            value={Number(summary.total_customers || 0).toLocaleString()}
            change={summary.customers_growth}
            iconClass="bg-stone-500/10 text-stone-500 dark:bg-stone-500/15 dark:text-stone-300"
          />

          <DashboardStatCard
            icon={Package}
            label="Total Catalog"
            value={Number(summary.total_products || 0).toLocaleString()}
            change={summary.products_growth}
            iconClass="bg-orange-600/10 text-orange-600 dark:bg-orange-600/15"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <div className="rounded-xl border border-hairline bg-surface p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-1 text-[10.5px] font-medium uppercase tracking-widest text-stone">
                  Sales Overview
                </p>

                <div className="flex items-center gap-3">
                  <h2 className="font-mono text-[28px] leading-none text-ink">
                    ${Number(summary?.total_sales || 0).toLocaleString()}
                  </h2>

                  {Number(summary?.sales_growth || 0) !== 0 && (
                    <GrowthBadge
                      value={summary?.sales_growth}
                      positive={Number(summary?.sales_growth) >= 0}
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center rounded-lg border border-hairline bg-paper p-1">
                {RANGES.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    disabled={trendLoading}
                    onClick={() => setRange(item.key)}
                    className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-all disabled:opacity-60 ${
                      range === item.key
                        ? "bg-surface text-ink shadow-[0_1px_3px_rgba(33,31,27,0.08)]"
                        : "text-stone hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {trendLoading ? (
              <ChartSkeleton />
            ) : trend.length === 0 ? (
              <div className="flex h-75 items-center justify-center">
                <p className="text-[13px] text-stone">
                  No sales data available
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={trend}
                  margin={{
                    top: 10,
                    right: 5,
                    left: -20,
                    bottom: 0,
                  }}
                  barCategoryGap="25%"
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke={chartColors.grid}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    tick={{
                      fontSize: 11,
                      fill: chartColors.axisText,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: chartColors.axisText,
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />

                  <Tooltip
                    cursor={{
                      fill: chartColors.cursorFill,
                      fillOpacity: 0.06,
                    }}
                    contentStyle={{
                      background: chartColors.tooltipBg,
                      border: `1px solid ${chartColors.tooltipBorder}`,
                      borderRadius: 10,
                      fontSize: 12,
                      color: chartColors.tooltipText,
                      boxShadow: "0 8px 24px rgba(33,31,27,0.08)",
                    }}
                    labelStyle={{
                      color: chartColors.tooltipText,
                    }}
                    itemStyle={{
                      color: chartColors.tooltipText,
                    }}
                    formatter={(value) => [
                      `$${Number(value).toFixed(2)}`,
                      "Sales",
                    ]}
                  />

                  <Bar
                    dataKey="sales"
                    fill={chartColors.barFill}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-5 sm:px-6">
              <div>
                <h2 className="font-display text-[18px] font-medium text-ink">
                  Recent Orders
                </h2>

                <p className="mt-1 text-[12px] text-stone">
                  Latest 5 orders from your customers
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/admin/orders")}
                className="flex items-center gap-1.5 text-[12.5px] font-medium text-moss transition-colors hover:text-ink"
              >
                View All
                <ArrowRight size={15} />
              </button>
            </div>

            {ordersLoading ? (
              <OrdersSkeleton />
            ) : recentOrders.length === 0 ? (
              <div className="flex min-h-45 items-center justify-center px-6">
                <div className="text-center">
                  <ShoppingBag
                    size={24}
                    className="mx-auto mb-3 text-stone/50"
                  />

                  <p className="text-[13px] text-stone">
                    No recent orders available
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-180">
                  <thead>
                    <tr className="border-b border-hairline bg-paper/40">
                      <TableHeader>Order ID</TableHeader>
                      <TableHeader>Customer</TableHeader>
                      <TableHeader>Date</TableHeader>
                      <TableHeader>Payment</TableHeader>
                      <TableHeader>Amount</TableHeader>
                      <TableHeader>Status</TableHeader>
                    </tr>
                  </thead>

                  <tbody>
                    {recentOrders.map((order) => {
                      const customer =
                        order.customer_name ||
                        order.customerName ||
                        order.user?.name ||
                        order.customer?.name ||
                        "Customer";

                      const payment =
                        order.payment_method ||
                        order.paymentMethod ||
                        order.payment?.method ||
                        "—";

                      const amount =
                        order.total ??
                        order.total_amount ??
                        order.totalAmount ??
                        order.amount ??
                        order.grand_total ??
                        0;

                      const date =
                        order.created_at ||
                        order.createdAt ||
                        order.date ||
                        order.order_date;

                      const status = order.status || "pending";

                      const items = order.items || order.order_items || [];

                      return (
                        <tr
                          key={order.id}
                          className="border-b border-hairline/70 last:border-0"
                        >
                          <TableCell>
                            <span className="font-mono text-[12px] text-ink">
                              #{order.id}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="min-w-0">
                              <p className="max-w-37.5 truncate text-[12.5px] font-medium text-ink">
                                {customer}
                              </p>

                              {Array.isArray(items) && items.length > 0 && (
                                <p className="mt-0.5 text-[11px] text-stone">
                                  {items.length}{" "}
                                  {items.length === 1 ? "item" : "items"}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="text-[12px] text-stone">
                              {formatDate(date)}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="text-[12px] capitalize text-stone">
                              {payment}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="font-mono text-[12px] text-ink">
                              ${Number(amount).toFixed(2)}
                            </span>
                          </TableCell>

                          <TableCell>
                            <OrderStatus status={status} />
                          </TableCell>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <div className="rounded-xl border border-hairline bg-surface p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-[18px] font-medium text-ink">
                  Order Breakdown
                </h2>

                <p className="text-[12px] text-stone">
                  Current order status
                </p>
              </div>
            </div>

            {summaryLoading ? (
              <div className="h-80 animate-pulse">
                <div className="mx-auto mt-8 h-44 w-44 rounded-full border-26 border-hairline/40" />

                <div className="mt-6 space-y-3">
                  <div className="h-3 rounded bg-hairline/40" />
                  <div className="h-3 rounded bg-hairline/30" />
                  <div className="h-3 rounded bg-hairline/30" />
                </div>
              </div>
            ) : (
              <>
                <div className="relative h-61.25">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={86}
                        paddingAngle={4}
                        stroke="none"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {orderBreakdown.map((item) => (
                          <Cell
                            key={item.name}
                            fill={item.color}
                            cornerRadius={8}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[11px] text-stone">
                      Total Orders
                    </span>

                    <span className="mt-1 font-mono text-[26px] font-medium text-ink">
                      {totalBreakdownOrders.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 border-t border-hairline pt-4">
                  {orderBreakdown.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: item.color,
                          }}
                        />

                        <span className="text-[12px] text-stone">
                          {item.name}
                        </span>
                      </div>

                      <span className="font-mono text-[12px] text-ink">
                        {item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="rounded-xl border border-hairline bg-surface p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-[18px] font-medium text-ink">
                  Top Selling Products
                </h2>

                <p className="mt-1 text-[12px] text-stone">
                  Products with the most orders
                </p>
              </div>
            </div>

            {ordersLoading ? (
              <TopProductsSkeleton />
            ) : topProducts.length === 0 ? (
              <div className="flex min-h-45 items-center justify-center">
                <div className="text-center">
                  <Package
                    size={24}
                    className="mx-auto mb-3 text-stone/50"
                  />

                  <p className="text-[13px] text-stone">
                    No product data available
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div
                    key={product.id || index}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-hairline bg-paper">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package
                          size={18}
                          className="text-stone/60"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium text-ink">
                        {product.name}
                      </p>

                      <p className="mt-0.5 text-[11px] text-stone">
                        {Number(product.sold).toLocaleString()} sold
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-mono text-[12px] text-ink">
                        ${Number(product.revenue).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-hairline py-2.5 text-[12.5px] font-medium text-ink transition-colors hover:bg-paper"
            >
              View Products
              <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function extractOrders(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.orders)) {
    return data.orders;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}

function DashboardStatCard({
  icon: Icon,
  label,
  value,
  change,
  iconClass = "bg-moss-tint text-moss",
}) {
  const hasChange = change !== undefined && change !== null && change !== "";

  const isPositive = Number(change || 0) >= 0;

  return (
    <div className="rounded-xl border border-hairline bg-surface p-5 transition-shadow hover:shadow-[0_8px_24px_rgba(33,31,27,0.04)]">
      <div className="mb-5 flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClass}`}
        >
          <Icon size={18} strokeWidth={1.8} />
        </div>

        {hasChange && <GrowthBadge value={change} positive={isPositive} />}
      </div>

      <p className="font-mono text-[25px] leading-none text-ink">
        {value}
      </p>

      <p className="text-[12.5px] text-stone">{label}</p>
    </div>
  );
}

function GrowthBadge({ value, positive }) {
  const numericValue = Number(value || 0);

  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10.5px] font-medium ${
        positive
          ? "bg-moss-tint text-moss dark:bg-emerald-500/15 dark:text-emerald-400"
          : "bg-red-50 text-clay dark:bg-red-500/15 dark:text-red-400"
      }`}
    >
      {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {Math.abs(numericValue)}%
    </span>
  );
}

function TableHeader({ children }) {
  return (
    <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-stone sm:px-6">
      {children}
    </th>
  );
}

function TableCell({ children }) {
  return <td className="px-5 py-3 sm:px-6">{children}</td>;
}

function OrderStatus({ status }) {
  const normalizedStatus = String(status).toLowerCase();

  const config = {
    completed: {
      icon: CheckCircle2,
      className:
        "bg-moss-tint text-moss dark:bg-emerald-500/15 dark:text-emerald-400",
      label: "Completed",
    },

    delivered: {
      icon: CheckCircle2,
      className:
        "bg-moss-tint text-moss dark:bg-emerald-500/15 dark:text-emerald-400",
      label: "Delivered",
    },

    pending: {
      icon: Clock3,
      className:
        "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
      label: "Pending",
    },

    processing: {
      icon: Clock3,
      className:
        "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
      label: "Processing",
    },

    paid: {
      icon: CheckCircle2,
      className:
        "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
      label: "Paid",
    },

    shipped: {
      icon: Package,
      className:
        "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
      label: "Shipped",
    },

    cancelled: {
      icon: XCircle,
      className: "bg-red-50 text-clay dark:bg-red-500/15 dark:text-red-400",
      label: "Cancelled",
    },
  };

  const current = config[normalizedStatus] || {
    icon: Clock3,
    className: "bg-paper text-stone",
    label: status || "Unknown",
  };

  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium capitalize ${current.className}`}
    >
      <Icon size={11} />
      {current.label}
    </span>
  );
}

function OrdersSkeleton() {
  return (
    <div className="animate-pulse space-y-0">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-6 gap-6 border-b border-hairline px-5 py-4 last:border-0 sm:px-6"
        >
          <div className="h-3 rounded bg-hairline/40" />
          <div className="h-3 rounded bg-hairline/40" />
          <div className="h-3 rounded bg-hairline/40" />
          <div className="h-3 rounded bg-hairline/40" />
          <div className="h-3 rounded bg-hairline/40" />
          <div className="h-5 w-16 rounded-full bg-hairline/40" />
        </div>
      ))}
    </div>
  );
}

function TopProductsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 rounded-lg bg-hairline/40" />

          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded bg-hairline/40" />
            <div className="h-2.5 w-1/3 rounded bg-hairline/30" />
          </div>

          <div className="h-3 w-14 rounded bg-hairline/40" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="relative h-75 animate-pulse">
      <div className="absolute inset-x-0 top-5 h-px bg-hairline/50" />
      <div className="absolute inset-x-0 top-[35%] h-px bg-hairline/40" />
      <div className="absolute inset-x-0 top-[65%] h-px bg-hairline/40" />
      <div className="absolute inset-x-0 bottom-8 h-px bg-hairline/50" />

      <div className="absolute bottom-8 left-8 right-2 top-5 flex items-end gap-2">
        <div className="h-[35%] flex-1 rounded-t-md bg-hairline/30" />
        <div className="h-[55%] flex-1 rounded-t-md bg-hairline/40" />
        <div className="h-[45%] flex-1 rounded-t-md bg-hairline/30" />
        <div className="h-[70%] flex-1 rounded-t-md bg-hairline/50" />
        <div className="h-[60%] flex-1 rounded-t-md bg-hairline/40" />
        <div className="h-[85%] flex-1 rounded-t-md bg-hairline/50" />
        <div className="h-[75%] flex-1 rounded-t-md bg-hairline/40" />
      </div>

      <div className="absolute bottom-0 left-8 right-2 flex justify-between">
        <div className="h-2 w-8 rounded bg-hairline/40" />
        <div className="h-2 w-8 rounded bg-hairline/40" />
        <div className="h-2 w-8 rounded bg-hairline/40" />
        <div className="h-2 w-8 rounded bg-hairline/40" />
        <div className="h-2 w-8 rounded bg-hairline/40" />
      </div>
    </div>
  );
}

function formatDate(date) {
  if (!date) return "—";

  try {
    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

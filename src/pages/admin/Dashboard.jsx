import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { DollarSign, ShoppingBag, Package, Users } from "lucide-react";
import api from "../../api/axios";

import { StatSkeleton } from "../../components/Skeleton";
import { ToastContext } from "../../context/ToastContext";
import { useContext } from "react";

const statCards = [
  {
    key: "total_sales",
    label: "Total Sales",
    icon: DollarSign,
    format: (v) => `$${Number(v || 0).toFixed(2)}`,
  },
  {
    key: "total_orders",
    label: "Total Orders",
    icon: ShoppingBag,
  },
  {
    key: "total_products",
    label: "Products",
    icon: Package,
  },
  {
    key: "total_customers",
    label: "Customers",
    icon: Users,
  },
];

const RANGES = [
  { key: "7d", label: "Week" },
  { key: "30d", label: "Month" },
  { key: "12m", label: "Year" },
];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [range, setRange] = useState("7d");
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);

  const { showToast } = useContext(ToastContext);

  // Load dashboard summary
  useEffect(() => {
    const loadSummary = async () => {
      try {
        setSummaryLoading(true);

        const res = await api.get("/admin/dashboard/summary");

        setSummary(res.data);
      } catch (err) {
        setSummary(null);

        showToast(
          err.response?.data?.message || "Failed to load dashboard",
          "error",
        );
      } finally {
        setSummaryLoading(false);
      }
    };

    loadSummary();
  }, [showToast]);

  // Load sales trend
  useEffect(() => {
    const loadTrend = async () => {
      try {
        setTrendLoading(true);

        const res = await api.get("/admin/dashboard/sales-trend", {
          params: { range },
        });

        setTrend(res.data || []);
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

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone mb-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>

        <h1 className="font-display text-[28px] font-medium text-ink">
          Overview
        </h1>
      </div>

      {/* Main Statistics */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatSkeleton key={index} />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map(({ key, label, icon: Icon, format }) => (
            <div
              key={key}
              className="bg-surface border border-hairline rounded-xl p-5"
            >
              <div className="w-9 h-9 rounded-lg bg-moss-tint flex items-center justify-center mb-4">
                <Icon size={17} className="text-moss" strokeWidth={1.75} />
              </div>

              <p className="font-mono text-[24px] leading-none text-ink mb-1.5">
                {format
                  ? format(summary[key])
                  : Number(summary[key] || 0).toLocaleString()}
              </p>

              <p className="text-[12.5px] text-stone">{label}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Mini Statistics */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <MiniStatSkeleton key={index} />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MiniStat
            label="Sales Today"
            value={`$${Number(summary.sales_today || 0).toFixed(2)}`}
          />

          <MiniStat
            label="Pending Orders"
            value={summary.orders_pending || 0}
            highlight={summary.orders_pending > 0}
          />

          <MiniStat
            label="Orders This Week"
            value={summary.orders_this_week || 0}
          />

          <MiniStat
            label="Low Stock"
            value={summary.low_stock_products || 0}
            highlight={summary.low_stock_products > 0}
            danger
          />
        </div>
      ) : null}

      {/* Revenue Chart */}
      <div className="bg-surface border border-hairline rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-widest text-stone mb-1">
              {RANGES.find((r) => r.key === range)?.label}
            </p>

            <h2 className="font-display text-[18px] font-medium text-ink">
              Revenue
            </h2>
          </div>

          <div className="flex items-center gap-1 bg-paper border border-hairline rounded-lg p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                disabled={trendLoading}
                className={`px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-colors disabled:opacity-60 ${
                  range === r.key
                    ? "bg-surface text-ink shadow-[0_1px_2px_rgba(33,31,27,0.06)]"
                    : "text-stone hover:text-ink"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {trendLoading ? (
          <ChartSkeleton />
        ) : trend.length === 0 ? (
          <div className="h-65 flex items-center justify-center">
            <p className="text-[13px] text-stone">No sales data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={trend}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3F5843" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#3F5843" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E4E0D8"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#8A8579" }}
                axisLine={{ stroke: "#E4E0D8" }}
                tickLine={false}
              />

              <YAxis
                tick={{ fontSize: 11, fill: "#8A8579" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />

              <Tooltip
                contentStyle={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E0D8",
                  borderRadius: 8,
                  fontSize: 12.5,
                }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, "Sales"]}
              />

              <Area
                type="monotone"
                dataKey="sales"
                stroke="#3F5843"
                strokeWidth={2}
                fill="url(#revenueFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, highlight, danger }) {
  return (
    <div className="bg-surface border border-hairline rounded-xl px-5 py-4">
      <p className="text-[10.5px] font-medium uppercase tracking-widest text-stone mb-2">
        {label}
      </p>

      <p
        className={`font-mono text-[20px] leading-none ${
          highlight ? (danger ? "text-clay" : "text-moss") : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MiniStatSkeleton() {
  return (
    <div className="bg-surface border border-hairline rounded-xl px-5 py-4 animate-pulse">
      <div className="h-2.5 w-24 bg-hairline/40 rounded mb-3" />
      <div className="h-5 w-16 bg-hairline/60 rounded" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-65 animate-pulse relative">
      {/* Fake chart lines */}
      <div className="absolute inset-x-0 top-5 h-px bg-hairline/50" />
      <div className="absolute inset-x-0 top-[35%] h-px bg-hairline/40" />
      <div className="absolute inset-x-0 top-[65%] h-px bg-hairline/40" />
      <div className="absolute inset-x-0 bottom-8 h-px bg-hairline/50" />

      {/* Fake chart area */}
      <div className="absolute left-8 right-2 bottom-8 top-5 flex items-end gap-2">
        <div className="h-[35%] flex-1 bg-hairline/30 rounded-t-md" />
        <div className="h-[55%] flex-1 bg-hairline/40 rounded-t-md" />
        <div className="h-[45%] flex-1 bg-hairline/30 rounded-t-md" />
        <div className="h-[70%] flex-1 bg-hairline/50 rounded-t-md" />
        <div className="h-[60%] flex-1 bg-hairline/40 rounded-t-md" />
        <div className="h-[85%] flex-1 bg-hairline/50 rounded-t-md" />
        <div className="h-[75%] flex-1 bg-hairline/40 rounded-t-md" />
      </div>

      {/* Fake X-axis labels */}
      <div className="absolute bottom-0 left-8 right-2 flex justify-between">
        <div className="h-2 w-8 bg-hairline/40 rounded" />
        <div className="h-2 w-8 bg-hairline/40 rounded" />
        <div className="h-2 w-8 bg-hairline/40 rounded" />
        <div className="h-2 w-8 bg-hairline/40 rounded" />
        <div className="h-2 w-8 bg-hairline/40 rounded" />
      </div>
    </div>
  );
}

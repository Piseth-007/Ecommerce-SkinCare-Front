import { useContext, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  X,
  Package,
  Boxes,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  TrendingUp,
  Filter,
} from "lucide-react";

import api from "../../api/axios";
import { ToastContext } from "../../context/ToastContext";
import { ConfirmContext } from "../../context/ConfirmContext";

const ITEMS_PER_PAGE = 10;
const LOW_STOCK_LIMIT = 5;

const STOCK_FILTERS = [
  { value: "all", label: "All Stock" },
  { value: "in-stock", label: "In Stock" },
  { value: "low-stock", label: "Low Stock" },
  { value: "out-of-stock", label: "Out of Stock" },
];

const SORT_OPTIONS = [
  { value: "stock-low", label: "Stock: Low to High" },
  { value: "stock-high", label: "Stock: High to Low" },
  { value: "name-asc", label: "Name: A–Z" },
  { value: "name-desc", label: "Name: Z–A" },
  { value: "value-high", label: "Value: High to Low" },
  { value: "value-low", label: "Value: Low to High" },
];

export default function Stock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("stock-low");
  const [currentPage, setCurrentPage] = useState(1);

  const { showToast } = useContext(ToastContext);
  const { confirm } = useContext(ConfirmContext);

  const loadProducts = async (showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/products");

      setProducts(response.data?.data || response.data || []);
    } catch (error) {
      setProducts([]);

      showToast(
        error.response?.data?.message || "Failed to load stock data",
        "error",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = new Map();

    products.forEach((product) => {
      if (product.category?.id) {
        uniqueCategories.set(product.category.id, product.category);
      }
    });

    return Array.from(uniqueCategories.values()).sort((a, b) =>
      (a.name || "").localeCompare(b.name || ""),
    );
  }, [products]);

  const getStockStatus = (stock) => {
    const quantity = Number(stock || 0);

    if (quantity === 0) {
      return {
        key: "out-of-stock",
        label: "Out of Stock",
      };
    }

    if (quantity <= LOW_STOCK_LIMIT) {
      return {
        key: "low-stock",
        label: "Low Stock",
      };
    }

    return {
      key: "in-stock",
      label: "In Stock",
    };
  };

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      const productName = product.name?.toLowerCase() || "";

      const categoryName = product.category?.name?.toLowerCase() || "";

      const stockStatus = getStockStatus(product.stock);

      const matchesSearch =
        !keyword ||
        productName.includes(keyword) ||
        categoryName.includes(keyword);

      const matchesCategory =
        categoryFilter === "all" ||
        String(product.category?.id) === String(categoryFilter);

      const matchesStock =
        stockFilter === "all" || stockStatus.key === stockFilter;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];

    switch (sortBy) {
      case "stock-high":
        return sorted.sort(
          (a, b) => Number(b.stock || 0) - Number(a.stock || 0),
        );

      case "stock-low":
        return sorted.sort(
          (a, b) => Number(a.stock || 0) - Number(b.stock || 0),
        );

      case "name-asc":
        return sorted.sort((a, b) =>
          (a.name || "").localeCompare(b.name || ""),
        );

      case "name-desc":
        return sorted.sort((a, b) =>
          (b.name || "").localeCompare(a.name || ""),
        );

      case "value-high":
        return sorted.sort(
          (a, b) =>
            Number(b.price || 0) * Number(b.stock || 0) -
            Number(a.price || 0) * Number(a.stock || 0),
        );

      case "value-low":
        return sorted.sort(
          (a, b) =>
            Number(a.price || 0) * Number(a.stock || 0) -
            Number(b.price || 0) * Number(b.stock || 0),
        );

      default:
        return sorted;
    }
  }, [filteredProducts, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, stockFilter, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedProducts.length / ITEMS_PER_PAGE),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;

    return sortedProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedProducts, currentPage]);

  /* ================= STOCK STATISTICS ================= */

  const totalUnits = useMemo(
    () =>
      products.reduce(
        (total, product) => total + Number(product.stock || 0),
        0,
      ),
    [products],
  );

  const inStockCount = useMemo(
    () =>
      products.filter((product) => Number(product.stock || 0) > LOW_STOCK_LIMIT)
        .length,
    [products],
  );

  const lowStockCount = useMemo(
    () =>
      products.filter((product) => {
        const stock = Number(product.stock || 0);

        return stock > 0 && stock <= LOW_STOCK_LIMIT;
      }).length,
    [products],
  );

  const outOfStockCount = useMemo(
    () => products.filter((product) => Number(product.stock || 0) === 0).length,
    [products],
  );

  const hasActiveFilters =
    search ||
    categoryFilter !== "all" ||
    stockFilter !== "all" ||
    sortBy !== "stock-low";

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStockFilter("all");
    setSortBy("stock-low");
    setCurrentPage(1);
  };

  /* ================= QUICK STOCK UPDATE ================= */

  const updateStock = async (product, amount) => {
    const currentStock = Number(product.stock || 0);

    const newStock = currentStock + amount;

    if (newStock < 0) {
      showToast("Stock cannot be below zero", "error");

      return;
    }

    try {
      setUpdatingId(product.id);

      /*
       * If your Laravel update endpoint requires
       * all product fields, change this payload
       * to match your ProductController validation.
       */
      await api.put(`/products/${product.id}`, {
        stock: newStock,
      });

      setProducts((previous) =>
        previous.map((item) =>
          item.id === product.id
            ? {
                ...item,
                stock: newStock,
              }
            : item,
        ),
      );

      showToast(
        amount > 0
          ? `${product.name} stock increased`
          : `${product.name} stock decreased`,
      );
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to update stock",
        "error",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDecrease = async (product) => {
    const stock = Number(product.stock || 0);

    if (stock <= 0) {
      showToast("Product is already out of stock", "error");

      return;
    }

    const confirmed = await confirm(
      `Decrease "${product.name}" stock from ${stock} to ${stock - 1}?`,
      {
        title: "Decrease stock?",
        confirmLabel: "Decrease",
      },
    );

    if (!confirmed) return;

    updateStock(product, -1);
  };

  const handleIncrease = (product) => {
    updateStock(product, 1);
  };

  const startItem =
    sortedProducts.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, sortedProducts.length);

  return (
    <div className="mx-auto max-w-7xl">
      {/* ================= HEADER ================= */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-stone">
            Inventory Management
          </p>

          <div className="flex items-center gap-3">
            <h1 className="font-display text-[28px] font-medium text-ink">
              Stock
            </h1>

            {!loading && (
              <span className="rounded-md bg-moss-tint px-2 py-0.5 text-[11px] font-medium text-moss">
                {products.length}
              </span>
            )}
          </div>

          <p className="mt-1 text-[13px] text-stone">
            Monitor product inventory and manage stock levels.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadProducts(true)}
          disabled={loading || refreshing}
          className="flex items-center justify-center gap-2 rounded-lg border border-hairline bg-surface px-4 py-2.5 text-[13px] font-medium text-ink transition hover:bg-paper disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ================= STATISTICS ================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StockStatCard
          icon={Package}
          label="Products"
          value={products.length}
          loading={loading}
        />

        <StockStatCard
          icon={Boxes}
          label="Total Units"
          value={totalUnits.toLocaleString()}
          loading={loading}
        />

        <StockStatCard
          icon={TrendingUp}
          label="In Stock"
          value={inStockCount}
          loading={loading}
        />

        <StockStatCard
          icon={AlertTriangle}
          label="Low Stock"
          value={lowStockCount}
          loading={loading}
          valueClass={lowStockCount > 0 ? "text-clay" : "text-ink"}
        />

        <StockStatCard
          icon={XCircle}
          label="Out of Stock"
          value={outOfStockCount}
          loading={loading}
          valueClass={outOfStockCount > 0 ? "text-clay" : "text-ink"}
        />
      </div>

      {/* ================= INVENTORY VALUE ================= */}

      {/* {!loading && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-hairline bg-surface p-5">
          <div>
            <p className="mb-1 text-[12px] text-stone">Total Inventory Value</p>

            <p className="font-mono text-[24px] text-ink">
              $
              {inventoryValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-moss-tint">
            <TrendingUp size={18} className="text-moss" />
          </div>
        </div>
      )} */}

      {/* ================= LOW STOCK WARNING ================= */}

      {!loading && (lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-clay/20 bg-clay-tint/40 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-clay" />

          <div>
            <p className="text-[13px] font-medium text-ink">
              Inventory needs attention
            </p>

            <p className="mt-1 text-[12px] leading-5 text-stone">
              {lowStockCount > 0 &&
                `${lowStockCount} product${lowStockCount > 1 ? "s" : ""} ${
                  lowStockCount > 1 ? "are" : "is"
                } running low. `}

              {outOfStockCount > 0 &&
                `${outOfStockCount} product${
                  outOfStockCount > 1 ? "s are" : " is"
                } out of stock.`}
            </p>
          </div>
        </div>
      )}

      {/* ================= FILTERS ================= */}

      {!loading && products.length > 0 && (
        <div className="mb-5 rounded-xl border border-hairline bg-surface p-4">
          <div className="flex flex-col gap-3 xl:flex-row">
            {/* Search */}

            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products or categories..."
                className="w-full rounded-lg border border-hairline bg-paper py-2.5 pl-10 pr-10 text-[13px] text-ink outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-ink"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Category */}

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="min-w-[180px] rounded-lg border border-hairline bg-paper px-3 py-2.5 text-[13px] text-ink outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
            >
              <option value="all">All Categories</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Stock Status */}

            <select
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
              className="min-w-[160px] rounded-lg border border-hairline bg-paper px-3 py-2.5 text-[13px] text-ink outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
            >
              {STOCK_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>

            {/* Sort */}

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="min-w-[190px] rounded-lg border border-hairline bg-paper px-3 py-2.5 text-[13px] text-ink outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg px-3 py-2.5 text-[13px] font-medium text-stone hover:bg-paper hover:text-ink"
              >
                Clear
              </button>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
            <p className="text-[12px] text-stone">
              Showing{" "}
              <span className="font-medium text-ink">
                {sortedProducts.length}
              </span>{" "}
              of {products.length} products
            </p>

            <div className="flex items-center gap-3">
              {lowStockCount > 0 && (
                <span className="text-[11px] font-medium text-clay">
                  {lowStockCount} low stock
                </span>
              )}

              {outOfStockCount > 0 && (
                <span className="text-[11px] font-medium text-clay">
                  {outOfStockCount} out of stock
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= STOCK TABLE ================= */}

      {loading ? (
        <StockSkeleton />
      ) : products.length === 0 ? (
        <EmptyStock />
      ) : sortedProducts.length === 0 ? (
        <NoStockResults onClear={clearFilters} />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-hairline bg-paper/60">
                    <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-stone">
                      Product
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-stone">
                      Category
                    </th>

                    <th className="px-5 py-3 text-center text-[10px] font-medium uppercase tracking-[0.1em] text-stone">
                      Stock
                    </th>

                    <th className="px-5 py-3 text-center text-[10px] font-medium uppercase tracking-[0.1em] text-stone">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-stone">
                      Unit Price
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-stone">
                      Value
                    </th>

                    <th className="px-5 py-3 text-center text-[10px] font-medium uppercase tracking-[0.1em] text-stone">
                      Adjust
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedProducts.map((product) => (
                    <StockRow
                      key={product.id}
                      product={product}
                      updating={updatingId === product.id}
                      getStockStatus={getStockStatus}
                      onIncrease={() => handleIncrease(product)}
                      onDecrease={() => handleDecrease(product)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= PAGINATION ================= */}

          {sortedProducts.length > ITEMS_PER_PAGE && (
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] text-stone">
                Showing{" "}
                <span className="font-medium text-ink">
                  {startItem}–{endItem}
                </span>{" "}
                of {sortedProducts.length} products
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-surface text-stone transition hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="px-2 text-[12px] text-stone">
                  Page{" "}
                  <span className="font-medium text-ink">{currentPage}</span> of{" "}
                  {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-surface text-stone transition hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ================= STAT CARD ================= */

function StockStatCard({
  icon: Icon,
  label,
  value,
  loading,
  valueClass = "text-ink",
}) {
  return (
    <div className="rounded-xl border border-hairline bg-surface p-5">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-moss-tint">
        <Icon size={17} className="text-moss" />
      </div>

      {loading ? (
        <>
          <div className="mb-2 h-6 w-16 animate-pulse rounded bg-paper" />
          <div className="h-3 w-24 animate-pulse rounded bg-paper" />
        </>
      ) : (
        <>
          <p
            className={`mb-1.5 font-mono text-[22px] leading-none ${valueClass}`}
          >
            {value}
          </p>

          <p className="text-[12px] text-stone">{label}</p>
        </>
      )}
    </div>
  );
}

/* ================= STOCK ROW ================= */

function StockRow({
  product,
  updating,
  getStockStatus,
  onIncrease,
  onDecrease,
}) {
  const stock = Number(product.stock || 0);
  const price = Number(product.price || 0);

  const inventoryValue = stock * price;

  const status = getStockStatus(stock);

  const image = product.images?.[0]?.url || product.image || null;

  return (
    <tr
      className={`border-b border-hairline last:border-0 transition hover:bg-paper/40 ${
        updating ? "pointer-events-none opacity-60" : ""
      }`}
    >
      {/* Product */}

      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-paper">
            {image ? (
              <img
                src={image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package size={17} className="text-stone" />
              </div>
            )}
          </div>

          <div className="max-w-[220px]">
            <p className="truncate text-[13px] font-medium text-ink">
              {product.name}
            </p>

            <p className="mt-0.5 text-[11px] text-stone">
              Product #{product.id}
            </p>
          </div>
        </div>
      </td>

      {/* Category */}

      <td className="px-5 py-4">
        <span className="text-[12px] text-stone">
          {product.category?.name || "Uncategorized"}
        </span>
      </td>

      {/* Stock */}

      <td className="px-5 py-4 text-center">
        <span className="font-mono text-[15px] text-ink">{stock}</span>

        <span className="ml-1 text-[10px] text-stone">units</span>
      </td>

      {/* Status */}

      <td className="px-5 py-4 text-center">
        <StockBadge status={status} />
      </td>

      {/* Price */}

      <td className="px-5 py-4 text-right">
        <span className="font-mono text-[12px] text-ink">
          ${price.toFixed(2)}
        </span>
      </td>

      {/* Inventory Value */}

      <td className="px-5 py-4 text-right">
        <span className="font-mono text-[12px] font-medium text-ink">
          ${inventoryValue.toFixed(2)}
        </span>
      </td>

      {/* Adjust */}

      <td className="px-5 py-4">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={onDecrease}
            disabled={updating || stock === 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-surface text-stone transition hover:bg-clay-tint hover:text-clay disabled:cursor-not-allowed disabled:opacity-40"
            title="Decrease stock"
          >
            <Minus size={14} />
          </button>

          <button
            type="button"
            onClick={onIncrease}
            disabled={updating}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-surface text-stone transition hover:bg-moss-tint hover:text-moss disabled:opacity-40"
            title="Increase stock"
          >
            {updating ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone border-t-transparent" />
            ) : (
              <Plus size={14} />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ================= STOCK BADGE ================= */

function StockBadge({ status }) {
  const styles = {
    "in-stock": "bg-moss-tint text-moss",
    "low-stock": "bg-clay-tint text-clay",
    "out-of-stock": "bg-paper text-stone",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${
        styles[status.key]
      }`}
    >
      {status.label}
    </span>
  );
}

/* ================= LOADING ================= */

function StockSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-b border-hairline p-5 last:border-0"
        >
          <div className="h-11 w-11 animate-pulse rounded-lg bg-paper" />

          <div className="flex-1">
            <div className="mb-2 h-4 w-40 animate-pulse rounded bg-paper" />

            <div className="h-3 w-24 animate-pulse rounded bg-paper" />
          </div>

          <div className="h-7 w-16 animate-pulse rounded bg-paper" />

          <div className="h-8 w-20 animate-pulse rounded bg-paper" />
        </div>
      ))}
    </div>
  );
}

/* ================= EMPTY ================= */

function EmptyStock() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-hairline bg-surface px-6 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-moss-tint">
        <Boxes size={23} className="text-moss" />
      </div>

      <p className="mb-1 text-[15px] font-medium text-ink">
        No stock available
      </p>

      <p className="max-w-sm text-[13px] leading-6 text-stone">
        Add products to your catalog to start managing inventory and stock
        levels.
      </p>
    </div>
  );
}

/* ================= NO RESULTS ================= */

function NoStockResults({ onClear }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-hairline bg-surface px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-paper">
        <Filter size={20} className="text-stone" />
      </div>

      <p className="mb-1 text-[14px] font-medium text-ink">No products found</p>

      <p className="mb-5 text-[13px] text-stone">
        Try changing your search or stock filters.
      </p>

      <button
        type="button"
        onClick={onClear}
        className="text-[13px] font-medium text-moss hover:text-moss-deep"
      >
        Clear all filters
      </button>
    </div>
  );
}

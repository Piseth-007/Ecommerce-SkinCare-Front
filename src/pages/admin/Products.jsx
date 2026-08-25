import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  ImageOff,
  Search,
  RefreshCw,
  X,
  Filter,
  Boxes,
  AlertTriangle,
} from "lucide-react";

import api from "../../api/axios";
import { CardSkeleton, StatSkeleton } from "../../components/Skeleton";
import { ToastContext } from "../../context/ToastContext";
import { ConfirmContext } from "../../context/ConfirmContext";

const STOCK_FILTERS = [
  { key: "all", label: "All Stock" },
  { key: "in-stock", label: "In Stock" },
  { key: "low-stock", label: "Low Stock" },
  { key: "out-of-stock", label: "Out of Stock" },
];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  const { showToast } = useContext(ToastContext);
  const { confirm } = useContext(ConfirmContext);

  const loadProducts = async (showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await api.get("/products");

      setProducts(res.data?.data || res.data || []);
    } catch (err) {
      setProducts([]);

      showToast(
        err.response?.data?.message || "Failed to load products",
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

  // Get unique categories from products
  const categories = useMemo(() => {
    const uniqueCategories = new Map();

    products.forEach((product) => {
      if (product.category?.id) {
        uniqueCategories.set(product.category.id, product.category);
      }
    });

    return Array.from(uniqueCategories.values());
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      const productName = product.name?.toLowerCase() || "";
      const categoryName = product.category?.name?.toLowerCase() || "";
      const stock = Number(product.stock || 0);

      const matchesSearch =
        !keyword ||
        productName.includes(keyword) ||
        categoryName.includes(keyword);

      const matchesCategory =
        categoryFilter === "all" ||
        String(product.category?.id) === String(categoryFilter);

      let matchesStock = true;

      if (stockFilter === "in-stock") {
        matchesStock = stock > 5;
      } else if (stockFilter === "low-stock") {
        matchesStock = stock > 0 && stock <= 5;
      } else if (stockFilter === "out-of-stock") {
        matchesStock = stock === 0;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  const handleDelete = async (product) => {
    const confirmed = await confirm(
      `Delete "${product.name}"? This action cannot be undone.`,
      {
        title: "Delete product?",
        confirmLabel: "Delete",
      },
    );

    if (!confirmed) return;

    try {
      setDeletingId(product.id);

      await api.delete(`/products/${product.id}`);

      setProducts((prev) => prev.filter((item) => item.id !== product.id));

      showToast(`"${product.name}" deleted successfully`);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to delete product",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStockFilter("all");
  };

  // Statistics
  const totalStock = products.reduce(
    (sum, product) => sum + Number(product.stock || 0),
    0,
  );

  const lowStockCount = products.filter((product) => {
    const stock = Number(product.stock || 0);
    return stock > 0 && stock <= 5;
  }).length;

  const outOfStockCount = products.filter(
    (product) => Number(product.stock || 0) === 0,
  ).length;

  const totalValue = products.reduce(
    (sum, product) =>
      sum + Number(product.price || 0) * Number(product.stock || 0),
    0,
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone mb-1">
            Catalog Management
          </p>

          <div className="flex items-center gap-3">
            <h1 className="font-display text-[28px] font-medium text-ink">
              Products
            </h1>

            {!loading && (
              <span className="px-2 py-0.5 rounded-md bg-moss-tint text-moss text-[11px] font-medium">
                {products.length}
              </span>
            )}
          </div>

          <p className="text-[13px] text-stone mt-1">
            Manage your products, pricing, inventory, and categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadProducts(true)}
            disabled={refreshing || loading}
            className="w-10 h-10 rounded-lg border border-hairline bg-surface flex items-center justify-center text-stone hover:text-ink hover:bg-paper transition-colors disabled:opacity-50"
            title="Refresh products"
          >
            <RefreshCw
              size={16}
              strokeWidth={1.75}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>

          <Link
            to="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-moss text-white text-[13.5px] font-medium hover:bg-moss-deep active:scale-[0.98] transition-all"
          >
            <Plus size={16} strokeWidth={2} />
            New Product
          </Link>
        </div>
      </div>

      {/* Statistics */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Products */}
          <StatCard
            icon={Package}
            label="Total Products"
            value={products.length}
          />

          {/* Units in Stock */}
          <StatCard
            icon={Boxes}
            label="Units in Stock"
            value={totalStock.toLocaleString()}
          />

          {/* Low Stock */}
          <StatCard
            icon={AlertTriangle}
            label="Low Stock"
            value={lowStockCount}
            valueClass={lowStockCount > 0 ? "text-clay" : "text-ink"}
          />

          {/* Inventory Value */}
          <StatCard
            icon={Package}
            label="Inventory Value"
            value={`$${totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
          />
        </div>
      )}

      {/* Search and Filters */}
      {!loading && products.length > 0 && (
        <div className="bg-surface border border-hairline rounded-xl p-4 mb-5">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={16}
                strokeWidth={1.75}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products or categories..."
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-hairline bg-paper text-[13.5px] text-ink placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss transition-colors"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone hover:text-ink"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="min-w-45 px-3 py-2.5 rounded-lg border border-hairline bg-paper text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss"
            >
              <option value="all">All Categories</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="min-w-40 px-3 py-2.5 rounded-lg border border-hairline bg-paper text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss"
            >
              {STOCK_FILTERS.map((filter) => (
                <option key={filter.key} value={filter.key}>
                  {filter.label}
                </option>
              ))}
            </select>

            {/* Clear Filters */}
            {(search || categoryFilter !== "all" || stockFilter !== "all") && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-2.5 rounded-lg text-[13px] font-medium text-stone hover:text-ink hover:bg-paper transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mt-3">
            <p className="text-[12px] text-stone">
              Showing{" "}
              <span className="font-medium text-ink">
                {filteredProducts.length}
              </span>{" "}
              of {products.length} products
            </p>

            {outOfStockCount > 0 && (
              <span className="text-[11px] font-medium text-clay">
                {outOfStockCount} out of stock
              </span>
            )}
          </div>
        </div>
      )}

      {/* Product Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState />
      ) : filteredProducts.length === 0 ? (
        <SearchEmptyState onClear={clearFilters} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isDeleting={deletingId === product.id}
              onDelete={() => handleDelete(product)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, valueClass = "text-ink" }) {
  return (
    <div className="bg-surface border border-hairline rounded-xl p-5">
      <div className="w-9 h-9 rounded-lg bg-moss-tint flex items-center justify-center mb-4">
        <Icon size={17} className="text-moss" strokeWidth={1.75} />
      </div>

      <p className={`font-mono text-[22px] leading-none mb-1.5 ${valueClass}`}>
        {value}
      </p>

      <p className="text-[12.5px] text-stone">{label}</p>
    </div>
  );
}

function ProductCard({ product, isDeleting, onDelete }) {
  const stock = Number(product.stock || 0);

  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= 5;

  const stockLabel = isOutOfStock
    ? "Out of Stock"
    : isLowStock
      ? "Low Stock"
      : null;

  return (
    <div
      className={`group bg-surface border border-hairline rounded-xl overflow-hidden transition-all hover:border-moss/30 hover:shadow-[0_6px_20px_rgba(33,31,27,0.06)] ${
        isDeleting ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {/* Product Image */}
      <div className="aspect-square bg-paper relative overflow-hidden">
        {product.images?.[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <ImageOff
              size={26}
              className="text-hairline mb-2"
              strokeWidth={1.5}
            />

            <span className="text-[11px] text-stone">No image</span>
          </div>
        )}

        {/* Stock Badge */}
        {stockLabel && (
          <span
            className={`absolute top-2.5 left-2.5 text-[9.5px] font-medium uppercase tracking-wide px-2 py-1 rounded-md ${
              isOutOfStock ? "bg-ink text-white" : "bg-clay text-white"
            }`}
          >
            {stockLabel}
          </span>
        )}

        {/* Actions */}
        <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Link
            to={`/admin/products/${product.id}/edit`}
            className="w-8 h-8 rounded-lg bg-surface/95 backdrop-blur border border-hairline flex items-center justify-center text-stone hover:text-ink hover:bg-surface transition-colors"
            title="Edit product"
            aria-label={`Edit ${product.name}`}
          >
            <Pencil size={14} strokeWidth={1.75} />
          </Link>

          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="w-8 h-8 rounded-lg bg-surface/95 backdrop-blur border border-hairline flex items-center justify-center text-stone hover:text-clay hover:bg-clay-tint transition-colors"
            title="Delete product"
            aria-label={`Delete ${product.name}`}
          >
            {isDeleting ? (
              <span className="w-4 h-4 border-2 border-stone border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 size={14} strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-stone mb-1">
          {product.category?.name || "Uncategorized"}
        </p>

        <h3
          className="text-[14px] font-medium text-ink mb-3 truncate"
          title={product.name}
        >
          {product.name}
        </h3>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] text-stone mb-0.5">Price</p>
            <p className="font-mono text-[15px] text-ink">
              ${Number(product.price || 0).toFixed(2)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-stone mb-0.5">Stock</p>
            <p
              className={`font-mono text-[13px] ${
                isOutOfStock || isLowStock ? "text-clay" : "text-ink"
              }`}
            >
              {stock} units
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-surface border border-dashed border-hairline rounded-xl py-20 px-6 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-moss-tint flex items-center justify-center mb-4">
        <Package size={22} className="text-moss" strokeWidth={1.75} />
      </div>

      <p className="text-[15px] font-medium text-ink mb-1">No products yet</p>

      <p className="max-w-sm text-[13px] leading-6 text-stone mb-5">
        Add your first product to start building your product catalog.
      </p>

      <Link
        to="/admin/products/new"
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-moss text-white text-[13.5px] font-medium hover:bg-moss-deep transition-colors"
      >
        <Plus size={16} strokeWidth={2} />
        New Product
      </Link>
    </div>
  );
}

function SearchEmptyState({ onClear }) {
  return (
    <div className="bg-surface border border-dashed border-hairline rounded-xl py-16 px-6 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-paper flex items-center justify-center mb-4">
        <Filter size={20} className="text-stone" strokeWidth={1.75} />
      </div>

      <p className="text-[14px] font-medium text-ink mb-1">No products found</p>

      <p className="text-[13px] text-stone mb-5">
        Try changing your search or filter options.
      </p>

      <button
        type="button"
        onClick={onClear}
        className="text-[13px] font-medium text-moss hover:text-moss-deep transition-colors"
      >
        Clear all filters
      </button>
    </div>
  );
}

import { useContext, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Package,
  Search,
  RefreshCw,
  X,
  Filter,
  Boxes,
  AlertTriangle,
  Download,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
} from "lucide-react";

import api from "../../api/axios";
import { CardSkeleton, StatSkeleton } from "../../components/Skeleton";
import { ToastContext } from "../../context/ToastContext";
import { ConfirmContext } from "../../context/ConfirmContext";
import ProductCard from "../../components/admin/ProductCard";
import ProductFormModal from "../../components/admin/ProductFormModal";

const STOCK_FILTERS = [
  { key: "all", label: "All Stock" },
  { key: "in-stock", label: "In Stock" },
  { key: "low-stock", label: "Low Stock" },
  { key: "out-of-stock", label: "Out of Stock" },
];

const PRODUCTS_PER_PAGE = 12;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("admin-products-view") || "card";
  });

  const { showToast } = useContext(ToastContext);
  const { confirm } = useContext(ConfirmContext);

  const [modalState, setModalState] = useState(null);

  const openCreateModal = () => setModalState({ productId: null });
  const openEditModal = (id) => setModalState({ productId: id });
  const closeModal = () => setModalState(null);

  const changeViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem("admin-products-view", mode);
  };

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

  const handleModalSuccess = () => {
    loadProducts(true);
  };

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
      }

      if (stockFilter === "low-stock") {
        matchesStock = stock > 0 && stock <= 5;
      }

      if (stockFilter === "out-of-stock") {
        matchesStock = stock === 0;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];

    switch (sortBy) {
      case "name-asc":
        return sorted.sort((a, b) =>
          (a.name || "").localeCompare(b.name || ""),
        );

      case "name-desc":
        return sorted.sort((a, b) =>
          (b.name || "").localeCompare(a.name || ""),
        );

      case "price-low":
        return sorted.sort(
          (a, b) => Number(a.price || 0) - Number(b.price || 0),
        );

      case "price-high":
        return sorted.sort(
          (a, b) => Number(b.price || 0) - Number(a.price || 0),
        );

      case "stock-low":
        return sorted.sort(
          (a, b) => Number(a.stock || 0) - Number(b.stock || 0),
        );

      case "stock-high":
        return sorted.sort(
          (a, b) => Number(b.stock || 0) - Number(a.stock || 0),
        );

      case "newest":
      default:
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();

          return dateB - dateA;
        });
    }
  }, [filteredProducts, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, stockFilter, sortBy, viewMode]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;

    return sortedProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [sortedProducts, currentPage]);

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
    setSortBy("newest");
    setCurrentPage(1);
  };

  const exportProducts = () => {
    if (sortedProducts.length === 0) {
      showToast("No products available to export", "error");
      return;
    }

    const escapeCsv = (value) => {
      const text = String(value ?? "");

      return `"${text.replace(/"/g, '""')}"`;
    };

    const headers = [
      "ID",
      "Name",
      "Category",
      "Price",
      "Stock",
      "Status",
      "Created At",
    ];

    const rows = sortedProducts.map((product) => {
      const stock = Number(product.stock || 0);

      const status =
        stock === 0 ? "Out of Stock" : stock <= 5 ? "Low Stock" : "In Stock";

      return [
        product.id,
        escapeCsv(product.name),
        escapeCsv(product.category?.name || "Uncategorized"),
        Number(product.price || 0).toFixed(2),
        stock,
        status,
        product.created_at || "",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "products.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    showToast("Products exported successfully");
  };

  const totalStock = useMemo(
    () =>
      products.reduce((sum, product) => sum + Number(product.stock || 0), 0),
    [products],
  );

  const lowStockCount = useMemo(
    () =>
      products.filter((product) => {
        const stock = Number(product.stock || 0);

        return stock > 0 && stock <= 5;
      }).length,
    [products],
  );

  const outOfStockCount = useMemo(
    () => products.filter((product) => Number(product.stock || 0) === 0).length,
    [products],
  );

  const totalValue = useMemo(
    () =>
      products.reduce(
        (sum, product) =>
          sum + Number(product.price || 0) * Number(product.stock || 0),
        0,
      ),
    [products],
  );

  const hasActiveFilters =
    search ||
    categoryFilter !== "all" ||
    stockFilter !== "all" ||
    sortBy !== "newest";

  const startProduct =
    sortedProducts.length === 0 ? 0 : (currentPage - 1) * PRODUCTS_PER_PAGE + 1;

  const endProduct = Math.min(
    currentPage * PRODUCTS_PER_PAGE,
    sortedProducts.length,
  );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[28px] font-medium text-ink">
              Products
            </h1>

            {!loading && (
              <span className="rounded-md bg-moss-tint px-2 py-0.5 text-[11px] font-medium text-moss">
                {products.length}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadProducts(true)}
            disabled={refreshing || loading}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-surface text-stone transition-colors hover:bg-paper hover:text-ink disabled:opacity-50"
            title="Refresh products"
            aria-label="Refresh products"
          >
            <RefreshCw
              size={16}
              strokeWidth={1.75}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-lg bg-moss px-4 py-2.5 text-[13.5px] font-medium text-white transition-all hover:bg-moss-deep active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={2} />
            New Product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Package}
            label="Total Products"
            value={products.length}
          />

          <StatCard
            icon={Boxes}
            label="Units in Stock"
            value={totalStock.toLocaleString()}
          />

          <StatCard
            icon={AlertTriangle}
            label="Low Stock"
            value={lowStockCount}
            valueClass={lowStockCount > 0 ? "text-clay" : "text-ink"}
          />

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

      {!loading && products.length > 0 && (
        <div className="mb-5">
          <div className="flex flex-col gap-3 xl:flex-row">
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
                className="w-full rounded-lg border border-hairline bg-surface py-2.5 pl-10 pr-10 text-[13.5px] text-ink placeholder:text-stone/50 transition-colors focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
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

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="min-w-[180px] rounded-lg border border-hairline bg-surface px-3 py-2.5 text-[13px] text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
            >
              <option value="all">All Categories</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="min-w-[160px] rounded-lg border border-hairline bg-surface px-3 py-2.5 text-[13px] text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
            >
              {STOCK_FILTERS.map((filter) => (
                <option key={filter.key} value={filter.key}>
                  {filter.label}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="min-w-[175px] rounded-lg border border-hairline bg-surface px-3 py-2.5 text-[13px] text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
            >
              <option value="newest">Newest First</option>
              <option value="name-asc">Name: A–Z</option>
              <option value="name-desc">Name: Z–A</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="stock-low">Stock: Low to High</option>
              <option value="stock-high">Stock: High to Low</option>
            </select>

            <button
              type="button"
              onClick={exportProducts}
              className="flex items-center justify-center gap-2 rounded-lg border border-hairline bg-surface px-3.5 py-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-paper"
            >
              <Download size={15} />
              Export
            </button>

            <div className="flex items-center rounded-lg border border-hairline bg-surface p-1">
              <ViewButton
                active={viewMode === "card"}
                onClick={() => changeViewMode("card")}
                icon={LayoutGrid}
                label="Card view"
              />

              <ViewButton
                active={viewMode === "table"}
                onClick={() => changeViewMode("table")}
                icon={List}
                label="Table view"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg px-3 py-2.5 text-[13px] font-medium text-stone transition-colors hover:bg-paper hover:text-ink"
              >
                Clear
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-hairline pt-3 sm:flex-row sm:items-center sm:justify-between">
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

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState onCreate={openCreateModal} />
      ) : sortedProducts.length === 0 ? (
        <SearchEmptyState onClear={clearFilters} />
      ) : viewMode === "card" ? (
        <CardView
          products={paginatedProducts}
          deletingId={deletingId}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      ) : (
        <TableView
          products={paginatedProducts}
          deletingId={deletingId}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      )}

      {!loading && sortedProducts.length > PRODUCTS_PER_PAGE && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          startProduct={startProduct}
          endProduct={endProduct}
          totalProducts={sortedProducts.length}
          onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
          onNext={() =>
            setCurrentPage((page) => Math.min(totalPages, page + 1))
          }
        />
      )}

      {modalState && (
        <ProductFormModal
          productId={modalState.productId}
          onClose={closeModal}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}

function ViewButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
        active
          ? "bg-moss text-white"
          : "text-stone hover:bg-paper hover:text-ink"
      }`}
    >
      <Icon size={15} strokeWidth={1.75} />
    </button>
  );
}

function CardView({ products, deletingId, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isDeleting={deletingId === product.id}
          onEdit={() => onEdit(product.id)}
          onDelete={() => onDelete(product)}
        />
      ))}
    </div>
  );
}

function TableView({ products, deletingId, onEdit, onDelete }) {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left">
          <thead>
            <tr className="border-b border-hairline bg-paper/30">
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead align="right">Actions</TableHead>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <ProductTableRow
                key={product.id}
                product={product}
                deleting={deletingId === product.id}
                onEdit={() => onEdit(product.id)}
                onDelete={() => onDelete(product)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductTableRow({ product, deleting, onEdit, onDelete }) {
  const stock = Number(product.stock || 0);
  const price = Number(product.price || 0);
  const image = product.images?.[0]?.url;

  const status =
    stock === 0 ? "Out of Stock" : stock <= 5 ? "Low Stock" : "In Stock";

  const statusClass =
    stock === 0
      ? "bg-clay-tint text-clay"
      : stock <= 5
        ? "bg-clay-tint text-clay"
        : "bg-moss-tint text-moss";

  return (
    <tr className="border-b border-hairline transition-colors last:border-b-0 hover:bg-paper/40">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-paper">
            {image ? (
              <img
                src={image}
                alt={product.name || "Product"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package size={17} className="text-stone" strokeWidth={1.5} />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="max-w-[220px] truncate text-[13.5px] font-medium text-ink">
              {product.name || "Unnamed Product"}
            </p>

            <p className="mt-0.5 text-[11px] text-stone">#{product.id}</p>
          </div>
        </div>
      </td>

      <td className="px-5 py-3.5">
        <span className="text-[12.5px] text-stone">
          {product.category?.name || "Uncategorized"}
        </span>
      </td>

      <td className="px-5 py-3.5">
        <span className="font-mono text-[13px] font-medium text-ink">
          ${price.toFixed(2)}
        </span>
      </td>

      <td className="px-5 py-3.5">
        <span
          className={`font-mono text-[13px] font-medium ${
            stock === 0 || stock <= 5 ? "text-clay" : "text-ink"
          }`}
        >
          {stock}
        </span>
      </td>

      <td className="px-5 py-3.5">
        <span
          className={`inline-flex rounded-md px-2 py-1 text-[10.5px] font-medium ${statusClass}`}
        >
          {status}
        </span>
      </td>

      <td className="px-5 py-3.5">
        <span className="text-[12px] text-stone">
          {product.created_at
            ? new Date(product.created_at).toLocaleDateString()
            : "-"}
        </span>
      </td>

      <td className="px-5 py-3.5">
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone transition-colors hover:bg-moss-tint hover:text-moss"
            title="Edit product"
            aria-label="Edit product"
          >
            <Pencil size={14} strokeWidth={1.75} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone transition-colors hover:bg-clay-tint hover:text-clay disabled:cursor-not-allowed disabled:opacity-50"
            title="Delete product"
            aria-label="Delete product"
          >
            {deleting ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} strokeWidth={1.75} />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

function Pagination({
  currentPage,
  totalPages,
  startProduct,
  endProduct,
  totalProducts,
  onPrevious,
  onNext,
}) {
  return (
    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[12px] text-stone">
        Showing{" "}
        <span className="font-medium text-ink">
          {startProduct}–{endProduct}
        </span>{" "}
        of {totalProducts} products
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

        <span className="px-2 text-[12px] text-stone">
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

function TableHead({ children, align = "left" }) {
  return (
    <th
      className={`px-5 py-3 text-[10.5px] font-medium uppercase tracking-widest text-stone ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

function StatCard({ icon: Icon, label, value, valueClass = "text-ink" }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface p-5">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-moss-tint">
        <Icon size={17} className="text-moss" strokeWidth={1.75} />
      </div>

      <p className={`mb-1.5 font-mono text-[22px] leading-none ${valueClass}`}>
        {value}
      </p>

      <p className="text-[12.5px] text-stone">{label}</p>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-hairline bg-surface px-6 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-moss-tint">
        <Package size={22} className="text-moss" strokeWidth={1.75} />
      </div>

      <p className="mb-1 text-[15px] font-medium text-ink">No products yet</p>

      <p className="mb-5 max-w-sm text-[13px] leading-6 text-stone">
        Add your first product to start building your product catalog.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="flex items-center gap-2 rounded-lg bg-moss px-4 py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-moss-deep"
      >
        <Plus size={16} strokeWidth={2} />
        New Product
      </button>
    </div>
  );
}

function SearchEmptyState({ onClear }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-hairline bg-surface px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-paper">
        <Filter size={20} className="text-stone" strokeWidth={1.75} />
      </div>

      <p className="mb-1 text-[14px] font-medium text-ink">No products found</p>

      <p className="mb-5 text-[13px] text-stone">
        Try changing your search or filter options.
      </p>

      <button
        type="button"
        onClick={onClear}
        className="text-[13px] font-medium text-moss transition-colors hover:text-moss-deep"
      >
        Clear all filters
      </button>
    </div>
  );
}

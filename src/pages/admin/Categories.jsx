import { useContext, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Tag as TagIcon,
  Search,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import api from "../../api/axios";

import { RowSkeleton, StatSkeleton } from "../../components/Skeleton";
import { ToastContext } from "../../context/ToastContext";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");

  const { showToast } = useContext(ToastContext);

  const loadCategories = async (showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await api.get("/categories");

      setCategories(res.data?.data || res.data || []);
    } catch (err) {
      setCategories([]);

      showToast(
        err.response?.data?.message || "Failed to load categories",
        "error",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return categories;

    return categories.filter((category) =>
      category.name?.toLowerCase().includes(keyword),
    );
  }, [categories, search]);

  const openNew = () => {
    setEditing("new");
    setName("");
  };

  const openEdit = (category) => {
    setEditing(category);
    setName(category.name || "");
  };

  const closeForm = () => {
    if (saving) return;

    setEditing(null);
    setName("");
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const categoryName = name.trim();

    if (!categoryName) {
      showToast("Category name is required", "error");
      return;
    }

    try {
      setSaving(true);

      if (editing === "new") {
        const res = await api.post("/categories", {
          name: categoryName,
        });

        const newCategory = res.data?.data || res.data;

        setCategories((prev) => [...prev, newCategory]);

        showToast("Category created successfully");
      } else {
        const res = await api.put(`/categories/${editing.id}`, {
          name: categoryName,
        });

        const updatedCategory = res.data?.data || res.data;

        setCategories((prev) =>
          prev.map((category) =>
            category.id === editing.id ? updatedCategory : category,
          ),
        );

        showToast("Category updated successfully");
      }

      closeForm();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to save category",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Delete "${category.name}"? Products in this category may be affected.`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(category.id);

      await api.delete(`/categories/${category.id}`);

      setCategories((prev) => prev.filter((item) => item.id !== category.id));

      showToast(`"${category.name}" deleted successfully`);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to delete category",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const clearSearch = () => {
    setSearch("");
  };

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
              Categories
            </h1>

            {!loading && (
              <span className="px-2 py-0.5 rounded-md bg-moss-tint text-moss text-[11px] font-medium">
                {categories.length}
              </span>
            )}
          </div>

          <p className="text-[13px] text-stone mt-1">
            Organize your products into categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            type="button"
            onClick={() => loadCategories(true)}
            disabled={refreshing || loading}
            className="w-10 h-10 rounded-lg border border-hairline bg-surface flex items-center justify-center text-stone hover:text-ink hover:bg-paper transition-colors disabled:opacity-50"
            title="Refresh categories"
          >
            <RefreshCw
              size={16}
              strokeWidth={1.75}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>

          {/* New Category */}
          <button
            type="button"
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-moss text-white text-[13.5px] font-medium hover:bg-moss-deep active:scale-[0.98] transition-all"
          >
            <Plus size={16} strokeWidth={2} />
            New Category
          </button>
        </div>
      </div>

      {/* Statistics */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Total */}
          <div className="bg-surface border border-hairline rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-lg bg-moss-tint flex items-center justify-center">
                <FolderOpen
                  size={17}
                  className="text-moss"
                  strokeWidth={1.75}
                />
              </div>

              <span className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-stone">
                All
              </span>
            </div>

            <p className="font-mono text-[24px] leading-none text-ink mb-1.5">
              {categories.length}
            </p>

            <p className="text-[12.5px] text-stone">Total Categories</p>
          </div>

          {/* Search Results */}
          <div className="bg-surface border border-hairline rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-lg bg-paper border border-hairline flex items-center justify-center">
                <Search size={17} className="text-stone" strokeWidth={1.75} />
              </div>

              {search && (
                <span className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-moss">
                  Filtered
                </span>
              )}
            </div>

            <p className="font-mono text-[24px] leading-none text-ink mb-1.5">
              {filteredCategories.length}
            </p>

            <p className="text-[12.5px] text-stone">
              {search ? "Search Results" : "Currently Visible"}
            </p>
          </div>

          {/* Status */}
          <div className="bg-surface border border-hairline rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-lg bg-moss-tint flex items-center justify-center">
                <TagIcon size={17} className="text-moss" strokeWidth={1.75} />
              </div>

              <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-moss">
                <span className="w-1.5 h-1.5 rounded-full bg-moss" />
                Active
              </span>
            </div>

            <p className="font-mono text-[24px] leading-none text-ink mb-1.5">
              {categories.length}
            </p>

            <p className="text-[12.5px] text-stone">Available for Products</p>
          </div>
        </div>
      )}

      {/* Create / Edit Form */}
      {editing && (
        <div className="bg-surface border border-hairline rounded-xl p-5 mb-5 shadow-[0_4px_20px_rgba(33,31,27,0.04)]">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-[10.5px] font-medium uppercase tracking-widest text-stone mb-1">
                {editing === "new" ? "Create" : "Edit"}
              </p>

              <h2 className="font-display text-[18px] font-medium text-ink">
                {editing === "new" ? "New Category" : `Edit ${editing.name}`}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone hover:bg-paper hover:text-ink transition-colors disabled:opacity-50"
              aria-label="Close form"
            >
              <X size={17} strokeWidth={1.75} />
            </button>
          </div>

          <form
            onSubmit={handleSave}
            className="flex flex-col sm:flex-row sm:items-end gap-3"
          >
            <div className="flex-1">
              <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-stone mb-2">
                Category Name
              </label>

              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
                maxLength={255}
                required
                placeholder="Example: Electronics"
                className="w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-paper text-ink text-[14px] placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss transition-colors disabled:opacity-60"
              />

              <div className="flex justify-between mt-1.5">
                <p className="text-[11px] text-stone">
                  Use a clear and unique category name.
                </p>

                <span className="text-[11px] text-stone">
                  {name.length}/255
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="min-w-27.5 px-5 py-2.5 rounded-lg bg-moss text-white text-[13.5px] font-medium hover:bg-moss-deep active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? "Saving…"
                : editing === "new"
                  ? "Create"
                  : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {/* Search & List Header */}
      {!loading && categories.length > 0 && (
        <div className="bg-surface border border-hairline rounded-xl p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                strokeWidth={1.75}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-hairline bg-paper text-[13.5px] text-ink placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss"
              />

              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone hover:text-ink"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <p className="text-[12.5px] text-stone whitespace-nowrap">
              Showing{" "}
              <span className="font-medium text-ink">
                {filteredCategories.length}
              </span>{" "}
              of {categories.length}
            </p>
          </div>
        </div>
      )}

      {/* Categories Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-surface border border-hairline rounded-xl overflow-hidden"
            >
              <RowSkeleton />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          onAction={openNew}
          label="New Category"
          message="Create categories to keep your product catalog organized."
        />
      ) : filteredCategories.length === 0 ? (
        <SearchEmptyState search={search} onClear={clearSearch} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredCategories.map((category) => {
            const isDeleting = deletingId === category.id;

            return (
              <div
                key={category.id}
                className={`group bg-surface border border-hairline rounded-xl p-4 flex items-center gap-3 transition-all hover:border-moss/30 hover:shadow-[0_4px_16px_rgba(33,31,27,0.04)] ${
                  isDeleting ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {/* Category Icon */}
                <div className="w-10 h-10 rounded-xl bg-moss-tint flex items-center justify-center shrink-0">
                  <span className="text-[14px] font-semibold text-moss">
                    {category.name?.charAt(0).toUpperCase() || "C"}
                  </span>
                </div>

                {/* Category Name */}
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium text-ink truncate">
                    {category.name}
                  </p>

                  <p className="text-[11.5px] text-stone mt-0.5">Category</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => openEdit(category)}
                    disabled={isDeleting}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-stone hover:bg-paper hover:text-ink transition-colors"
                    title="Edit category"
                    aria-label={`Edit ${category.name}`}
                  >
                    <Pencil size={14} strokeWidth={1.75} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    disabled={isDeleting}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-stone hover:bg-clay-tint hover:text-clay transition-colors"
                    title="Delete category"
                    aria-label={`Delete ${category.name}`}
                  >
                    {isDeleting ? (
                      <span className="w-3.5 h-3.5 border-2 border-stone border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={14} strokeWidth={1.75} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onAction, label, message }) {
  return (
    <div className="bg-surface border border-dashed border-hairline rounded-xl py-20 px-6 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-moss-tint flex items-center justify-center mb-4">
        <TagIcon size={22} className="text-moss" strokeWidth={1.75} />
      </div>

      <p className="text-[15px] font-medium text-ink mb-1">No categories yet</p>

      <p className="max-w-sm text-[13px] leading-6 text-stone mb-5">
        {message}
      </p>

      <button
        type="button"
        onClick={onAction}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-moss text-white text-[13.5px] font-medium hover:bg-moss-deep active:scale-[0.98] transition-all"
      >
        <Plus size={16} strokeWidth={2} />
        {label}
      </button>
    </div>
  );
}

function SearchEmptyState({ search, onClear }) {
  return (
    <div className="bg-surface border border-dashed border-hairline rounded-xl py-16 px-6 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-paper flex items-center justify-center mb-4">
        <Search size={20} className="text-stone" strokeWidth={1.75} />
      </div>

      <p className="text-[14px] font-medium text-ink mb-1">
        No categories found
      </p>

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

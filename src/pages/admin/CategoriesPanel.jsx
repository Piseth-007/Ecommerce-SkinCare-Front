import { useContext, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Tag as TagIcon,
  Search,
  RefreshCw,
} from "lucide-react";
import api from "../../api/axios";

import { RowSkeleton } from "../../components/Skeleton";
import { ToastContext } from "../../context/ToastContext";
import CategoryFormModal from "../../components/admin/CategoryFormModal";

export default function CategoriesPanel() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editing, setEditing] = useState(null); // null | "new" | category object
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

  const openNew = () => setEditing("new");
  const openEdit = (category) => setEditing(category);

  const closeForm = () => {
    if (saving) return;
    setEditing(null);
  };

  const handleSave = async (payload) => {
    if (!payload.name) {
      showToast("Category name is required", "error");
      return;
    }

    try {
      setSaving(true);

      if (editing === "new") {
        const res = await api.post("/categories", payload);

        const newCategory = res.data?.data || res.data;

        setCategories((prev) => [...prev, newCategory]);

        showToast("Category created successfully");
      } else {
        const res = await api.put(`/categories/${editing.id}`, payload);

        const updatedCategory = res.data?.data || res.data;

        setCategories((prev) =>
          prev.map((category) =>
            category.id === editing.id ? updatedCategory : category,
          ),
        );

        showToast("Category updated successfully");
      }

      setEditing(null);
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
    <div>
      {/* Search & New — same row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
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
            className=" pl-10 pr-10 py-2.5 rounded-lg border border-hairline bg-surface text-[13.5px] text-ink placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss"
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

        <div className="flex items-center gap-2 shrink-0">
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

          <button
            type="button"
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-moss text-white text-[13.5px] font-medium hover:bg-moss-deep active:scale-[0.98] transition-all whitespace-nowrap"
          >
            <Plus size={16} strokeWidth={2} />
            New Category
          </button>
        </div>
      </div>

      {/* Result count */}
      {!loading && categories.length > 0 && (
        <p className="text-[12.5px] text-stone mb-4">
          Showing{" "}
          <span className="font-medium text-ink">
            {filteredCategories.length}
          </span>{" "}
          of {categories.length}
        </p>
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
                <div className="w-10 h-10 rounded-xl bg-moss-tint flex items-center justify-center shrink-0">
                  <span className="text-[14px] font-semibold text-moss">
                    {category.name?.charAt(0).toUpperCase() || "C"}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium text-ink truncate">
                    {category.name}
                  </p>

                  <p className="text-[11.5px] text-stone mt-0.5">Category</p>
                </div>

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

      {/* Create / Edit Modal */}
      {editing && (
        <CategoryFormModal
          category={editing === "new" ? null : editing}
          onClose={closeForm}
          onSave={handleSave}
          saving={saving}
        />
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


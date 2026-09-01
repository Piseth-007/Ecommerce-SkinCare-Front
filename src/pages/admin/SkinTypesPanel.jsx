import { useContext, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Search,
  RefreshCw,
  X,
} from "lucide-react";
import api from "../../api/axios";

import { RowSkeleton } from "../../components/Skeleton";
import { ToastContext } from "../../context/ToastContext";
import SkinTypeFormModal from "../../components/admin/SkinTypeFormModal";

export default function SkinTypesPanel() {
  const [skinTypes, setSkinTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editing, setEditing] = useState(null); // null | "new" | skinType object
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");

  const { showToast } = useContext(ToastContext);

  const loadSkinTypes = async (showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await api.get("/skin-types");

      setSkinTypes(res.data?.data || res.data || []);
    } catch (err) {
      setSkinTypes([]);

      showToast(
        err.response?.data?.message || "Failed to load skin types",
        "error",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSkinTypes();
  }, []);

  const filteredSkinTypes = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return skinTypes;

    return skinTypes.filter((skinType) =>
      skinType.name?.toLowerCase().includes(keyword),
    );
  }, [skinTypes, search]);

  const openNew = () => setEditing("new");
  const openEdit = (skinType) => setEditing(skinType);

  const closeForm = () => {
    if (saving) return;
    setEditing(null);
  };

  const handleSave = async (payload) => {
    if (!payload.name) {
      showToast("Skin type name is required", "error");
      return;
    }

    try {
      setSaving(true);

      if (editing === "new") {
        const res = await api.post("/skin-types", payload);

        const newSkinType = res.data?.data || res.data;

        setSkinTypes((prev) => [...prev, newSkinType]);

        showToast("Skin type created successfully");
      } else {
        const res = await api.put(`/skin-types/${editing.id}`, payload);

        const updatedSkinType = res.data?.data || res.data;

        setSkinTypes((prev) =>
          prev.map((skinType) =>
            skinType.id === editing.id ? updatedSkinType : skinType,
          ),
        );

        showToast("Skin type updated successfully");
      }

      setEditing(null);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to save skin type",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (skinType) => {
    const confirmed = window.confirm(
      `Delete "${skinType.name}"? Products tagged with this skin type may be affected.`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(skinType.id);

      await api.delete(`/skin-types/${skinType.id}`);

      setSkinTypes((prev) => prev.filter((item) => item.id !== skinType.id));

      showToast(`"${skinType.name}" deleted successfully`);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to delete skin type",
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
      {/* Search & Actions — same row */}
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
            placeholder="Search skin types..."
            className="w-100 pl-10 pr-10 py-2.5 rounded-lg border border-hairline bg-surface text-[13.5px] text-ink placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss"
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
            onClick={() => loadSkinTypes(true)}
            disabled={refreshing || loading}
            className="w-10 h-10 rounded-lg border border-hairline bg-surface flex items-center justify-center text-stone hover:text-ink hover:bg-paper transition-colors disabled:opacity-50"
            title="Refresh skin types"
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
            New Skin Type
          </button>
        </div>
      </div>

      {!loading && skinTypes.length > 0 && (
        <p className="text-[12.5px] text-stone mb-4">
          Showing{" "}
          <span className="font-medium text-ink">
            {filteredSkinTypes.length}
          </span>{" "}
          of {skinTypes.length}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-surface border border-hairline rounded-xl overflow-hidden"
            >
              <RowSkeleton />
            </div>
          ))}
        </div>
      ) : skinTypes.length === 0 ? (
        <EmptyState
          onAction={openNew}
          label="New Skin Type"
          message="Create skin types (e.g. Oily, Dry, Sensitive) so customers can filter products that suit them."
        />
      ) : filteredSkinTypes.length === 0 ? (
        <SearchEmptyState search={search} onClear={clearSearch} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredSkinTypes.map((skinType) => {
            const isDeleting = deletingId === skinType.id;

            return (
              <div
                key={skinType.id}
                className={`group bg-surface border border-hairline rounded-xl p-4 flex items-center gap-3 transition-all hover:border-moss/30 hover:shadow-[0_4px_16px_rgba(33,31,27,0.04)] ${
                  isDeleting ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-moss-tint flex items-center justify-center shrink-0">
                  <span className="text-[14px] font-semibold text-moss">
                    {skinType.name?.charAt(0).toUpperCase() || "S"}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium text-ink truncate">
                    {skinType.name}
                  </p>

                  <p className="text-[11.5px] text-stone mt-0.5">
                    {Number(skinType.products_count || 0)} product
                    {Number(skinType.products_count) === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => openEdit(skinType)}
                    disabled={isDeleting}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-stone hover:bg-paper hover:text-ink transition-colors"
                    title="Edit skin type"
                    aria-label={`Edit ${skinType.name}`}
                  >
                    <Pencil size={14} strokeWidth={1.75} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(skinType)}
                    disabled={isDeleting}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-stone hover:bg-clay-tint hover:text-clay transition-colors"
                    title="Delete skin type"
                    aria-label={`Delete ${skinType.name}`}
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
        <SkinTypeFormModal
          skinType={editing === "new" ? null : editing}
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
        <Sparkles size={22} className="text-moss" strokeWidth={1.75} />
      </div>

      <p className="text-[15px] font-medium text-ink mb-1">No skin types yet</p>

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
        No skin types found
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

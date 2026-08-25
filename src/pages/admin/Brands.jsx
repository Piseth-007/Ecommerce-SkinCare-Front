import { useContext, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Award,
  Search,
  RefreshCw,
  ImageOff,
  Check,
} from "lucide-react";

import api from "../../api/axios";
import { RowSkeleton, StatSkeleton } from "../../components/Skeleton";
import { ToastContext } from "../../context/ToastContext";

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);

  const { showToast } = useContext(ToastContext);

  const loadBrands = async (showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await api.get("/brands");

      setBrands(res.data?.data || res.data || []);
    } catch (err) {
      setBrands([]);

      showToast(
        err.response?.data?.message || "Failed to load brands",
        "error",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const filteredBrands = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return brands;

    return brands.filter((brand) =>
      brand.name?.toLowerCase().includes(keyword),
    );
  }, [brands, search]);

  const brandsWithLogo = brands.filter((brand) => brand.logo_url).length;
  const brandsWithoutLogo = brands.length - brandsWithLogo;

  const openNew = () => {
    setEditing("new");
    setName("");
  };

  const openEdit = (brand) => {
    setEditing(brand);
    setName(brand.name || "");
  };

  const closeForm = () => {
    if (saving) return;

    setEditing(null);
    setName("");
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const brandName = name.trim();

    if (!brandName) {
      showToast("Brand name is required", "error");
      return;
    }

    try {
      setSaving(true);

      if (editing === "new") {
        const res = await api.post("/brands", {
          name: brandName,
        });

        const newBrand = res.data?.data || res.data;

        setBrands((prev) => [...prev, newBrand]);

        showToast("Brand created successfully");
      } else {
        const res = await api.put(`/brands/${editing.id}`, {
          name: brandName,
        });

        const updatedBrand = res.data?.data || res.data;

        setBrands((prev) =>
          prev.map((brand) => (brand.id === editing.id ? updatedBrand : brand)),
        );

        showToast("Brand updated successfully");
      }

      closeForm();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save brand", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (brand) => {
    const confirmed = window.confirm(
      `Delete "${brand.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(brand.id);

      await api.delete(`/brands/${brand.id}`);

      setBrands((prev) => prev.filter((item) => item.id !== brand.id));

      showToast(`"${brand.name}" deleted successfully`);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to delete brand",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogoUpload = async (brand, file) => {
    if (!file) return;

    // Optional frontend validation
    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file", "error");
      return;
    }

    const formData = new FormData();
    formData.append("logo", file);

    try {
      setUploadingId(brand.id);

      const res = await api.post(`/brands/${brand.id}/logo`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedBrand = res.data?.data || res.data;

      setBrands((prev) =>
        prev.map((item) => (item.id === brand.id ? updatedBrand : item)),
      );

      showToast("Brand logo uploaded successfully");
    } catch (err) {
      showToast(err.response?.data?.message || "Logo upload failed", "error");
    } finally {
      setUploadingId(null);
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
              Brands
            </h1>

            {!loading && (
              <span className="px-2 py-0.5 rounded-md bg-moss-tint text-moss text-[11px] font-medium">
                {brands.length}
              </span>
            )}
          </div>

          <p className="text-[13px] text-stone mt-1">
            Manage brands and upload their logos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            type="button"
            onClick={() => loadBrands(true)}
            disabled={loading || refreshing}
            className="w-10 h-10 rounded-lg border border-hairline bg-surface flex items-center justify-center text-stone hover:text-ink hover:bg-paper transition-colors disabled:opacity-50"
            title="Refresh brands"
          >
            <RefreshCw
              size={16}
              strokeWidth={1.75}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>

          {/* New Brand */}
          <button
            type="button"
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-moss text-white text-[13.5px] font-medium hover:bg-moss-deep active:scale-[0.98] transition-all"
          >
            <Plus size={16} strokeWidth={2} />
            New Brand
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
          <StatCard icon={Award} label="Total Brands" value={brands.length} />

          <StatCard icon={Check} label="With Logo" value={brandsWithLogo} />

          <StatCard
            icon={ImageOff}
            label="Without Logo"
            value={brandsWithoutLogo}
            valueClass={brandsWithoutLogo > 0 ? "text-clay" : "text-ink"}
          />
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
                {editing === "new" ? "New Brand" : `Edit ${editing.name}`}
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
                Brand Name
              </label>

              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
                required
                maxLength={255}
                placeholder="Example: Nike"
                className="w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-paper text-ink text-[14px] placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss transition-colors disabled:opacity-60"
              />

              <div className="flex justify-between mt-1.5">
                <p className="text-[11px] text-stone">
                  Use a clear and unique brand name.
                </p>

                <span className="text-[11px] text-stone">
                  {name.length}/255
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="min-w-30 px-5 py-2.5 rounded-lg bg-moss text-white text-[13.5px] font-medium hover:bg-moss-deep active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? "Saving…"
                : editing === "new"
                  ? "Create Brand"
                  : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {/* Search */}
      {!loading && brands.length > 0 && (
        <div className="bg-surface border border-hairline rounded-xl p-4 mb-5">
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
                placeholder="Search brands..."
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
                {filteredBrands.length}
              </span>{" "}
              of {brands.length} brands
            </p>
          </div>
        </div>
      )}

      {/* Content */}
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
      ) : brands.length === 0 ? (
        <EmptyState onAction={openNew} />
      ) : filteredBrands.length === 0 ? (
        <SearchEmptyState search={search} onClear={clearSearch} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredBrands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              isDeleting={deletingId === brand.id}
              isUploading={uploadingId === brand.id}
              onEdit={() => openEdit(brand)}
              onDelete={() => handleDelete(brand)}
              onUpload={(file) => handleLogoUpload(brand, file)}
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

      <p className={`font-mono text-[24px] leading-none mb-1.5 ${valueClass}`}>
        {value}
      </p>

      <p className="text-[12.5px] text-stone">{label}</p>
    </div>
  );
}

function BrandCard({
  brand,
  isDeleting,
  isUploading,
  onEdit,
  onDelete,
  onUpload,
}) {
  return (
    <div
      className={`group bg-surface border border-hairline rounded-xl p-4 flex items-center gap-3 transition-all hover:border-moss/30 hover:shadow-[0_4px_16px_rgba(33,31,27,0.05)] ${
        isDeleting ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {/* Logo Upload */}
      <label
        className={`relative w-11 h-11 rounded-xl bg-paper border border-hairline overflow-hidden shrink-0 flex items-center justify-center transition-colors ${
          isUploading ? "cursor-wait" : "cursor-pointer hover:border-moss/40"
        }`}
        title="Upload brand logo"
      >
        {brand.logo_url ? (
          <img
            src={brand.logo_url}
            alt={brand.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Award size={17} className="text-stone" strokeWidth={1.75} />
        )}

        {!isUploading && (
          <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Upload size={15} className="text-white" />
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-[1px] flex items-center justify-center">
            <span className="w-4 h-4 border-2 border-moss border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          disabled={isUploading || isDeleting}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (file) {
              onUpload(file);
            }

            // Allows selecting the same file again
            e.target.value = "";
          }}
        />
      </label>

      {/* Brand Information */}
      <div className="min-w-0 flex-1">
        <p
          className="text-[13.5px] font-medium text-ink truncate"
          title={brand.name}
        >
          {brand.name}
        </p>

        <p className="text-[11.5px] text-stone mt-0.5">
          {brand.logo_url ? "Logo uploaded" : "No logo"}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onEdit}
          disabled={isDeleting || isUploading}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-stone hover:bg-paper hover:text-ink transition-colors disabled:opacity-50"
          title="Edit brand"
        >
          <Pencil size={14} strokeWidth={1.75} />
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting || isUploading}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-stone hover:bg-clay-tint hover:text-clay transition-colors disabled:opacity-50"
          title="Delete brand"
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
}

function EmptyState({ onAction }) {
  return (
    <div className="bg-surface border border-dashed border-hairline rounded-xl py-20 px-6 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-moss-tint flex items-center justify-center mb-4">
        <Award size={22} className="text-moss" strokeWidth={1.75} />
      </div>

      <p className="text-[15px] font-medium text-ink mb-1">No brands yet</p>

      <p className="max-w-sm text-[13px] leading-6 text-stone mb-5">
        Add brands to organize your products and make your catalog easier to
        manage.
      </p>

      <button
        type="button"
        onClick={onAction}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-moss text-white text-[13.5px] font-medium hover:bg-moss-deep active:scale-[0.98] transition-all"
      >
        <Plus size={16} strokeWidth={2} />
        New Brand
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

      <p className="text-[14px] font-medium text-ink mb-1">No brands found</p>

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

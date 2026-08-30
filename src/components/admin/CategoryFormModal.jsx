import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function CategoryFormModal({
  category,
  onClose,
  onSave,
  saving,
}) {
  const isEdit = Boolean(category);

  const [name, setName] = useState(category?.name || "");

  // Lock background scroll while modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Close on Escape (unless mid-save)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saving, onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !saving) onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSave({ name: name.trim() });
  };

  return (
    <div
      onMouseDown={handleOverlayClick}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-ink/40 backdrop-blur-[2px] px-4 py-6 sm:items-center"
    >
      <div className="w-full max-w-2xl rounded-xl bg-surface border border-hairline shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-5">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-widest text-stone mb-1">
              {isEdit ? "Edit" : "Create"}
            </p>

            <h2 className="font-display text-[19px] font-medium text-ink">
              {isEdit ? `Edit ${category.name}` : "New Category"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone hover:bg-paper hover:text-ink transition-colors disabled:opacity-50 shrink-0"
            aria-label="Close form"
          >
            <X size={17} strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <form id="category-form" onSubmit={handleSubmit} className="px-6 py-5">
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

            <span className="text-[11px] text-stone">{name.length}/255</span>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-hairline px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg border border-hairline text-ink text-[13.5px] font-medium hover:bg-paper transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="category-form"
            disabled={saving || !name.trim()}
            className="min-w-27.5 px-5 py-2.5 rounded-lg bg-moss text-white text-[13.5px] font-medium hover:bg-moss-deep active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

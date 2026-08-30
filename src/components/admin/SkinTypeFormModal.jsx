import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function SkinTypeFormModal({ skinType, onClose, onSave, saving }) {
  const isEdit = Boolean(skinType);

  const [name, setName] = useState(skinType?.name || "");
  const [description, setDescription] = useState(skinType?.description || "");

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

    onSave({
      name: name.trim(),
      description: description.trim() || null,
    });
  };

  return (
    <div
      onMouseDown={handleOverlayClick}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-ink/40 backdrop-blur-[2px] px-4 py-6 sm:items-center"
    >
      <div className="w-full max-w-3xl rounded-xl bg-surface border border-hairline shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-5">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-widest text-stone mb-1">
              {isEdit ? "Edit" : "Create"}
            </p>

            <h2 className="font-display text-[19px] font-medium text-ink">
              {isEdit ? `Edit ${skinType.name}` : "New Skin Type"}
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
        <form id="skin-type-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-stone mb-2">
              Skin Type Name
            </label>

            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              maxLength={100}
              required
              placeholder="Example: Oily, Dry, Combination"
              className="w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-paper text-ink text-[14px] placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss transition-colors disabled:opacity-60"
            />

            <div className="flex justify-between mt-1.5">
              <p className="text-[11px] text-stone">
                Use a clear and unique skin type name.
              </p>

              <span className="text-[11px] text-stone">{name.length}/100</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-stone mb-2">
              Description
              <span className="ml-1.5 normal-case text-stone/70 tracking-normal">
                (optional)
              </span>
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
              maxLength={500}
              rows={3}
              placeholder="Briefly describe this skin type..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-paper text-ink text-[14px] placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss transition-colors disabled:opacity-60 resize-none"
            />

            <div className="flex justify-end mt-1.5">
              <span className="text-[11px] text-stone">
                {description.length}/500
              </span>
            </div>
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
            form="skin-type-form"
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
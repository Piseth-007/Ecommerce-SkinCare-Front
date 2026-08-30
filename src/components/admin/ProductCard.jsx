import { Pencil, ImageOff, Trash2 } from "lucide-react";

export default function ProductCard({ product, isDeleting, onEdit, onDelete }) {
  const stock = Number(product.stock || 0);
  const isActive = product.status !== "inactive" && product.is_active !== false;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-hairline bg-surface transition-opacity ${
        isDeleting ? "pointer-events-none opacity-50" : ""
      }`}
    >
      {/* Image / Status */}
      <div className="relative flex aspect-[4/3] items-center justify-center bg-paper">
        {product.images?.[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageOff size={40} className="text-stone/40" strokeWidth={1.25} />
        )}

        <span
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[11px] font-medium ${
            isActive ? "bg-moss-tint text-moss" : "bg-clay-tint text-clay"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Details */}
      <div className="p-4">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-clay">
          {product.category?.name || "Uncategorized"}
        </p>

        <h3
          className="mb-1 truncate text-[17px] font-medium text-ink"
          title={product.name}
        >
          {product.name}
        </h3>

        <p className="mb-4 font-mono text-[17px] text-ink">
          ${Number(product.price || 0).toFixed(2)}
        </p>

        <div className="mb-4 flex items-center justify-between">
          <span className="text-[13px] text-stone">Stock:</span>

          <span className="rounded-md border border-hairline bg-paper px-2.5 py-1 font-mono text-[13px] text-ink">
            {stock}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            disabled={isDeleting}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-hairline text-[13px] font-medium text-ink transition-colors hover:bg-paper disabled:opacity-60"
          >
            <Pencil size={14} strokeWidth={1.75} />
            Edit
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            title="Delete product"
            aria-label={`Delete ${product.name}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline text-clay transition-colors hover:bg-clay-tint disabled:opacity-60"
          >
            {isDeleting ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-clay border-t-transparent" />
            ) : (
              <Trash2 size={15} strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

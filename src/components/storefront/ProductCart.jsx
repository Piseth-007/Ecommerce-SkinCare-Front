import { Link } from "react-router-dom";
import { Star, ImageOff } from "lucide-react";

export default function ProductCard({ product }) {
  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="aspect-square bg-paper rounded-xl overflow-hidden border border-hairline mb-3">
        {product.images?.[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={24} className="text-hairline" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-stone mb-1">
        {product.brand?.name || product.category?.name}
      </p>
      <h3 className="text-[14px] font-medium text-ink mb-1 truncate">
        {product.name}
      </h3>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[14px] text-ink">${product.price}</span>
        {product.reviews_avg_rating > 0 && (
          <div className="flex items-center gap-1">
            <Star size={12} className="text-moss fill-moss" />
            <span className="text-[12px] text-stone">
              {product.reviews_avg_rating}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

import { Link } from "react-router-dom";
import { Star, ImageOff, ShoppingBag, ArrowUpRight, Truck } from "lucide-react";
import FavoriteButton from "./FavoriteButton";

export default function ProductCard({ product }) {
  const image = product?.images?.[0]?.url;

  const price = Number(product?.price || 0);
  const discount = Number(product?.discount || 0);

  const hasDiscount = discount > 0;

  // Assuming discount is a percentage.
  const finalPrice = hasDiscount ? price - (price * discount) / 100 : price;

  const rating = Number(product?.reviews_avg_rating || 0);
  const reviewCount = Number(product?.reviews_count || 0);
  const stock = Number(product?.stock || 0);

  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;

  const formatPrice = (value) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <Link
      to={`/products/${product.id}`}
      className={`group block ${isOutOfStock ? "cursor-default" : ""}`}
    >
      <div
        className="
          relative
          aspect-square
          overflow-hidden
          rounded-2xl
          border
          border-hairline
          bg-paper
          transition-all
          duration-500
          group-hover:-translate-y-1
          group-hover:border-moss/20
          group-hover:shadow-[0_18px_40px_rgba(63,88,67,0.10)]
        "
      >

        {image ? (
          <img
            src={image}
            alt={product.name || "Product"}
            loading="lazy"
            className={`
              h-full
              w-full
              object-cover
              transition-transform
              duration-700
              ease-out
              ${
                isOutOfStock
                  ? "grayscale-[30%] opacity-70"
                  : "group-hover:scale-[1.055]"
              }
            `}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-stone/50">
              <ImageOff size={27} strokeWidth={1.25} />

              <span className="text-[10px] uppercase tracking-[0.12em]">
                No image
              </span>
            </div>
          </div>
        )}

        {/* =================================================
            TOP LEFT BADGE
        ================================================= */}

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {hasDiscount && !isOutOfStock && (
            <span className="rounded-full bg-moss px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.08em] text-white shadow-sm">
              -{discount}%
            </span>
          )}

          {product.free_delivery && !isOutOfStock && (
            <span className="flex items-center gap-1 rounded-full border border-white/70 bg-white/85 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.06em] text-moss backdrop-blur-md">
              <Truck size={10} strokeWidth={1.8} />
              Free delivery
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton productId={product.id} size={16} />
        </div>

        {/* =================================================
            STOCK BADGE
        ================================================= */}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-paper/25 backdrop-blur-[1px]">
            <span className="rounded-full border border-hairline bg-white/90 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-stone shadow-sm">
              Out of stock
            </span>
          </div>
        )}

        {/* =================================================
            QUICK VIEW ARROW
        ================================================= */}

        {!isOutOfStock && (
          <div
            className="
              absolute
              bottom-3
              right-3
              flex
              h-9
              w-9
              translate-y-2
              items-center
              justify-center
              rounded-full
              bg-white/90
              text-ink
              opacity-0
              shadow-[0_8px_20px_rgba(0,0,0,0.08)]
              backdrop-blur-md
              transition-all
              duration-400
              group-hover:translate-y-0
              group-hover:opacity-100
            "
          >
            <ArrowUpRight
              size={15}
              strokeWidth={1.7}
              className="transition-transform duration-300 group-hover:rotate-6"
            />
          </div>
        )}

        {/* =================================================
            IMAGE OVERLAY
        ================================================= */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            bg-gradient-to-t
            from-moss/[0.06]
            via-transparent
            to-transparent
            opacity-0
            transition-opacity
            duration-500
            group-hover:opacity-100
          "
        />
      </div>

      {/* =====================================================
          PRODUCT INFORMATION
      ===================================================== */}

      <div className="pt-3">
        {/* Brand / Category */}

        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.09em] text-stone">
            {product.brand?.name || product.category?.name || "Skincare"}
          </p>

          {reviewCount > 0 && (
            <div className="flex shrink-0 items-center gap-1">
              <Star
                size={11}
                strokeWidth={1.5}
                className="fill-moss text-moss"
              />

              <span className="text-[10px] text-stone">
                {rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Product name */}

        <h3
          className="
            truncate
            text-[14px]
            font-medium
            leading-tight
            text-ink
            transition-colors
            duration-300
            group-hover:text-moss-deep
          "
          title={product.name}
        >
          {product.name}
        </h3>

        {/* =================================================
            PRICE + STOCK
        ================================================= */}

        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[14px] font-medium text-ink">
              ${formatPrice(finalPrice)}
            </span>

            {hasDiscount && (
              <span className="font-mono text-[11px] text-stone/60 line-through">
                ${formatPrice(price)}
              </span>
            )}
          </div>

          {isLowStock && (
            <span className="text-[9px] font-medium uppercase tracking-[0.05em] text-clay">
              {stock} left
            </span>
          )}
        </div>

        {/* =================================================
            RATING
        ================================================= */}

        {reviewCount > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={10}
                  strokeWidth={1.5}
                  className={
                    star <= Math.round(rating)
                      ? "fill-moss text-moss"
                      : "fill-hairline text-hairline"
                  }
                />
              ))}
            </div>

            <span className="text-[10px] text-stone">
              {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </span>
          </div>
        )}

        {/* =================================================
            INTERACTION LINE
        ================================================= */}

        {!isOutOfStock && (
          <div className="mt-3 flex items-center justify-between border-t border-hairline pt-2.5">
            <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-stone transition-colors duration-300 group-hover:text-moss">
              View product
            </span>

            <ShoppingBag
              size={13}
              strokeWidth={1.6}
              className="
                translate-x-1
                text-stone
                opacity-0
                transition-all
                duration-300
                group-hover:translate-x-0
                group-hover:text-moss
                group-hover:opacity-100
              "
            />
          </div>
        )}
      </div>
    </Link>
  );
}

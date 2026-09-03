import { useContext } from "react";
import { Link } from "react-router-dom";
import { FavoritesContext } from "../../context/FavoriteContext";
import FavoriteButton from "../../components/storefront/FavoriteButton";
import { ImageOff } from "lucide-react";

function money(value) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "$0.00";
  }

  return `$${amount.toFixed(2)}`;
}

export default function Favorites() {
  const { favorites = [], loading } = useContext(FavoritesContext);

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: "var(--color-paper)",
        color: "var(--color-ink)",
      }}
    >
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl mb-1"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            Your favorites
          </h1>

          <p className="text-sm" style={{ color: "var(--color-stone)" }}>
            Products you've saved to come back to later.
          </p>
        </div>

        {/* Loading */}
        {loading ? (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-8"
            aria-label="Loading favorites"
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index}>
                <div
                  className="aspect-square rounded-sm animate-pulse mb-3"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-hairline)",
                  }}
                />

                <div
                  className="h-4 w-3/4 rounded animate-pulse mb-2"
                  style={{
                    backgroundColor: "var(--color-surface)",
                  }}
                />

                <div
                  className="h-3 w-1/3 rounded animate-pulse"
                  style={{
                    backgroundColor: "var(--color-surface)",
                  }}
                />
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          /* Empty State */
          <div className="py-16 text-center">
            <div
              className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-hairline)",
              }}
            >
              <span className="text-lg" style={{ color: "var(--color-stone)" }}>
                ♡
              </span>
            </div>

            <p className="text-sm mb-4" style={{ color: "var(--color-stone)" }}>
              Nothing saved yet. Tap the heart on any product to keep it here.
            </p>

            <Link
              to="/products"
              className="inline-block text-sm transition-opacity hover:opacity-70"
              style={{ color: "var(--color-moss)" }}
            >
              Browse products →
            </Link>
          </div>
        ) : (
          /* Favorites */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-8">
            {favorites.map((fav) => {
              const product = fav.product;

              if (!product) return null;

              const price = Number(product.price) || 0;
              const discount = Number(product.discount) || 0;

              const discounted =
                discount > 0 ? Math.max(price - discount, 0) : null;

              const image = product?.images?.[0]?.url;

              return (
                <article key={fav.id} className="group relative">
                  <Link to={`/products/${product.id}`} className="block">
                    <div
                      className="aspect-square rounded-sm overflow-hidden mb-3"
                      style={{
                        backgroundColor: "var(--color-surface)",
                        border: "1px solid var(--color-hairline)",
                      }}
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff
                            size={28}
                            strokeWidth={1.5}
                            style={{
                              color: "var(--color-stone)",
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Product Name */}
                    <p
                      className="text-sm leading-snug line-clamp-2"
                      style={{
                        fontFamily: "Fraunces, serif",
                      }}
                    >
                      {product.name}
                    </p>

                    {/* Price */}
                    <div
                      className="flex items-center gap-2 mt-1"
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
                      {discounted !== null ? (
                        <>
                          <span
                            className="text-sm"
                            style={{
                              color: "var(--color-clay)",
                            }}
                          >
                            {money(discounted)}
                          </span>

                          <span
                            className="text-xs line-through"
                            style={{
                              color: "var(--color-stone)",
                            }}
                          >
                            {money(price)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm">{money(price)}</span>
                      )}
                    </div>
                  </Link>

                  {/* Favorite */}
                  <div
                    className="absolute top-2 right-2 rounded-full p-1"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--color-paper) 85%, transparent)",
                    }}
                  >
                    <FavoriteButton productId={product.id} size={15} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

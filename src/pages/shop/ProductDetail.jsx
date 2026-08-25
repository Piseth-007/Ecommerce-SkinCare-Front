import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star, Minus, Plus, ShoppingBag, ImageOff } from "lucide-react";
import api from "../../api/axios";
import { useCart } from "../../context/useCard";
import { useToast } from "../../context/useToast";
import { useAuth } from "../../context/useAuth";

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => setProduct(res.data));
    api.get(`/products/${id}/reviews`).then((res) => setReviews(res.data));
    setActiveImage(0);
    setQuantity(1);
    window.scrollTo(0, 0);
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      showToast("Please sign in to add items to your cart", "error");
      return;
    }
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      showToast(`Added ${quantity} × ${product.name} to cart`);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to add to cart",
        "error",
      );
    } finally {
      setAdding(false);
    }
  };

  if (!product)
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-stone text-[13.5px]">
        Loading…
      </div>
    );

  const images = product.images || [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="grid grid-cols-2 gap-12 mb-16">
        {/* Gallery */}
        <div>
          <div className="aspect-square bg-paper border border-hairline rounded-xl overflow-hidden mb-3">
            {images[activeImage]?.url ? (
              <img
                src={images[activeImage].url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageOff
                  size={32}
                  className="text-hairline"
                  strokeWidth={1.5}
                />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((img, i) => (
                <button
                  key={img.public_id}
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    i === activeImage ? "border-moss" : "border-transparent"
                  }`}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-stone mb-2">
            {product.brand?.name || product.category?.name}
          </p>
          <h1 className="font-display text-[30px] font-medium text-ink mb-3">
            {product.name}
          </h1>

          {product.reviews_count > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={14}
                    className={
                      n <= Math.round(product.reviews_avg_rating)
                        ? "text-moss fill-moss"
                        : "text-hairline fill-hairline"
                    }
                  />
                ))}
              </div>
              <span className="text-[13px] text-stone">
                {product.reviews_avg_rating} ({product.reviews_count} reviews)
              </span>
            </div>
          )}

          <p className="font-mono text-[24px] text-ink mb-6">
            ${product.price}
          </p>

          {product.description && (
            <p className="text-[14px] text-stone leading-relaxed mb-6">
              {product.description}
            </p>
          )}

          <p
            className={`text-[13px] font-medium mb-6 ${product.stock > 5 ? "text-moss" : product.stock > 0 ? "text-clay" : "text-clay"}`}
          >
            {product.stock > 5
              ? "In stock"
              : product.stock > 0
                ? `Only ${product.stock} left`
                : "Out of stock"}
          </p>

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-hairline rounded-lg">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2.5 text-stone hover:text-ink transition-colors"
              >
                <Minus size={14} strokeWidth={2} />
              </button>
              <span className="w-8 text-center font-mono text-[14px] text-ink">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity((q) => Math.min(product.stock, q + 1))
                }
                className="p-2.5 text-stone hover:text-ink transition-colors"
              >
                <Plus size={14} strokeWidth={2} />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={adding || product.stock === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-moss text-white text-[13.5px] font-medium hover:bg-moss-deep transition-colors disabled:opacity-50"
            >
              <ShoppingBag size={16} strokeWidth={1.75} />
              {adding ? "Adding…" : "Add to cart"}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="max-w-3xl">
        <h2 className="font-display text-[20px] font-medium text-ink mb-5">
          Reviews
        </h2>
        {reviews.length === 0 ? (
          <p className="text-[13.5px] text-stone">
            No reviews yet — be the first to share your experience.
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-hairline pb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={12}
                        className={
                          n <= review.rating
                            ? "text-moss fill-moss"
                            : "text-hairline fill-hairline"
                        }
                      />
                    ))}
                  </div>
                  {review.title && (
                    <span className="text-[13.5px] font-medium text-ink">
                      {review.title}
                    </span>
                  )}
                </div>
                <p className="text-[12.5px] text-stone mb-1.5">
                  {review.user?.name} ·{" "}
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
                {review.comment && (
                  <p className="text-[13.5px] text-ink leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

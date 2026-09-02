import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  ImageOff,
  Leaf,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Truck,
  ShieldCheck,
  Sparkles,
  RefreshCw,
} from "lucide-react";

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

  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState(false);

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [showCartSheet, setShowCartSheet] = useState(false);

  const [liked, setLiked] = useState(false);

  /* =========================================================
     LOAD PRODUCT
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadProduct = async () => {
      setLoading(true);
      setError(false);
      setActiveImage(0);
      setQuantity(1);
      setAdded(false);
      setShowCartSheet(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      try {
        const response = await api.get(`/products/${id}`);

        if (mounted) {
          setProduct(response.data);
        }
      } catch {
        if (mounted) {
          setError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;

    const loadReviews = async () => {
      setReviewsLoading(true);

      try {
        const response = await api.get(`/products/${id}/reviews`);

        if (mounted) {
          setReviews(response.data || []);
        }
      } catch {
        if (mounted) {
          setReviews([]);
        }
      } finally {
        if (mounted) {
          setReviewsLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      mounted = false;
    };
  }, [id]);

  const images = product?.images || [];
  const skinTypes = product?.skin_types || [];

  const price = Number(product?.price || 0);
  const discount = Number(product?.discount || 0);
  const stock = Number(product?.stock || 0);

  const rating = Number(product?.reviews_avg_rating || 0);
  const reviewCount = Number(product?.reviews_count || 0);

  const hasDiscount = discount > 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;

  const finalPrice = useMemo(() => {
    if (!hasDiscount) return price;

    return price - (price * discount) / 100;
  }, [price, discount, hasDiscount]);

  const totalPrice = finalPrice * quantity;

  const formatPrice = (value) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  /* =========================================================
     IMAGE NAVIGATION
  ========================================================= */

  const nextImage = () => {
    if (images.length <= 1) return;

    setActiveImage((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  };

  const previousImage = () => {
    if (images.length <= 1) return;

    setActiveImage((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  };

  /* =========================================================
     QUANTITY
  ========================================================= */

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const increaseQuantity = () => {
    setQuantity((current) => Math.min(stock, current + 1));
  };

  /* =========================================================
     ADD TO CART
  ========================================================= */

  const handleAddToCart = async () => {
    if (!user) {
      showToast("Please sign in to add items to your cart", "error");

      return;
    }

    if (!product || isOutOfStock || adding) return;

    setAdding(true);

    try {
      await addToCart(product.id, quantity);

      setAdded(true);
      setShowCartSheet(true);

      showToast(`Added ${quantity} × ${product.name} to cart`);

      setTimeout(() => {
        setAdded(false);
      }, 1800);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to add to cart",
        "error",
      );
    } finally {
      setAdding(false);
    }
  };
  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-moss-tint">
            <ImageOff size={22} strokeWidth={1.4} className="text-moss" />
          </div>

          <h1 className="font-display text-[24px] text-ink">
            Product not found
          </h1>

          <p className="mt-2 text-[13px] text-stone">
            We couldn't find the product you're looking for.
          </p>

          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-moss px-5 py-3 text-[13px] font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-moss-deep"
          >
            <ArrowLeft size={14} />
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-paper text-ink">
      <style>{`
        @keyframes product-detail-fade {
          from {
            opacity: 0;
            transform: translateY(14px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes product-detail-image {
          from {
            opacity: 0;
            transform: scale(1.025);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes product-detail-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: .5;
          }

          50% {
            transform: scale(1.08);
            opacity: .8;
          }
        }

        @keyframes cart-sheet-backdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes cart-sheet-rise {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cart-sheet-content {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .product-detail-fade {
          animation: product-detail-fade .7s ease-out both;
        }

        .product-detail-image {
          animation: product-detail-image .6s ease-out both;
        }

        .product-detail-pulse {
          animation: product-detail-pulse 4s ease-in-out infinite;
        }

        .cart-sheet-backdrop {
          animation: cart-sheet-backdrop .22s ease-out both;
        }

        .cart-sheet-panel {
          animation: cart-sheet-rise .46s cubic-bezier(.22, 1, .36, 1) both;
          will-change: transform;
        }

        .cart-sheet-content {
          animation: cart-sheet-content .35s .14s cubic-bezier(.22, 1, .36, 1) both;
        }

        @media (prefers-reduced-motion: reduce) {
          .product-detail-fade,
          .product-detail-image,
          .product-detail-pulse,
          .cart-sheet-backdrop,
          .cart-sheet-panel,
          .cart-sheet-content {
            animation: none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-6xl px-6 pt-7">
        <div className="flex items-center gap-2 text-[11px] text-stone">
          <Link to="/products" className="transition-colors hover:text-moss">
            Shop
          </Link>

          <span className="text-hairline">/</span>

          {product.category?.name && (
            <>
              <Link
                to={`/products?category_id=${product.category.id}`}
                className="capitalize transition-colors hover:text-moss"
              >
                {product.category.name}
              </Link>

              <span className="text-hairline">/</span>
            </>
          )}

          <span className="max-w-[180px] truncate text-ink">
            {product.name}
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-7">
        <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 p-10">
          <div className="product-detail-fade">
            <div className="group relative aspect-square overflow-hidden rounded-2xl border border-hairline bg-surface">
              <div className="product-detail-pulse pointer-events-none absolute -right-16 -top-16 z-0 h-40 w-40 rounded-full bg-moss/[0.06] blur-2xl" />

              {images[activeImage]?.url ? (
                <img
                  key={images[activeImage].url}
                  src={images[activeImage].url}
                  alt={product.name}
                  className="product-detail-image relative z-10 h-full w-full object-cover"
                />
              ) : (
                <div className="relative z-10 flex h-full w-full items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-stone/50">
                    <ImageOff size={34} strokeWidth={1.2} />

                    <span className="text-[10px] uppercase tracking-[0.12em]">
                      No image
                    </span>
                  </div>
                </div>
              )}

              {/* Sale badge */}

              {hasDiscount && !isOutOfStock && (
                <span className="absolute left-4 top-4 z-20 rounded-full bg-moss px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-white shadow-sm">
                  -{discount}%
                </span>
              )}

              {/* Free delivery */}

              {product.free_delivery && !isOutOfStock && (
                <span className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full border border-white/70 bg-white/85 px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.06em] text-moss backdrop-blur-md">
                  <Truck size={11} strokeWidth={1.7} />
                  Free delivery
                </span>
              )}

              {/* Out of stock */}

              {isOutOfStock && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-paper/30 backdrop-blur-[2px]">
                  <span className="rounded-full border border-hairline bg-white/90 px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-stone shadow-sm">
                    Out of stock
                  </span>
                </div>
              )}

              {/* Previous */}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={previousImage}
                    aria-label="Previous image"
                    className="absolute left-4 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/85 text-ink opacity-0 shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-white group-hover:opacity-100"
                  >
                    <ChevronLeft size={17} />
                  </button>

                  {/* Next */}

                  <button
                    type="button"
                    onClick={nextImage}
                    aria-label="Next image"
                    className="absolute right-4 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/85 text-ink opacity-0 shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-white group-hover:opacity-100"
                  >
                    <ChevronRight size={17} />
                  </button>
                </>
              )}

              {/* Image counter */}

              {images.length > 1 && (
                <div className="absolute bottom-4 right-4 z-20 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[9px] font-mono text-stone backdrop-blur-md">
                  {activeImage + 1} / {images.length}
                </div>
              )}
            </div>

            {/* =================================================
                THUMBNAILS
            ================================================= */}

            {images.length > 1 && (
              <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={image.public_id || image.url || index}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`relative h-[74px] w-[74px] shrink-0 overflow-hidden rounded-xl border transition-all duration-300 ${
                      index === activeImage
                        ? "border-moss shadow-[0_6px_20px_rgba(63,88,67,0.12)]"
                        : "border-hairline opacity-65 hover:border-moss/30 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />

                    {index === activeImage && (
                      <span className="absolute inset-0 border-2 border-moss/20" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* =================================================
              PRODUCT INFO
          ================================================= */}

          <div className="product-detail-fade lg:sticky lg:top-24">
            {/* Brand */}

            <div className="flex items-center justify-between gap-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-moss">
                {product.brand?.name || product.category?.name || "Skincare"}
              </p>

              {/* Wishlist */}

              <button
                type="button"
                onClick={() => setLiked((value) => !value)}
                aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 ${
                  liked
                    ? "border-moss/20 bg-moss-tint text-moss"
                    : "border-hairline bg-surface text-stone hover:border-moss/30 hover:text-moss"
                }`}
              >
                <Heart
                  size={16}
                  strokeWidth={1.5}
                  className={liked ? "fill-moss" : ""}
                />
              </button>
            </div>

            {/* Category */}

            {product.category?.name && (
              <p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-stone">
                {product.category.name}
              </p>
            )}

            {/* Title */}

            <h1 className="mt-3 font-display text-[32px] font-medium leading-[1.08] tracking-[-0.02em] text-ink sm:text-[38px]">
              {product.name}
            </h1>

            {/* Rating */}

            {reviewCount > 0 ? (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      strokeWidth={1.5}
                      className={
                        star <= Math.round(rating)
                          ? "fill-moss text-moss"
                          : "fill-hairline text-hairline"
                      }
                    />
                  ))}
                </div>

                <span className="text-[12px] font-medium text-ink">
                  {rating.toFixed(1)}
                </span>

                <span className="text-[12px] text-stone">
                  {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                </span>
              </div>
            ) : (
              <div className="mt-5 flex items-center gap-2 text-[12px] text-stone">
                <Star size={14} strokeWidth={1.5} />
                No reviews yet
              </div>
            )}

            {/* Divider */}

            <div className="my-6 h-px bg-hairline" />

            {/* Price */}

            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[26px] font-medium text-ink">
                ${formatPrice(finalPrice)}
              </span>

              {hasDiscount && (
                <>
                  <span className="font-mono text-[14px] text-stone/60 line-through">
                    ${formatPrice(price)}
                  </span>

                  <span className="rounded-full bg-moss-tint px-2 py-1 text-[9px] font-medium uppercase tracking-[0.06em] text-moss">
                    Save {discount}%
                  </span>
                </>
              )}
            </div>

            {/* Description */}

            {product.description && (
              <p className="mt-6 text-[14px] leading-[1.8] text-stone">
                {product.description}
              </p>
            )}

            {/* =================================================
                SKIN TYPES
            ================================================= */}

            {skinTypes.length > 0 && (
              <div className="mt-6">
                <p className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.1em] text-stone">
                  Suits these skin types
                </p>

                <div className="flex flex-wrap gap-2">
                  {skinTypes.map((skinType) => (
                    <span
                      key={skinType.id}
                      title={skinType.description || undefined}
                      className="rounded-full border border-hairline bg-moss-tint px-3 py-1.5 text-[11px] font-medium text-moss"
                    >
                      {skinType.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* =================================================
                FREE DELIVERY
            ================================================= */}

            {product.free_delivery && (
              <div className="mt-4 flex items-center gap-2 text-[12px] font-medium text-moss">
                <Truck size={14} strokeWidth={1.75} />
                Free delivery on this item
              </div>
            )}

            {/* =================================================
                STOCK
            ================================================= */}

            <div className="mt-6">
              {isOutOfStock ? (
                <div className="flex items-center gap-2 text-[12px] font-medium text-clay">
                  <span className="h-1.5 w-1.5 rounded-full bg-clay" />
                  Currently unavailable
                </div>
              ) : isLowStock ? (
                <div className="flex items-center gap-2 text-[12px] font-medium text-clay">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay" />
                  Only {stock} left in stock
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[12px] font-medium text-moss">
                  <span className="h-1.5 w-1.5 rounded-full bg-moss" />
                  In stock
                </div>
              )}
            </div>

            {/* =================================================
                QUANTITY + CART
            ================================================= */}

            <div className="mt-7 flex gap-3">
              <div
                className={`flex h-[50px] items-center rounded-xl border ${
                  isOutOfStock
                    ? "border-hairline opacity-50"
                    : "border-hairline"
                }`}
              >
                <button
                  type="button"
                  disabled={isOutOfStock || quantity <= 1}
                  onClick={decreaseQuantity}
                  className="flex h-full w-11 items-center justify-center text-stone transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus size={14} strokeWidth={1.8} />
                </button>

                <span className="w-8 text-center font-mono text-[14px] text-ink">
                  {quantity}
                </span>

                <button
                  type="button"
                  disabled={isOutOfStock || quantity >= stock}
                  onClick={increaseQuantity}
                  className="flex h-full w-11 items-center justify-center text-stone transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={14} strokeWidth={1.8} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding || isOutOfStock}
                className={`group flex h-[50px] flex-1 items-center justify-center gap-2 rounded-xl px-5 text-[13px] font-medium text-white shadow-[0_10px_25px_rgba(63,88,67,0.14)] transition-all duration-300 ${
                  added
                    ? "bg-moss-deep"
                    : "bg-moss hover:-translate-y-0.5 hover:bg-moss-deep hover:shadow-[0_14px_30px_rgba(63,88,67,0.22)]"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {added ? (
                  <>
                    <Check size={16} strokeWidth={2} />
                    Added to cart
                  </>
                ) : adding ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingBag
                      size={16}
                      strokeWidth={1.7}
                      className="transition-transform duration-300 group-hover:-translate-y-0.5"
                    />
                    Add to cart
                  </>
                )}
              </button>
            </div>

            {/* Total */}

            {!isOutOfStock && quantity > 1 && (
              <div className="mt-3 flex items-center justify-between text-[11px] text-stone">
                <span>Quantity</span>

                <span className="font-mono text-ink">
                  ${formatPrice(totalPrice)}
                </span>
              </div>
            )}

            {/* =================================================
                BENEFITS
            ================================================= */}

            <div className="mt-8 grid grid-cols-1 divide-y divide-hairline border-y border-hairline">
              <ProductBenefit
                icon={Truck}
                title="Fast delivery"
                text={
                  product.free_delivery
                    ? "Free delivery available"
                    : "Fast delivery in Phnom Penh"
                }
              />

              <ProductBenefit
                icon={ShieldCheck}
                title="Verified quality"
                text="Carefully selected skincare"
              />

              <ProductBenefit
                icon={Leaf}
                title="Skin-conscious"
                text="Thoughtfully selected formulas"
              />
            </div>
          </div>
        </div>
        <section className="mt-20 border-t border-hairline pt-14">
          <div className="grid gap-12 lg:grid-cols-[260px_1fr]">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-moss">
                Customer feedback
              </p>

              <h2 className="mt-2 font-display text-[27px] font-medium text-ink">
                Reviews
              </h2>

              {reviewCount > 0 ? (
                <div className="mt-5">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-[38px] text-ink">
                      {rating.toFixed(1)}
                    </span>

                    <div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={13}
                            strokeWidth={1.5}
                            className={
                              star <= Math.round(rating)
                                ? "fill-moss text-moss"
                                : "fill-hairline text-hairline"
                            }
                          />
                        ))}
                      </div>

                      <p className="mt-1 text-[10px] text-stone">
                        Based on {reviewCount}{" "}
                        {reviewCount === 1 ? "review" : "reviews"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-5 text-[13px] leading-relaxed text-stone">
                  No reviews yet. Be the first to share your experience with
                  this product.
                </p>
              )}
            </div>

            {/* Review list */}

            <div>
              {reviewsLoading ? (
                <ReviewsSkeleton />
              ) : reviews.length === 0 ? (
                <div className="rounded-2xl border border-hairline bg-surface px-6 py-10 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-moss-tint">
                    <Sparkles
                      size={17}
                      strokeWidth={1.4}
                      className="text-moss"
                    />
                  </div>

                  <p className="mt-4 text-[13px] font-medium text-ink">
                    No reviews yet
                  </p>

                  <p className="mt-1 text-[12px] text-stone">
                    Your experience could be the first one shared here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-hairline">
                  {reviews.map((review) => (
                    <ReviewItem key={review.id} review={review} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =====================================================
            BACK TO SHOP
        ===================================================== */}

        <div className="mt-16 border-t border-hairline pt-7">
          <Link
            to="/products"
            className="group inline-flex items-center gap-2 text-[12px] font-medium text-stone transition-colors hover:text-moss"
          >
            <ArrowLeft
              size={13}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />
            Continue shopping
          </Link>
        </div>
      </main>

      {showCartSheet && (
        <div
          className="cart-sheet-backdrop fixed inset-0 z-50 flex items-end bg-black/40"
          onClick={() => setShowCartSheet(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-sheet-title"
            className="cart-sheet-panel w-full rounded-t-3xl bg-white px-6 pb-8 pt-4 shadow-2xl sm:mx-auto sm:max-w-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-hairline" />

            <div className="cart-sheet-content flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-moss-tint text-moss">
                <Check size={20} strokeWidth={2} />
              </div>
              <div>
                <h2
                  id="cart-sheet-title"
                  className="text-[18px] font-medium text-ink"
                >
                  Added to your cart
                </h2>
                <p className="mt-1 text-[13px] text-stone">
                  {quantity} × {product.name}
                </p>
              </div>
            </div>

            <div className="cart-sheet-content mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowCartSheet(false)}
                className="rounded-xl border border-hairline px-4 py-3 text-[13px] font-medium text-ink transition-all duration-200 hover:bg-paper active:scale-[0.98]"
              >
                Continue shopping
              </button>
              <Link
                to="/checkout"
                className="flex items-center justify-center gap-2 rounded-xl bg-moss px-4 py-3 text-[13px] font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-moss-deep active:translate-y-0 active:scale-[0.98]"
              >
                <ShoppingBag size={16} />
                Go to checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PRODUCT BENEFIT
========================================================= */

function ProductBenefit({ icon: Icon, title, text }) {
  return (
    <div className="group flex items-center gap-3 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moss-tint transition-all duration-300 group-hover:scale-105 group-hover:bg-moss">
        <Icon
          size={15}
          strokeWidth={1.5}
          className="text-moss transition-colors duration-300 group-hover:text-white"
        />
      </span>

      <div>
        <p className="text-[11px] font-medium text-ink">{title}</p>

        <p className="mt-0.5 text-[10px] text-stone">{text}</p>
      </div>
    </div>
  );
}

/* =========================================================
   REVIEW ITEM
========================================================= */

function ReviewItem({ review }) {
  const rating = Number(review.rating || 0);

  return (
    <article className="py-6 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-moss-tint">
            <span className="text-[10px] font-medium uppercase text-moss">
              {(review.user?.name || "U").charAt(0).toUpperCase()}
            </span>
          </div>

          <div>
            <p className="text-[12px] font-medium text-ink">
              {review.user?.name || "Customer"}
            </p>

            <p className="text-[10px] text-stone">
              {review.created_at
                ? new Date(review.created_at).toLocaleDateString()
                : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={11}
              strokeWidth={1.5}
              className={
                star <= rating
                  ? "fill-moss text-moss"
                  : "fill-hairline text-hairline"
              }
            />
          ))}
        </div>
      </div>

      {review.title && (
        <h3 className="mt-4 text-[13px] font-medium text-ink">
          {review.title}
        </h3>
      )}

      {review.comment && (
        <p className="mt-2 max-w-2xl text-[13px] leading-[1.75] text-stone">
          {review.comment}
        </p>
      )}
    </article>
  );
}

/* =========================================================
   PRODUCT DETAIL SKELETON
========================================================= */

function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-6 pb-20 pt-8">
      {/* Breadcrumb */}

      <div className="h-3 w-48 rounded bg-hairline/50" />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
        {/* Image */}

        <div>
          <div className="aspect-square rounded-2xl bg-hairline/30" />

          <div className="mt-3 flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[74px] w-[74px] rounded-xl bg-hairline/30"
              />
            ))}
          </div>
        </div>

        {/* Info */}

        <div className="pt-2">
          <div className="h-3 w-20 rounded bg-hairline/50" />

          <div className="mt-4 h-10 w-4/5 rounded bg-hairline/50" />

          <div className="mt-5 h-4 w-32 rounded bg-hairline/40" />

          <div className="my-6 h-px bg-hairline" />

          <div className="h-7 w-28 rounded bg-hairline/50" />

          <div className="mt-6 space-y-2">
            <div className="h-3 w-full rounded bg-hairline/30" />
            <div className="h-3 w-11/12 rounded bg-hairline/30" />
            <div className="h-3 w-4/5 rounded bg-hairline/30" />
          </div>

          <div className="mt-7 h-3 w-24 rounded bg-hairline/40" />

          <div className="mt-7 flex gap-3">
            <div className="h-[50px] w-28 rounded-xl bg-hairline/40" />
            <div className="h-[50px] flex-1 rounded-xl bg-hairline/50" />
          </div>

          <div className="mt-8 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-14 rounded-xl bg-hairline/25" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   REVIEWS SKELETON
========================================================= */

function ReviewsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="border-b border-hairline pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-hairline/40" />

              <div>
                <div className="h-3 w-24 rounded bg-hairline/40" />

                <div className="mt-1 h-2 w-16 rounded bg-hairline/30" />
              </div>
            </div>

            <div className="h-3 w-20 rounded bg-hairline/30" />
          </div>

          <div className="mt-4 h-3 w-4/5 rounded bg-hairline/30" />

          <div className="mt-2 h-3 w-3/5 rounded bg-hairline/30" />
        </div>
      ))}
    </div>
  );
}

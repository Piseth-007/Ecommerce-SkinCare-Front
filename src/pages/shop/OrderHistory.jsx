import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useToast } from "../../context/useToast";

const statusStyles = {
  pending: "bg-stone/10 text-stone",
  paid: "bg-moss-tint text-moss-deep",
  shipped: "bg-moss-tint text-moss-deep",
  completed: "bg-moss-tint text-moss-deep",
  cancelled: "bg-clay-tint text-clay",
};

// ─────────────────────────────────────────────
// Order Skeleton
// ─────────────────────────────────────────────
function OrderSkeleton() {
  return (
    <div className="bg-surface border border-hairline rounded-xl p-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-paper" />
          <div className="h-3 w-20 rounded bg-paper" />
        </div>

        <div className="h-6 w-20 rounded-md bg-paper" />
      </div>

      {/* Items */}
      <div className="space-y-3 border-t border-hairline pt-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-44 rounded bg-paper" />
          <div className="h-4 w-24 rounded bg-paper" />
        </div>

        <div className="flex items-center justify-between">
          <div className="h-4 w-36 rounded bg-paper" />
          <div className="h-4 w-24 rounded bg-paper" />
        </div>

        <div className="flex items-center justify-between">
          <div className="h-4 w-48 rounded bg-paper" />
          <div className="h-4 w-24 rounded bg-paper" />
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between border-t border-hairline pt-3 mt-3">
        <div className="h-4 w-12 rounded bg-paper" />
        <div className="h-4 w-16 rounded bg-paper" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Loading Skeleton
// ─────────────────────────────────────────────
function OrderHistorySkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Page title skeleton */}
      <div className="h-8 w-40 rounded bg-surface animate-pulse mb-8" />

      {/* Order cards */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <OrderSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Order History
// ─────────────────────────────────────────────
export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [reviewableItems, setReviewableItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState(null);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const [ordersRes, reviewableRes] = await Promise.all([
          api.get("/orders"),
          api.get("/reviewable-items"),
        ]);

        setOrders(ordersRes.data);
        setReviewableItems(reviewableRes.data);
      } catch (err) {
        showToast(
          err.response?.data?.message || "Failed to load orders",
          "error",
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [showToast]);

  const isReviewable = (productId) =>
    reviewableItems.some((item) => item.product_id === productId);

  const getOrderItemId = (productId) =>
    reviewableItems.find((item) => item.product_id === productId)?.id;

  const submitReview = async (e) => {
    e.preventDefault();

    try {
      await api.post("/reviews", {
        order_item_id: reviewForm.orderItemId,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
      });

      showToast("Review submitted — thank you!");

      setReviewableItems((prev) =>
        prev.filter((item) => item.id !== reviewForm.orderItemId),
      );

      setReviewForm(null);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to submit review",
        "error",
      );
    }
  };

  // ─────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────
  if (loading) {
    return <OrderHistorySkeleton />;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Header */}
      <h1 className="font-display text-[28px] font-medium text-ink mb-8">
        Your orders
      </h1>

      {/* Empty */}
      {orders.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[13.5px] text-stone">
            You haven't placed any orders yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              role="link"
              tabIndex={0}
              onClick={() => navigate(`/orders/${order.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate(`/orders/${order.id}`);
                }
              }}
              className="bg-surface border border-hairline rounded-xl p-5 cursor-pointer hover:border-moss/40 transition-colors"
            >
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-mono text-[14px] text-ink">
                    Order #{order.id}
                  </p>

                  <p className="text-[12px] text-stone">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>

                <span
                  className={`text-[11px] font-medium uppercase tracking-wide px-2.5 py-1 rounded-md ${
                    statusStyles[order.status] || statusStyles.pending
                  }`}
                >
                  {order.status}
                </span>
              </div>

              {/* Order Items */}
              <div className="space-y-3 border-t border-hairline pt-4">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4"
                  >
                    <p className="text-[13.5px] text-ink">
                      {item.product_name} × {item.quantity}
                    </p>

                    {isReviewable(item.product_id) && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();

                          setReviewForm({
                            orderItemId: getOrderItemId(item.product_id),
                            productName: item.product_name,
                            rating: 5,
                            title: "",
                            comment: "",
                          });
                        }}
                        className="flex shrink-0 items-center gap-1 text-[12.5px] font-medium text-moss hover:text-moss-deep transition-colors"
                      >
                        <Star size={12} strokeWidth={2} />
                        Write a review
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between border-t border-hairline pt-3 mt-3">
                <span className="text-[13.5px] font-medium text-ink">
                  Total
                </span>

                <span className="font-mono text-[13.5px] text-ink">
                  ${Number(order.total || 0).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-[2px] px-4"
          onClick={() => setReviewForm(null)}
        >
          <form
            onSubmit={submitReview}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-hairline rounded-xl p-6 w-full max-w-sm space-y-4"
          >
            <h3 className="font-display text-[17px] font-medium text-ink">
              {reviewForm.productName}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setReviewForm({
                      ...reviewForm,
                      rating: n,
                    })
                  }
                  className="transition-transform hover:scale-110"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                >
                  <Star
                    size={22}
                    className={
                      n <= reviewForm.rating
                        ? "text-moss fill-moss"
                        : "text-hairline fill-hairline"
                    }
                  />
                </button>
              ))}
            </div>

            {/* Title */}
            <input
              type="text"
              placeholder="Title (optional)"
              value={reviewForm.title}
              onChange={(e) =>
                setReviewForm({
                  ...reviewForm,
                  title: e.target.value,
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-hairline bg-paper text-[13.5px] text-ink placeholder:text-stone focus:outline-none focus:ring-2 focus:ring-moss/30"
            />

            {/* Comment */}
            <textarea
              placeholder="Share your experience…"
              value={reviewForm.comment}
              onChange={(e) =>
                setReviewForm({
                  ...reviewForm,
                  comment: e.target.value,
                })
              }
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-hairline bg-paper text-[13.5px] text-ink placeholder:text-stone focus:outline-none focus:ring-2 focus:ring-moss/30 resize-none"
            />

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-lg bg-moss text-white text-[13.5px] font-medium hover:bg-moss-deep transition-colors"
              >
                Submit review
              </button>

              <button
                type="button"
                onClick={() => setReviewForm(null)}
                className="px-4 py-2.5 rounded-lg border border-hairline text-ink text-[13.5px] font-medium hover:bg-paper transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

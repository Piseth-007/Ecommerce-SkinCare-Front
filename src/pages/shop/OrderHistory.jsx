import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../../context/useToast";

const statusStyles = {
  pending: "bg-stone/10 text-stone",
  paid: "bg-moss-tint text-moss-deep",
  shipped: "bg-moss-tint text-moss-deep",
  completed: "bg-moss-tint text-moss-deep",
  cancelled: "bg-clay-tint text-clay",
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [reviewableItems, setReviewableItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([api.get("/orders"), api.get("/reviewable-items")])
      .then(([ordersRes, reviewableRes]) => {
        setOrders(ordersRes.data);
        setReviewableItems(reviewableRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

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
        prev.filter((i) => i.id !== reviewForm.orderItemId),
      );
      setReviewForm(null);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to submit review",
        "error",
      );
    }
  };

  if (loading)
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-stone text-[13.5px]">
        Loading…
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-[28px] font-medium text-ink mb-8">
        Your orders
      </h1>

      {orders.length === 0 ? (
        <p className="text-[13.5px] text-stone text-center py-16">
          You haven't placed any orders yet.
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-surface border border-hairline rounded-xl p-5"
            >
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
                  className={`text-[11px] font-medium uppercase tracking-wide px-2.5 py-1 rounded-md ${statusStyles[order.status]}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="space-y-3 border-t border-hairline pt-4">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-[13.5px] text-ink">
                        {item.product_name} × {item.quantity}
                      </p>
                    </div>
                    {isReviewable(item.product_id) && (
                      <button
                        onClick={() =>
                          setReviewForm({
                            orderItemId: getOrderItemId(item.product_id),
                            productName: item.product_name,
                            rating: 5,
                            title: "",
                            comment: "",
                          })
                        }
                        className="flex items-center gap-1 text-[12.5px] font-medium text-moss hover:text-moss-deep"
                      >
                        <Star size={12} strokeWidth={2} />
                        Write a review
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between border-t border-hairline pt-3 mt-3">
                <span className="text-[13.5px] font-medium text-ink">
                  Total
                </span>
                <span className="font-mono text-[13.5px] text-ink">
                  ${order.total}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-[2px]"
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

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setReviewForm({ ...reviewForm, rating: n })}
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

            <input
              placeholder="Title (optional)"
              value={reviewForm.title}
              onChange={(e) =>
                setReviewForm({ ...reviewForm, title: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-hairline bg-paper text-[13.5px] focus:outline-none focus:ring-2 focus:ring-moss/30"
            />
            <textarea
              placeholder="Share your experience…"
              value={reviewForm.comment}
              onChange={(e) =>
                setReviewForm({ ...reviewForm, comment: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-hairline bg-paper text-[13.5px] focus:outline-none focus:ring-2 focus:ring-moss/30"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-lg bg-moss text-white text-[13.5px] font-medium hover:bg-moss-deep"
              >
                Submit review
              </button>
              <button
                type="button"
                onClick={() => setReviewForm(null)}
                className="px-4 py-2.5 rounded-lg border border-hairline text-ink text-[13.5px] font-medium hover:bg-paper"
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

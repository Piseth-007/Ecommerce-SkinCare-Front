import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { useCart } from "../../context/useCard";
import { useToast } from "../../context/useToast";

export default function Cart() {
  const { cart, subtotal, updateItem, removeItem } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const items = cart?.items || [];

  const handleQuantityChange = async (itemId, quantity) => {
    if (quantity < 1) return;
    try {
      await updateItem(itemId, quantity);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Could not update quantity",
        "error",
      );
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeItem(itemId);
      showToast("Item removed");
    } catch (err) {
      showToast("Failed to remove item", "error");
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-moss-tint flex items-center justify-center mx-auto mb-5">
          <ShoppingBag size={22} className="text-moss" strokeWidth={1.75} />
        </div>
        <h1 className="font-display text-[24px] font-medium text-ink mb-2">
          Your cart is empty
        </h1>
        <p className="text-[13.5px] text-stone mb-6">
          Start browsing to find your next favorite product.
        </p>
        <Link
          to="/products"
          className="inline-block px-6 py-3 rounded-lg bg-moss text-white text-[14px] font-medium hover:bg-moss-deep transition-colors"
        >
          Shop all products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-display text-[28px] font-medium text-ink mb-8">
        Your cart
      </h1>

      <div className="grid grid-cols-3 gap-10">
        <div className="col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 bg-surface border border-hairline rounded-xl p-4"
            >
              <div className="w-20 h-20 rounded-lg bg-paper border border-hairline overflow-hidden shrink-0">
                {item.product?.images?.[0]?.url && (
                  <img
                    src={item.product.images[0].url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-medium text-ink truncate mb-1">
                  {item.product?.name}
                </h3>
                <p className="font-mono text-[13px] text-stone mb-3">
                  ${item.product?.price}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-hairline rounded-lg">
                    <button
                      onClick={() =>
                        handleQuantityChange(item.id, item.quantity - 1)
                      }
                      className="p-1.5 text-stone hover:text-ink"
                    >
                      <Minus size={13} strokeWidth={2} />
                    </button>
                    <span className="w-7 text-center font-mono text-[13px] text-ink">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        handleQuantityChange(item.id, item.quantity + 1)
                      }
                      className="p-1.5 text-stone hover:text-ink"
                    >
                      <Plus size={13} strokeWidth={2} />
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-1.5 rounded-lg text-stone hover:bg-clay-tint hover:text-clay transition-colors"
                  >
                    <X size={15} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-surface border border-hairline rounded-xl p-5 h-fit sticky top-24">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-stone mb-4">
            Order Summary
          </p>
          <div className="flex justify-between text-[13.5px] text-ink mb-2">
            <span>Subtotal</span>
            <span className="font-mono">${subtotal.toFixed(2)}</span>
          </div>
          <p className="text-[12px] text-stone mb-5">
            Shipping calculated at checkout
          </p>
          <button
            onClick={() => navigate("/checkout")}
            className="w-full py-3 rounded-lg bg-moss text-white text-[13.5px] font-medium hover:bg-moss-deep transition-colors"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

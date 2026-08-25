import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plus, MapPin } from "lucide-react";
import api from "../../api/axios";
import { useCart } from "../../context/useCard";
import { useToast } from "../../context/useToast";

export default function Checkout() {
  const { cart, subtotal, clearCart, refreshCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [form, setForm] = useState({
    type: "home",
    full_name: "",
    phone: "",
    street_address: "",
    city: "",
    province_state: "",
    postal_code: "",
    country: "Cambodia",
  });

  useEffect(() => {
    api.get("/addresses").then((res) => {
      setAddresses(res.data);
      const def = res.data.find((a) => a.is_default) || res.data[0];
      if (def) setSelectedId(def.id);
      else setShowForm(true);
    });
  }, []);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/addresses", {
        ...form,
        is_default: addresses.length === 0,
      });
      setAddresses((prev) => [...prev, res.data]);
      setSelectedId(res.data.id);
      setShowForm(false);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to save address",
        "error",
      );
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedId) {
      showToast("Please select a shipping address", "error");
      return;
    }
    setPlacing(true);
    try {
      const res = await api.post("/orders", { address_id: selectedId });
      await refreshCart();
      showToast("Order placed successfully");
      navigate("/orders", { state: { newOrderId: res.data.id } });
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to place order",
        "error",
      );
    } finally {
      setPlacing(false);
    }
  };

  const items = cart?.items || [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-display text-[28px] font-medium text-ink mb-8">
        Checkout
      </h1>

      <div className="grid grid-cols-3 gap-10">
        <div className="col-span-2 space-y-6">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-stone mb-3">
              Shipping address
            </p>

            <div className="space-y-2 mb-3">
              {addresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => setSelectedId(addr.id)}
                  className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                    selectedId === addr.id
                      ? "border-moss bg-moss-tint"
                      : "border-hairline bg-surface hover:border-stone/30"
                  }`}
                >
                  <MapPin
                    size={16}
                    className={
                      selectedId === addr.id ? "text-moss" : "text-stone"
                    }
                    strokeWidth={1.75}
                  />
                  <div>
                    <p className="text-[13.5px] font-medium text-ink">
                      {addr.full_name} · {addr.phone}
                    </p>
                    <p className="text-[12.5px] text-stone">
                      {addr.street_address}, {addr.city}, {addr.province_state},{" "}
                      {addr.country}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 text-[13px] font-medium text-moss hover:text-moss-deep"
              >
                <Plus size={14} strokeWidth={2} />
                Add a new address
              </button>
            )}

            {showForm && (
              <form
                onSubmit={handleAddAddress}
                className="bg-surface border border-hairline rounded-xl p-5 space-y-3 mt-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Full name"
                    value={form.full_name}
                    onChange={(e) =>
                      setForm({ ...form, full_name: e.target.value })
                    }
                    className={inputClass}
                    required
                  />
                  <input
                    placeholder="Phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className={inputClass}
                    required
                  />
                </div>
                <input
                  placeholder="Street address"
                  value={form.street_address}
                  onChange={(e) =>
                    setForm({ ...form, street_address: e.target.value })
                  }
                  className={inputClass}
                  required
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className={inputClass}
                    required
                  />
                  <input
                    placeholder="Province"
                    value={form.province_state}
                    onChange={(e) =>
                      setForm({ ...form, province_state: e.target.value })
                    }
                    className={inputClass}
                    required
                  />
                  <input
                    placeholder="Postal code"
                    value={form.postal_code}
                    onChange={(e) =>
                      setForm({ ...form, postal_code: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-moss text-white text-[13px] font-medium hover:bg-moss-deep"
                  >
                    Save address
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-lg border border-hairline text-ink text-[13px] font-medium hover:bg-paper"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-stone mb-3">
              Items
            </p>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-[13.5px] text-ink"
                >
                  <span>
                    {item.product?.name} × {item.quantity}
                  </span>
                  <span className="font-mono">
                    ${(item.product?.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-surface border border-hairline rounded-xl p-5 h-fit sticky top-24">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-stone mb-4">
            Order Total
          </p>
          <div className="flex justify-between text-[15px] font-medium text-ink mb-5">
            <span>Total</span>
            <span className="font-mono">${subtotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={placing || items.length === 0}
            className="w-full py-3 rounded-lg bg-moss text-white text-[13.5px] font-medium hover:bg-moss-deep transition-colors disabled:opacity-50"
          >
            {placing ? "Placing order…" : "Place order"}
          </button>
          <p className="text-[11.5px] text-stone text-center mt-3">
            Payment via KHQR coming soon
          </p>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-hairline bg-paper text-[13.5px] focus:outline-none focus:ring-2 focus:ring-moss/30 focus:border-moss";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  Plus,
  MapPin,
  QrCode,
  X,
  Download,
  Copy,
  CheckCircle2,
  Clock3,
  Loader2,
} from "lucide-react";
import api from "../../api/axios";
import { useCart } from "../../context/useCard";
import { useToast } from "../../context/useToast";

export default function Checkout() {
  const { cart, subtotal, refreshCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [placing, setPlacing] = useState(false);

  const [paymentData, setPaymentData] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [secondsLeft, setSecondsLeft] = useState(null);

  const paymentCompletedRef = useRef(false);
  const qrCanvasRef = useRef(null);

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

  const items = cart?.items || [];

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await api.get("/addresses");

        const addressData = Array.isArray(res.data)
          ? res.data
          : res.data.data || [];

        setAddresses(addressData);

        const defaultAddress =
          addressData.find((address) => address.is_default) || addressData[0];

        if (defaultAddress) {
          setSelectedId(defaultAddress.id);
        } else {
          setShowForm(true);
        }
      } catch (error) {
        console.error("Address error:", error);

        showToast(
          error.response?.data?.message || "Failed to load addresses",
          "error",
        );
      }
    };

    fetchAddresses();
  }, [showToast]);

  const handleAddAddress = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/addresses", {
        ...form,
        is_default: addresses.length === 0,
      });

      const newAddress = res.data;

      setAddresses((prev) => [...prev, newAddress]);
      setSelectedId(newAddress.id);
      setShowForm(false);

      setForm({
        type: "home",
        full_name: "",
        phone: "",
        street_address: "",
        city: "",
        province_state: "",
        postal_code: "",
        country: "Cambodia",
      });

      showToast("Address saved successfully", "success");
    } catch (err) {
      console.error("Address error:", err);

      showToast(
        err.response?.data?.message || "Failed to save address",
        "error",
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Start KHQR Payment
  |--------------------------------------------------------------------------
  */

  const handleKhqrPayment = async () => {
    if (placing) return;

    if (showQrModal || paymentData) {
      showToast(
        "A payment is already in progress. Please complete or close it first.",
        "info",
      );
      return;
    }

    if (!selectedId) {
      showToast("Please select a shipping address", "error");
      return;
    }

    if (items.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }

    paymentCompletedRef.current = false;
    setPlacing(true);

    try {
      /*
      |--------------------------------------------------------------
      | STEP 1: Create Order
      |--------------------------------------------------------------
      */

      const orderResponse = await api.post("/orders", {
        address_id: selectedId,
      });

      const order = orderResponse.data;
      const orderId = order.id || order.order?.id || order.data?.id;

      if (!orderId) {
        throw new Error("Order ID was not returned from the server");
      }

      /*
      |--------------------------------------------------------------
      | STEP 2: Generate Bakong KHQR Payment
      |--------------------------------------------------------------
      */

      const paymentResponse = await api.post(`/orders/${orderId}/payment`);
      const result = paymentResponse.data;

      if (!result.qr_string || !result.payment_id) {
        throw new Error(result.message || "KHQR code was not generated");
      }

      /*
      |--------------------------------------------------------------
      | STEP 3: Save Payment Data
      |--------------------------------------------------------------
      */

      setPaymentData({
        payment_id: result.payment_id,
        qr_string: result.qr_string,
        md5: result.md5,
        expires_at: result.expires_at,
        order_id: orderId,
      });

      setPaymentStatus("pending");
      setShowQrModal(true);

      showToast("Scan the QR code with any Bakong-supported app", "success");
    } catch (err) {
      console.error("KHQR Payment Error:", err);

      let errorMessage = "Failed to start KHQR payment";

      if (err.response?.status === 422) {
        const errors = err.response?.data?.errors;
        if (errors && typeof errors === "object") {
          const errorList = Object.values(errors).flat().join(", ");
          errorMessage = `Validation error: ${errorList}`;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.response?.status === 503) {
        errorMessage =
          err.response?.data?.message || "Payment gateway not configured yet";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      showToast(errorMessage, "error");
    } finally {
      setPlacing(false);
    }
  };
  const checkPaymentStatus = async (manual = false) => {
    const paymentId = paymentData?.payment_id;

    if (!paymentId) {
      if (manual) {
        showToast("Payment ID not found", "error");
      }
      return false;
    }

    if (paymentCompletedRef.current) {
      return true;
    }

    if (manual) {
      setCheckingPayment(true);
    }

    try {
      const response = await api.get(`/payments/${paymentId}/status`);
      const result = response.data;

      if (result.status === "paid") {
        if (paymentCompletedRef.current) {
          return true;
        }

        paymentCompletedRef.current = true;
        setPaymentStatus("paid");

        showToast("Payment completed successfully!", "success");

        await refreshCart();

        setTimeout(() => {
          setShowQrModal(false);
          setPaymentData(null);

          navigate(`/payment/success?order_id=${paymentData?.order_id}`);
        }, 800);

        return true;
      }

      if (result.status === "expired") {
        setPaymentStatus("expired");

        if (manual) {
          showToast("This QR code has expired. Please try again.", "error");
        }

        return false;
      }

      setPaymentStatus("pending");

      if (manual) {
        showToast(
          "Payment is still pending. Please complete payment first.",
          "info",
        );
      }

      return false;
    } catch (error) {
      console.error("Payment check error:", error);

      if (manual) {
        showToast(
          error.response?.data?.message || "Failed to check payment status",
          "error",
        );
      }

      return false;
    } finally {
      if (manual) {
        setCheckingPayment(false);
      }
    }
  };
  useEffect(() => {
    if (!showQrModal || !paymentData?.payment_id || paymentStatus === "paid") {
      return;
    }

    const interval = setInterval(() => {
      checkPaymentStatus(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [showQrModal, paymentData?.payment_id, paymentStatus]);

  /*
  |--------------------------------------------------------------------------
  | Countdown Timer
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !showQrModal ||
      !paymentData?.expires_at ||
      paymentStatus !== "pending"
    ) {
      return;
    }

    const expiresAt = new Date(paymentData.expires_at).getTime();

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.floor((expiresAt - Date.now()) / 1000),
      );
      setSecondsLeft(remaining);

      if (remaining === 0) {
        setPaymentStatus("expired");
      }
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [showQrModal, paymentData?.expires_at, paymentStatus]);

  /*
  |--------------------------------------------------------------------------
  | Close Payment Modal
  |--------------------------------------------------------------------------
  */

  const handleClosePayment = () => {
    if (checkingPayment) return;

    setShowQrModal(false);
    setPaymentData(null);
    setPaymentStatus("pending");
    setSecondsLeft(null);

    paymentCompletedRef.current = false;
  };

  const handleCopyQr = async () => {
    if (!paymentData?.qr_string) {
      showToast("QR string is not available", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(paymentData.qr_string);
      showToast("KHQR payment string copied", "success");
    } catch (error) {
      showToast("Failed to copy QR code", "error");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Download QR Image (rendered client-side canvas -> PNG)
  |--------------------------------------------------------------------------
  */

  const handleDownloadQr = () => {
    const canvas = qrCanvasRef.current?.querySelector("canvas");

    if (!canvas) {
      showToast("QR image is not available", "error");
      return;
    }

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `khqr-payment-${paymentData?.payment_id || Date.now()}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (secs) => {
    if (secs === null) return "";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-display text-[28px] font-medium text-ink mb-8">
        Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-8">
          {/* SHIPPING ADDRESS */}
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-stone mb-3">
              Shipping Address
            </p>

            <div className="space-y-2 mb-3">
              {addresses.map((addr) => (
                <button
                  type="button"
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

                    <p className="text-[12.5px] text-stone mt-1">
                      {addr.street_address}, {addr.city}, {addr.province_state},{" "}
                      {addr.country}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {!showForm && (
              <button
                type="button"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    Save Address
                  </button>

                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 rounded-lg border border-hairline text-ink text-[13px] font-medium hover:bg-paper"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* ORDER ITEMS */}
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-stone mb-3">
              Order Items
            </p>

            <div className="bg-surface border border-hairline rounded-xl divide-y divide-hairline">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-4 text-[13.5px]"
                >
                  <div>
                    <p className="font-medium text-ink">
                      {item.product?.name || "Product"}
                    </p>

                    <p className="text-[12px] text-stone mt-1">
                      Quantity: {item.quantity}
                    </p>
                  </div>

                  <span className="font-mono text-ink">
                    $
                    {(
                      Number(item.product?.price || 0) *
                      Number(item.quantity || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ORDER SUMMARY */}
        <div className="bg-surface border border-hairline rounded-xl p-5 h-fit lg:sticky lg:top-24">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-stone mb-4">
            Order Summary
          </p>

          <div className="space-y-3 mb-5">
            <div className="flex justify-between text-[13px] text-stone">
              <span>Items</span>
              <span>{items.length}</span>
            </div>

            <div className="border-t border-hairline pt-4 flex justify-between text-[16px] font-medium text-ink">
              <span>Total</span>
              <span className="font-mono">
                ${Number(subtotal || 0).toFixed(2)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleKhqrPayment}
            disabled={
              placing || items.length === 0 || !selectedId || showQrModal
            }
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-moss text-white text-[13.5px] font-medium hover:bg-moss-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {placing ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <QrCode size={17} />
            )}

            {placing ? "Generating QR..." : "Pay with KHQR"}
          </button>

          <p className="text-[11.5px] text-stone text-center mt-3 leading-relaxed">
            Scan with any banking app that supports Bakong KHQR
          </p>
        </div>
      </div>

      {/* KHQR MODAL */}
      {showQrModal && paymentData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            {/* HEADER */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[20px] font-medium text-ink">
                  Scan to Pay
                </h2>

                <p className="text-[12px] text-stone mt-1">
                  Complete payment with any Bakong app
                </p>
              </div>

              <button
                type="button"
                onClick={handleClosePayment}
                disabled={checkingPayment}
                className="p-2 hover:bg-paper rounded-lg transition-colors disabled:opacity-50"
              >
                <X size={20} className="text-stone" />
              </button>
            </div>

            {/* QR IMAGE */}
            <div
              ref={qrCanvasRef}
              className="bg-paper p-5 rounded-xl flex justify-center"
            >
              {paymentData.qr_string ? (
                <QRCodeCanvas
                  value={paymentData.qr_string}
                  size={256}
                  level="M"
                  includeMargin
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-stone text-sm">
                  QR code not available
                </div>
              )}
            </div>

            {/* PAYMENT STATUS */}
            <div className="text-center">
              {paymentStatus === "paid" ? (
                <div className="flex items-center justify-center gap-2 text-moss">
                  <CheckCircle2 size={18} />
                  <span className="text-[13px] font-medium">
                    Payment Successful
                  </span>
                </div>
              ) : paymentStatus === "expired" ? (
                <p className="text-[12px] uppercase tracking-[0.08em] font-medium text-clay">
                  QR Code Expired
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-1.5 text-stone">
                    <Clock3 size={13} strokeWidth={1.75} />
                    <p className="text-[12px] uppercase tracking-[0.08em] font-medium">
                      Waiting for Payment
                      {secondsLeft !== null && ` · ${formatTime(secondsLeft)}`}
                    </p>
                  </div>

                  <p className="text-[11.5px] text-stone mt-2">
                    Checking automatically every 5 seconds
                  </p>
                </>
              )}

              <p className="text-[12px] text-stone mt-3 break-all">
                Reference: {paymentData.md5}
              </p>
            </div>

            {/* CHECK PAYMENT */}
            <button
              type="button"
              onClick={() => checkPaymentStatus(true)}
              disabled={
                checkingPayment ||
                paymentStatus === "paid" ||
                paymentStatus === "expired"
              }
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-moss text-moss text-[13px] font-medium rounded-lg hover:bg-moss-tint transition-colors disabled:opacity-50"
            >
              {checkingPayment && (
                <Loader2 size={16} className="animate-spin" />
              )}

              {checkingPayment
                ? "Checking Payment..."
                : "I Have Completed Payment"}
            </button>

            {/* COPY / DOWNLOAD */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyQr}
                className="flex items-center justify-center gap-2 flex-1 py-2.5 px-3 border border-hairline rounded-lg hover:bg-paper transition-colors"
              >
                <Copy size={14} />
                <span className="text-[12px] font-medium text-ink">Copy</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQr}
                className="flex items-center justify-center gap-2 flex-1 py-2.5 px-3 border border-hairline rounded-lg hover:bg-paper transition-colors"
              >
                <Download size={14} />
                <span className="text-[12px] font-medium text-ink">
                  Download
                </span>
              </button>
            </div>

            {/* CLOSE */}
            <button
              type="button"
              onClick={handleClosePayment}
              disabled={checkingPayment}
              className="w-full py-2.5 px-4 text-ink text-[13px] font-medium rounded-lg border border-hairline hover:bg-paper transition-colors disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-hairline bg-paper text-[13.5px] focus:outline-none focus:ring-2 focus:ring-moss/30 focus:border-moss";

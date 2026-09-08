import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  Plus,
  MapPin,
  Pencil,
  Trash2,
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
import khqrLogoRed from "../../assets/KHQR Logo red.svg";
import khqrLogoWhite from "../../assets/KHQR Logo.svg";
import khqrBadgeBg from "../../assets/KHQR available here - logo with bg.svg";

export default function Checkout() {
  const { cart, subtotal, refreshCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [locationCodes, setLocationCodes] = useState({
    province: "",
    district: "",
  });
  const [placing, setPlacing] = useState(false);

  const [paymentData, setPaymentData] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [cancellingPayment, setCancellingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [secondsLeft, setSecondsLeft] = useState(null);

  const paymentCompletedRef = useRef(false);
  const qrCanvasRef = useRef(null);

  const [form, setForm] = useState({
    full_name: "",
    telephone: "",
    city_province: "",
    district: "",
    commune: "",
    street: "",
    label: "",
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

  useEffect(() => {
    api
      .get("/locations/provinces")
      .then((res) => setProvinces(res.data))
      .catch((error) => console.error("Province error:", error));
  }, []);

  const resetAddressForm = () => {
    setForm({
      full_name: "",
      telephone: "",
      city_province: "",
      district: "",
      commune: "",
      street: "",
      label: "",
    });
    setLocationCodes({ province: "", district: "" });
    setDistricts([]);
    setCommunes([]);
    setEditingAddressId(null);
  };

  const loadDistricts = async (provinceCode) => {
    const res = await api.get(`/locations/provinces/${provinceCode}/districts`);
    setDistricts(res.data);
    return res.data;
  };

  const loadCommunes = async (districtCode) => {
    const res = await api.get(`/locations/districts/${districtCode}/communes`);
    setCommunes(res.data);
    return res.data;
  };

  const handleProvinceChange = async (e) => {
    const province = provinces.find((item) => item.code === e.target.value);
    setLocationCodes({ province: province?.code || "", district: "" });
    setForm((prev) => ({
      ...prev,
      city_province: province?.name_en || "",
      district: "",
      commune: "",
    }));
    setCommunes([]);
    setDistricts([]);

    if (province) {
      try {
        await loadDistricts(province.code);
      } catch (error) {
        console.error("District error:", error);
        showToast("Failed to load districts", "error");
      }
    }
  };

  const handleDistrictChange = async (e) => {
    const district = districts.find((item) => item.code === e.target.value);
    setLocationCodes((prev) => ({ ...prev, district: district?.code || "" }));
    setForm((prev) => ({
      ...prev,
      district: district?.name_en || "",
      commune: "",
    }));
    setCommunes([]);

    if (district) {
      try {
        await loadCommunes(district.code);
      } catch (error) {
        console.error("Commune error:", error);
        showToast("Failed to load communes", "error");
      }
    }
  };

  const handleCommuneChange = (e) => {
    const commune = communes.find((item) => item.code === e.target.value);
    setForm((prev) => ({ ...prev, commune: commune?.name_en || "" }));
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...form,
        ...(editingAddressId ? {} : { is_default: addresses.length === 0 }),
      };
      const res = editingAddressId
        ? await api.put(`/addresses/${editingAddressId}`, payload)
        : await api.post("/addresses", payload);
      const savedAddress = res.data;

      setAddresses((prev) =>
        editingAddressId
          ? prev.map((address) =>
              address.id === savedAddress.id ? savedAddress : address,
            )
          : [...prev, savedAddress],
      );
      setSelectedId(savedAddress.id);
      setShowForm(false);
      resetAddressForm();
      showToast(
        editingAddressId
          ? "Address updated successfully"
          : "Address saved successfully",
        "success",
      );
    } catch (err) {
      console.error("Address error:", err);

      showToast(
        err.response?.data?.message || "Failed to save address",
        "error",
      );
    }
  };

  const handleEditAddress = async (address) => {
    setEditingAddressId(address.id);
    setForm({
      full_name: address.full_name || "",
      telephone: address.telephone || "",
      city_province: address.city_province || "",
      district: address.district || "",
      commune: address.commune || "",
      street: address.street || "",
      label: address.label || "",
    });
    setShowForm(true);

    const province = provinces.find(
      (item) => item.name_en === address.city_province,
    );
    if (!province) {
      setLocationCodes({ province: "", district: "" });
      setDistricts([]);
      setCommunes([]);
      return;
    }

    try {
      const loadedDistricts = await loadDistricts(province.code);
      const district = loadedDistricts.find(
        (item) => item.name_en === address.district,
      );
      setLocationCodes({
        province: province.code,
        district: district?.code || "",
      });

      if (district) {
        await loadCommunes(district.code);
      } else {
        setCommunes([]);
      }
    } catch (error) {
      console.error("Address location error:", error);
      showToast("Failed to load address locations", "error");
    }
  };

  const handleDeleteAddress = async (address) => {
    if (!window.confirm(`Delete the address for ${address.full_name}?`)) return;

    try {
      await api.delete(`/addresses/${address.id}`);
      const remainingAddresses = addresses.filter(
        (item) => item.id !== address.id,
      );
      setAddresses(remainingAddresses);

      if (selectedId === address.id) {
        setSelectedId(remainingAddresses[0]?.id || null);
      }

      showToast("Address deleted", "success");
    } catch (error) {
      console.error("Address deletion error:", error);
      showToast(
        error.response?.data?.message || "Failed to delete address",
        "error",
      );
    }
  };

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
      const orderResponse = await api.post("/orders", {
        address_id: selectedId,
      });

      const order = orderResponse.data;
      const orderId = order.id || order.order?.id || order.data?.id;

      if (!orderId) {
        throw new Error("Order ID was not returned from the server");
      }

      const paymentResponse = await api.post(`/orders/${orderId}/payment`);
      const result = paymentResponse.data;

      if (!result.qr_string || !result.payment_id) {
        throw new Error(result.message || "KHQR code was not generated");
      }

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
      const result = response.data?.data || response.data;
      const status = String(
        result?.status || result?.payment_status || "",
      ).toLowerCase();

      if (status === "paid" || status === "success" || status === "completed") {
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

          navigate(`/orders`);
        }, 1600);

        return true;
      }

      if (status === "expired") {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQrModal, paymentData?.payment_id, paymentStatus]);

  useEffect(() => {
    if (
      !showQrModal ||
      !paymentData?.expires_at ||
      paymentStatus !== "pending"
    ) {
      return;
    }

    const rawExpiry = String(paymentData.expires_at);
    const expiresAt = /^\d+$/.test(rawExpiry)
      ? Number(rawExpiry) * (rawExpiry.length <= 3 ? 1000 : 1)
      : Date.parse(
          /(?:Z|[+-]\d{2}:?\d{2})$/i.test(rawExpiry)
            ? rawExpiry
            : `${rawExpiry.replace(" ", "T")}Z`,
        );

    if (Number.isNaN(expiresAt)) {
      console.error("Invalid KHQR expiry time:", paymentData.expires_at);
      setSecondsLeft(null);
      return;
    }

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

  const handleClosePayment = async () => {
    if (checkingPayment || cancellingPayment) return;
    if (paymentData?.payment_id && paymentStatus !== "paid") {
      setCancellingPayment(true);

      try {
        await api.post(`/payments/${paymentData.payment_id}/cancel`);
        await refreshCart();
      } catch (error) {
        console.error("Payment cancellation error:", error);
        showToast(
          error.response?.data?.message ||
            "Failed to cancel payment. Please try again.",
          "error",
        );
        return;
      } finally {
        setCancellingPayment(false);
      }
    }

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
    } catch {
      showToast("Failed to copy QR code", "error");
    }
  };

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

  const isExpiringSoon = secondsLeft !== null && secondsLeft <= 60;

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
                <div
                  key={addr.id}
                  onClick={() => setSelectedId(addr.id)}
                  className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
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

                  <div className="hidden">
                    <p className="text-[13.5px] font-medium text-ink">
                      {addr.full_name} · {addr.phone}
                    </p>

                    <p className="text-[12.5px] text-stone mt-1">
                      {addr.street_address}, {addr.city}, {addr.province_state},{" "}
                      {addr.country}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-[13.5px] font-medium text-ink">
                      {addr.full_name} · {addr.telephone}
                      {addr.label && ` (${addr.label})`}
                    </p>
                    <p className="text-[12.5px] text-stone mt-1">
                      {addr.street}, {addr.commune}, {addr.district},{" "}
                      {addr.city_province}
                    </p>
                  </div>
                  <div
                    className="ml-auto flex gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleEditAddress(addr)}
                      className="p-1.5 text-stone hover:text-moss"
                      aria-label={`Edit address for ${addr.full_name}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr)}
                      className="p-1.5 text-stone hover:text-clay"
                      aria-label={`Delete address for ${addr.full_name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
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
                    placeholder="Telephone"
                    value={form.telephone}
                    onChange={(e) =>
                      setForm({ ...form, telephone: e.target.value })
                    }
                    className={inputClass}
                    required
                  />
                </div>

                <input
                  placeholder="Street / house number"
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  className={inputClass}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={locationCodes.province}
                    onChange={handleProvinceChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Select province</option>
                    {provinces.map((province) => (
                      <option key={province.id} value={province.code}>
                        {province.name_en}
                      </option>
                    ))}
                  </select>

                  <select
                    value={locationCodes.district}
                    onChange={handleDistrictChange}
                    className={inputClass}
                    disabled={!locationCodes.province}
                    required
                  >
                    <option value="">Select district</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.code}>
                        {district.name_en}
                      </option>
                    ))}
                  </select>

                  <select
                    value={
                      communes.find((item) => item.name_en === form.commune)
                        ?.code || ""
                    }
                    onChange={handleCommuneChange}
                    className={inputClass}
                    disabled={!locationCodes.district}
                    required
                  >
                    <option value="">Select commune</option>
                    {communes.map((commune) => (
                      <option key={commune.id} value={commune.code}>
                        {commune.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  placeholder="Label (e.g. Home or Work)"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className={inputClass}
                />

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-moss text-white text-[13px] font-medium hover:bg-moss-deep"
                  >
                    {editingAddressId ? "Update Address" : "Save Address"}
                  </button>

                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        resetAddressForm();
                      }}
                      className="px-4 py-2 rounded-lg border border-hairline text-ink text-[13px] font-medium hover:bg-paper"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* PAYMENT METHOD */}
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-stone mb-3">
              Payment Method
            </p>

            <div className="bg-surface border-2 border-moss/40 rounded-xl p-4.5 relative overflow-hidden transition-all shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-moss">
                    <div className="h-2 w-2 rounded-full bg-moss" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[14px] text-ink">
                        Bakong KHQR
                      </span>
                      <span className="rounded-full bg-moss-tint px-2 py-0.5 text-[11px] font-medium text-moss">
                        Instant
                      </span>
                    </div>

                    <p className="text-[12.5px] text-stone mt-1 leading-relaxed">
                      Scan and pay with any Cambodian mobile banking app supporting Bakong KHQR.
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-hairline/60">
                      <span className="text-[11px] text-stone font-medium mr-1">
                        Works with:
                      </span>
                      <span className="px-2 py-0.5 rounded bg-paper text-[11px] font-medium text-stone">
                        Bakong
                      </span>
                      <span className="px-2 py-0.5 rounded bg-paper text-[11px] font-medium text-stone">
                        ABA Mobile
                      </span>
                      <span className="px-2 py-0.5 rounded bg-paper text-[11px] font-medium text-stone">
                        ACLEDA
                      </span>
                      <span className="px-2 py-0.5 rounded bg-paper text-[11px] font-medium text-stone">
                        Wing Bank
                      </span>
                      <span className="px-2 py-0.5 rounded bg-paper text-[11px] font-medium text-stone">
                        +30 Banks
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <img
                    src={khqrBadgeBg}
                    alt="KHQR Available Here"
                    className="h-9 w-auto object-contain rounded-md shadow-2xs"
                  />
                </div>
              </div>
            </div>
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
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-[#E1232E] hover:bg-[#C81A24] text-white text-[14px] font-medium transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {placing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <img
                src={khqrLogoWhite}
                alt="KHQR"
                className="h-5 w-auto object-contain"
              />
            )}

            <span>{placing ? "Generating QR..." : "Pay with KHQR"}</span>
          </button>

          <div className="flex items-center justify-center gap-1.5 mt-3 text-center">
            <span className="text-[11px] text-stone">Powered by</span>
            <img
              src={khqrLogoRed}
              alt="KHQR"
              className="h-3 w-auto object-contain opacity-85"
            />
            <span className="text-[11px] text-stone">· Official Bakong Network</span>
          </div>
        </div>
      </div>

      {/* KHQR MODAL */}
      {showQrModal && paymentData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-surface rounded-3xl max-w-[380px] w-full shadow-2xl overflow-hidden border border-hairline my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* OFFICIAL KHQR STAND CARD */}
            <div className="relative bg-surface">
              {/* TOP KHQR RED BANNER */}
              <div className="relative bg-[#E1232E] px-6 pt-5 pb-4 text-white overflow-hidden">
                <div className="flex items-center justify-between">
                  <img
                    src={khqrLogoWhite}
                    alt="Bakong KHQR"
                    className="h-7 w-auto object-contain drop-shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={handleClosePayment}
                    disabled={checkingPayment || cancellingPayment}
                    className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors disabled:opacity-50 text-white"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* MERCHANT & ORDER AMOUNT */}
              <div className="px-6 pt-4 pb-1 text-center">
                <p className="text-[13px] font-semibold text-ink uppercase tracking-wider">
                  Botaniq Store
                </p>
                <div className="mt-1 flex items-baseline justify-center gap-1">
                  <span className="text-[19px] font-semibold text-ink">$</span>
                  <span className="font-mono text-[32px] font-bold tracking-tight text-ink leading-none">
                    {Number(subtotal || 0).toFixed(2)}
                  </span>
                  <span className="text-[12px] font-medium text-stone uppercase ml-0.5">
                    USD
                  </span>
                </div>
              </div>

              {/* TICKET-STYLE DASHED DIVIDER */}
              <div className="relative flex items-center justify-between my-2 px-3">
                <div className="w-3 h-5 bg-black/15 dark:bg-black/40 rounded-r-full -ml-3" />
                <div className="flex-1 border-t-2 border-dashed border-hairline mx-2" />
                <div className="w-3 h-5 bg-black/15 dark:bg-black/40 rounded-l-full -mr-3" />
              </div>

              {/* QR BODY: ACTIVE QR OR SUCCESS */}
              <div className="px-6 pb-4">
                {paymentStatus === "paid" ? (
                  <div className="rounded-2xl border border-moss/20 bg-moss-tint px-6 py-10 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-moss text-white shadow-sm">
                      <CheckCircle2 size={36} strokeWidth={2} />
                    </div>
                    <h3 className="mt-4 text-[17px] font-semibold text-ink">
                      Payment Successful!
                    </h3>
                    <p className="mt-1 text-[12px] text-stone">
                      Thank you for your order.
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2 text-[12px] text-moss font-medium">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Preparing your receipt...</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    {/* DYNAMIC QR CANVAS */}
                    <div
                      ref={qrCanvasRef}
                      className="p-3 bg-white rounded-2xl shadow-xs border border-hairline/80 flex items-center justify-center"
                    >
                      {paymentData.qr_string ? (
                        <QRCodeCanvas
                          value={paymentData.qr_string}
                          size={220}
                          level="M"
                          marginSize={1}
                        />
                      ) : (
                        <div className="w-[220px] h-[220px] flex items-center justify-center text-stone text-xs">
                          QR code not available
                        </div>
                      )}
                    </div>

                    {/* OFFICIAL FOOTER BRANDING */}
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <img
                        src={khqrLogoRed}
                        alt="KHQR"
                        className="h-4 w-auto object-contain"
                      />
                      <span className="text-[11.5px] text-stone font-medium">
                        Scan with any KHQR banking app
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-1 mt-1.5 text-[10px] text-stone/80">
                      <span>Bakong</span>
                      <span>·</span>
                      <span>ABA</span>
                      <span>·</span>
                      <span>ACLEDA</span>
                      <span>·</span>
                      <span>Wing</span>
                      <span>·</span>
                      <span>Canadia</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* STATUS, COUNTDOWN & ACTIONS */}
            <div className="bg-paper px-6 py-4 border-t border-hairline space-y-3">
              {paymentStatus !== "paid" && (
                <>
                  {/* COUNTDOWN */}
                  {paymentStatus === "expired" ? (
                    <div className="rounded-xl border border-clay/30 bg-clay-tint px-3 py-2 text-center text-[12px] font-medium text-clay">
                      This QR code has expired. Please close and try again.
                    </div>
                  ) : (
                    <div
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${
                        isExpiringSoon
                          ? "border-clay/30 bg-clay-tint text-clay"
                          : "border-moss/20 bg-moss-tint text-moss-deep"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock3 size={15} strokeWidth={2} />
                        <span className="text-[11px] font-medium uppercase tracking-wider">
                          {isExpiringSoon ? "Expires soon" : "Time remaining"}
                        </span>
                      </div>
                      <span className="font-mono text-[16px] font-semibold tracking-wider">
                        {secondsLeft !== null ? formatTime(secondsLeft) : "--:--"}
                      </span>
                    </div>
                  )}

                  {/* AUTO-CHECK INDICATOR */}
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-moss opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-moss"></span>
                    </span>
                    <span>Checking payment automatically every 5s</span>
                  </div>

                  {/* REFERENCE MD5 */}
                  <p
                    className="text-[11px] text-stone text-center truncate px-2"
                    title={paymentData.md5}
                  >
                    Ref: <span className="font-mono text-ink/70">{paymentData.md5}</span>
                  </p>

                  {/* MANUAL VERIFY BUTTON */}
                  <button
                    type="button"
                    onClick={() => checkPaymentStatus(true)}
                    disabled={checkingPayment || paymentStatus === "expired"}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-moss text-white text-[13px] font-medium hover:bg-moss-deep transition-colors shadow-xs disabled:opacity-50"
                  >
                    {checkingPayment && (
                      <Loader2 size={16} className="animate-spin" />
                    )}
                    <span>
                      {checkingPayment
                        ? "Verifying Payment..."
                        : "I Have Completed Payment"}
                    </span>
                  </button>

                  {/* COPY & DOWNLOAD BUTTONS */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyQr}
                      className="flex items-center justify-center gap-1.5 flex-1 py-2.5 px-3 border border-hairline bg-surface rounded-xl hover:bg-paper text-ink text-[12px] font-medium transition-colors"
                    >
                      <Copy size={13} />
                      <span>Copy KHQR</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="flex items-center justify-center gap-1.5 flex-1 py-2.5 px-3 border border-hairline bg-surface rounded-xl hover:bg-paper text-ink text-[12px] font-medium transition-colors"
                    >
                      <Download size={13} />
                      <span>Download QR</span>
                    </button>
                  </div>
                </>
              )}

              {/* CANCEL / CLOSE */}
              <button
                type="button"
                onClick={handleClosePayment}
                disabled={checkingPayment || cancellingPayment}
                className="w-full py-2 text-stone hover:text-ink text-[12.5px] font-medium transition-colors disabled:opacity-50"
              >
                {cancellingPayment ? "Cancelling payment..." : "Cancel & Return to Cart"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-hairline bg-paper text-[13.5px] focus:outline-none focus:ring-2 focus:ring-moss/30 focus:border-moss";

import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, X, UserRound } from "lucide-react";
import api from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import { ToastContext } from "../../context/ToastContext";
import { ConfirmContext } from "../../context/ConfirmContext";
import AddressFormModal from "../../components/storefront/AddressFormModal";

const NAV = [
  { key: "account", label: "Account details" },
  { key: "security", label: "Password & security" },
  { key: "addresses", label: "Addresses" },
];

function Field({ label, value, onChange, type = "text", error, ...rest }) {
  return (
    <label className="block mb-5">
      <span
        className="text-sm block mb-1.5"
        style={{ color: "var(--color-stone)" }}
      >
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={onChange}
        {...rest}
        className="w-full px-3 py-2.5 text-sm rounded-sm outline-none transition-colors"
        style={{
          backgroundColor: "var(--color-paper)",
          border: `1px solid ${
            error ? "var(--color-clay)" : "var(--color-hairline)"
          }`,
          color: "var(--color-ink)",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--color-moss)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error
            ? "var(--color-clay)"
            : "var(--color-hairline)";
        }}
      />

      {error && (
        <span
          className="text-xs mt-1 block"
          style={{ color: "var(--color-clay)" }}
        >
          {error}
        </span>
      )}
    </label>
  );
}

function SectionCard({ title, description, children }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl mb-1" style={{ fontFamily: "Fraunces, serif" }}>
        {title}
      </h2>

      {description && (
        <p className="text-sm mb-6" style={{ color: "var(--color-stone)" }}>
          {description}
        </p>
      )}

      {children}
    </div>
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="px-5 py-2.5 text-sm rounded-sm transition-opacity hover:opacity-90 disabled:opacity-50"
      style={{
        backgroundColor: "var(--color-moss)",
        color: "var(--color-paper)",
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="px-5 py-2.5 text-sm rounded-sm border transition-colors hover:bg-[var(--color-paper)]"
      style={{
        borderColor: "var(--color-hairline)",
        color: "var(--color-ink)",
      }}
    >
      {children}
    </button>
  );
}

function fieldErrors(err) {
  return err?.response?.data?.errors
    ? Object.fromEntries(
        Object.entries(err.response.data.errors).map(([k, v]) => [k, v[0]]),
      )
    : {};
}

export default function Profile() {
  const { user, updateProfile, updatePassword, logout } =
    useContext(AuthContext);

  const { showToast } = useContext(ToastContext);
  const { confirm } = useContext(ConfirmContext);
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  const [active, setActive] = useState("account");

  // ─────────────────────────────────────────────
  // Account
  // ─────────────────────────────────────────────

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  // Profile image
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });

      setImagePreview(user.profile_image || user.avatar || null);
      setProfileImage(null);
      setRemoveImage(false);
    }
  }, [user]);

  // ─────────────────────────────────────────────
  // Select image
  // ─────────────────────────────────────────────

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      showToast?.("Please select an image file", "error");
      return;
    }

    // Validate size - 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast?.("Image must be smaller than 5MB", "error");
      return;
    }

    setProfileImage(file);
    setRemoveImage(false);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  // ─────────────────────────────────────────────
  // Remove image
  // ─────────────────────────────────────────────

  const handleRemoveImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    setRemoveImage(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ─────────────────────────────────────────────
  // Save profile
  // ─────────────────────────────────────────────

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    setSavingProfile(true);
    setFormErrors({});

    try {
      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);

      if (profileImage) {
        formData.append("profile_image", profileImage);
      }

      if (removeImage) {
        formData.append("remove_profile_image", "1");
      }

      await updateProfile(formData);

      showToast?.("Profile updated", "success");

      setProfileImage(null);
      setRemoveImage(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setFormErrors(fieldErrors(err));

      showToast?.(
        err?.response?.data?.message || "Couldn't update profile",
        "error",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // ─────────────────────────────────────────────
  // Password
  // ─────────────────────────────────────────────

  const [pw, setPw] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    setSavingPw(true);
    setPwErrors({});

    try {
      await updatePassword(pw);

      setPw({
        current_password: "",
        password: "",
        password_confirmation: "",
      });

      showToast?.("Password updated", "success");
    } catch (err) {
      setPwErrors(fieldErrors(err));

      showToast?.("Couldn't update password", "error");
    } finally {
      setSavingPw(false);
    }
  };

  // ─────────────────────────────────────────────
  // Addresses
  // ─────────────────────────────────────────────
   
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const loadAddresses = useCallback(async () => {
    setLoadingAddresses(true);

    try {
      const res = await api.get("/addresses");

      setAddresses(res.data?.data || res.data);
    } catch {
      showToast?.("Couldn't load addresses", "error");
    } finally {
      setLoadingAddresses(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (active === "addresses") {
      loadAddresses();
    }
  }, [active, loadAddresses]);

  const handleSaveAddress = async (data) => {
    if (editingAddress) {
      await api.put(`/addresses/${editingAddress.id}`, data);
    } else {
      await api.post("/addresses", data);
    }

    await loadAddresses();

    showToast?.(
      editingAddress ? "Address updated" : "Address added",
      "success",
    );
  };

  const handleDeleteAddress = async (address) => {
    const ok = await confirm(
      `Remove "${address.label || address.full_name}"?`,
      {
        title: "Remove address",
        confirmLabel: "Remove",
      },
    );

    if (!ok) return;

    try {
      await api.delete(`/addresses/${address.id}`);

      setAddresses((prev) => prev.filter((a) => a.id !== address.id));

      showToast?.("Address removed", "success");
    } catch {
      showToast?.("Couldn't remove address", "error");
    }
  };

  // ─────────────────────────────────────────────
  // Sign out
  // ─────────────────────────────────────────────

  const handleSignOut = async () => {
    const ok = await confirm(
      "You'll need to sign in again to see your orders.",
      {
        title: "Sign out?",
        confirmLabel: "Sign out",
      },
    );

    if (!ok) return;

    await logout();

    navigate("/login");
  };

  if (!user) return null;

  const initial = (user.name || "").trim().charAt(0).toUpperCase();

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--color-paper)",
        color: "var(--color-ink)",
      }}
    >
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* ─────────────────────────────────────
            Profile Header
        ───────────────────────────────────── */}

        <div className="flex items-center gap-4 mb-12">
          <div className="relative group shrink-0">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
              style={{
                backgroundColor: "var(--color-moss)",
                color: "var(--color-paper)",
              }}
            >
              {imagePreview && !removeImage ? (
                <img
                  src={imagePreview}
                  alt={user.name || "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span
                  className="text-xl"
                  style={{
                    fontFamily: "Fraunces, serif",
                  }}
                >
                  {initial || <UserRound size={24} />}
                </span>
              )}
            </div>

            {/* Camera button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={savingProfile}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-transform hover:scale-105 disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-paper)",
                color: "var(--color-ink)",
              }}
              title="Change profile photo"
            >
              <Camera size={13} strokeWidth={2} />
            </button>

            {/* Hidden input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <div>
            <h1
              className="text-2xl"
              style={{
                fontFamily: "Fraunces, serif",
              }}
            >
              {user.name}
            </h1>

            <p
              className="text-sm mt-0.5"
              style={{
                color: "var(--color-stone)",
              }}
            >
              {user.email}
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs mt-1.5 hover:opacity-70 transition-opacity"
              style={{
                color: "var(--color-moss)",
              }}
            >
              Change photo
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────
            Layout
        ───────────────────────────────────── */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Navigation */}
          <nav className="md:col-span-1">
            <ul className="sticky top-6 space-y-1">
              {NAV.map((item) => (
                <li key={item.key}>
                  <button
                    onClick={() => setActive(item.key)}
                    className="w-full text-left px-3 py-2 text-sm rounded-sm transition-colors"
                    style={{
                      backgroundColor:
                        active === item.key
                          ? "var(--color-surface)"
                          : "transparent",
                      color:
                        active === item.key
                          ? "var(--color-ink)"
                          : "var(--color-stone)",
                      border:
                        active === item.key
                          ? "1px solid var(--color-hairline)"
                          : "1px solid transparent",
                    }}
                  >
                    {item.label}
                  </button>
                </li>
              ))}

              <li
                className="pt-3 mt-3"
                style={{
                  borderTop: "1px solid var(--color-hairline)",
                }}
              >
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 text-sm rounded-sm transition-colors hover:opacity-70"
                  style={{
                    color: "var(--color-clay)",
                  }}
                >
                  Sign out
                </button>
              </li>
            </ul>
          </nav>

          {/* Content */}
          <div className="md:col-span-3">
            {/* ACCOUNT */}
            {active === "account" && (
              <SectionCard
                title="Account details"
                description="Keep your contact details up to date so we can reach you about your orders."
              >
                <form onSubmit={handleSaveProfile}>
                  {/* Profile photo */}
                  <div className="mb-7">
                    <span
                      className="text-sm block mb-3"
                      style={{
                        color: "var(--color-stone)",
                      }}
                    >
                      Profile photo
                    </span>

                    <div className="flex items-center gap-4">
                      <div
                        className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
                        style={{
                          backgroundColor: "var(--color-moss)",
                          color: "var(--color-paper)",
                        }}
                      >
                        {imagePreview && !removeImage ? (
                          <img
                            src={imagePreview}
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span
                            className="text-2xl"
                            style={{
                              fontFamily: "Fraunces, serif",
                            }}
                          >
                            {initial}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 text-sm rounded-sm border transition-colors hover:bg-[var(--color-paper)]"
                          style={{
                            borderColor: "var(--color-hairline)",
                            color: "var(--color-ink)",
                          }}
                        >
                          Choose image
                        </button>

                        {(imagePreview || profileImage) && (
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="w-9 h-9 flex items-center justify-center rounded-sm border transition-colors hover:bg-[var(--color-paper)]"
                            style={{
                              borderColor: "var(--color-hairline)",
                              color: "var(--color-clay)",
                            }}
                            title="Remove photo"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    <p
                      className="text-xs mt-2"
                      style={{
                        color: "var(--color-stone)",
                      }}
                    >
                      JPG, PNG or WebP. Maximum 5MB.
                    </p>
                  </div>

                  <Field
                    label="Full name"
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                    error={formErrors.name}
                  />

                  <Field
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        email: e.target.value,
                      })
                    }
                    error={formErrors.email}
                  />

                  <Field
                    label="Phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        phone: e.target.value,
                      })
                    }
                    error={formErrors.phone}
                  />

                  <div className="flex gap-3 mt-2">
                    <PrimaryButton type="submit" disabled={savingProfile}>
                      {savingProfile ? "Saving…" : "Save changes"}
                    </PrimaryButton>
                  </div>
                </form>
              </SectionCard>
            )}

            {active === "security" && (
              <SectionCard
                title="Password & security"
                description="Choose a strong password you don't use elsewhere."
              >
                <form onSubmit={handleUpdatePassword}>
                  <Field
                    label="Current password"
                    type="password"
                    value={pw.current_password}
                    onChange={(e) =>
                      setPw({
                        ...pw,
                        current_password: e.target.value,
                      })
                    }
                    error={pwErrors.current_password}
                  />

                  <Field
                    label="New password"
                    type="password"
                    value={pw.password}
                    onChange={(e) =>
                      setPw({
                        ...pw,
                        password: e.target.value,
                      })
                    }
                    error={pwErrors.password}
                  />

                  <Field
                    label="Confirm new password"
                    type="password"
                    value={pw.password_confirmation}
                    onChange={(e) =>
                      setPw({
                        ...pw,
                        password_confirmation: e.target.value,
                      })
                    }
                  />

                  <PrimaryButton type="submit" disabled={savingPw}>
                    {savingPw ? "Updating…" : "Update password"}
                  </PrimaryButton>
                </form>
              </SectionCard>
            )}

            {/* ADDRESSES */}
            {active === "addresses" && (
              <SectionCard
                title="Addresses"
                description="Manage the addresses we deliver your orders to."
              >
                {loadingAddresses ? (
                  <p
                    className="text-sm"
                    style={{
                      color: "var(--color-stone)",
                    }}
                  >
                    Loading…
                  </p>
                ) : addresses.length === 0 ? (
                  <p
                    className="text-sm mb-5"
                    style={{
                      color: "var(--color-stone)",
                    }}
                  >
                    You haven't saved an address yet.
                  </p>
                ) : (
                  addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="flex items-start justify-between py-4"
                      style={{
                        borderBottom: "1px solid var(--color-hairline)",
                      }}
                    >
                      <div>
                        <p className="text-sm flex items-center gap-2">
                          {addr.label || addr.full_name}

                          {addr.is_default && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: "var(--color-surface)",
                                border: "1px solid var(--color-hairline)",
                                color: "var(--color-stone)",
                              }}
                            >
                              Default
                            </span>
                          )}
                        </p>

                        <p
                          className="text-sm mt-1"
                          style={{
                            color: "var(--color-stone)",
                          }}
                        >
                          {[
                            addr.street,
                            addr.commune,
                            addr.district,
                            addr.city_province,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>

                        <p
                          className="text-sm"
                          style={{
                            color: "var(--color-stone)",
                          }}
                        >
                          {addr.telephone}
                        </p>
                      </div>

                      <div className="flex gap-3 shrink-0">
                        <button
                          onClick={() => {
                            setEditingAddress(addr);
                            setModalOpen(true);
                          }}
                          className="text-sm hover:opacity-70"
                          style={{
                            color: "var(--color-ink)",
                          }}
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteAddress(addr)}
                          className="text-sm hover:opacity-70"
                          style={{
                            color: "var(--color-clay)",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}

                <GhostButton
                  className="mt-5"
                  onClick={() => {
                    setEditingAddress(null);
                    setModalOpen(true);
                  }}
                >
                  + Add new address
                </GhostButton>
              </SectionCard>
            )}
          </div>
        </div>
      </div>

      <AddressFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveAddress}
        initialData={editingAddress}
      />
    </div>
  );
}

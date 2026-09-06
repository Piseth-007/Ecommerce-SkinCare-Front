import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, X, UserRound, Plus, LogOut } from "lucide-react";
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
        className="block mb-1.5 text-sm"
        style={{ color: "var(--color-stone)" }}
      >
        {label}
      </span>

      <input
        {...rest}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full px-3.5 py-2.5 text-sm rounded-sm outline-none transition-all duration-200"
        style={{
          backgroundColor: "var(--color-paper)",
          border: `1px solid ${
            error ? "var(--color-clay)" : "var(--color-hairline)"
          }`,
          color: "var(--color-ink)",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--color-moss)";
          e.target.style.boxShadow =
            "0 0 0 3px color-mix(in srgb, var(--color-moss) 8%, transparent)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error
            ? "var(--color-clay)"
            : "var(--color-hairline)";
          e.target.style.boxShadow = "none";
        }}
      />

      {error && (
        <span
          className="block mt-1.5 text-xs"
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
    <section className="mb-10">
      <div className="mb-7">
        <h2
          className="text-xl md:text-2xl"
          style={{ fontFamily: "Fraunces, serif" }}
        >
          {title}
        </h2>

        {description && (
          <p
            className="max-w-xl mt-1.5 text-sm leading-6"
            style={{ color: "var(--color-stone)" }}
          >
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="inline-flex items-center justify-center min-w-32 px-5 py-2.5 text-sm rounded-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-sm border transition-all duration-200 hover:bg-[var(--color-paper)] active:scale-[0.98] disabled:opacity-50"
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
        Object.entries(err.response.data.errors).map(([key, value]) => [
          key,
          Array.isArray(value) ? value[0] : value,
        ]),
      )
    : {};
}

function getProfileImage(user) {
  return (
    user?.profile_image ||
    user?.profile_image_url ||
    user?.avatar ||
    user?.image_url ||
    user?.profile?.image_url ||
    null
  );
}

export default function Profile() {
  const { user, updateProfile, updatePassword, updateProfileImage, logout } =
    useContext(AuthContext);

  const { showToast } = useContext(ToastContext);
  const { confirm } = useContext(ConfirmContext);
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  const [active, setActive] = useState("account");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const [pw, setPw] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  useEffect(() => {
    if (!user) return;

    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
    });

    setImagePreview(getProfileImage(user));
    setProfileImage(null);
    setRemoveImage(false);
  }, [user]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast?.("Please select a valid image file.", "error");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast?.("Image must be smaller than 5MB.", "error");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setProfileImage(file);
    setImagePreview(previewUrl);
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview(null);
    setProfileImage(null);
    setRemoveImage(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setFormErrors({
        name: "Full name is required.",
      });
      return;
    }

    setSavingProfile(true);
    setFormErrors({});

    try {
      await updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });

      if (profileImage) {
        await updateProfileImage(profileImage);
      }

      if (removeImage) {
        showToast?.("Photo removal isn't supported yet.", "error");
      }

      setProfileImage(null);
      setRemoveImage(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      showToast?.("Profile updated successfully.", "success");
    } catch (error) {
      setFormErrors(fieldErrors(error));

      showToast?.(
        error?.response?.data?.message || "Couldn't update your profile.",
        "error",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (event) => {
    event.preventDefault();

    setSavingPw(true);
    setPwErrors({});

    try {
      await updatePassword(pw);

      setPw({
        current_password: "",
        password: "",
        password_confirmation: "",
      });

      showToast?.("Password updated successfully.", "success");
    } catch (error) {
      setPwErrors(fieldErrors(error));

      showToast?.(
        error?.response?.data?.message || "Couldn't update your password.",
        "error",
      );
    } finally {
      setSavingPw(false);
    }
  };

  const loadAddresses = useCallback(async () => {
    setLoadingAddresses(true);

    try {
      const response = await api.get("/addresses");

      const data = response.data?.data ?? response.data ?? [];

      setAddresses(Array.isArray(data) ? data : []);
    } catch {
      showToast?.("Couldn't load your addresses.", "error");
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
    try {
      if (editingAddress) {
        await api.put(`/addresses/${editingAddress.id}`, data);
      } else {
        await api.post("/addresses", data);
      }

      await loadAddresses();

      setModalOpen(false);
      setEditingAddress(null);

      showToast?.(
        editingAddress
          ? "Address updated successfully."
          : "Address added successfully.",
        "success",
      );
    } catch (error) {
      showToast?.(
        error?.response?.data?.message || "Couldn't save the address.",
        "error",
      );

      throw error;
    }
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

      setAddresses((current) =>
        current.filter((item) => item.id !== address.id),
      );

      showToast?.("Address removed successfully.", "success");
    } catch (error) {
      showToast?.(
        error?.response?.data?.message || "Couldn't remove the address.",
        "error",
      );
    }
  };

  const handleSignOut = async () => {
    const ok = await confirm(
      "You'll need to sign in again to access your account.",
      {
        title: "Sign out?",
        confirmLabel: "Sign out",
      },
    );

    if (!ok) return;

    try {
      await logout();
      navigate("/login");
    } catch {
      showToast?.("Couldn't sign out. Please try again.", "error");
    }
  };

  if (!user) return null;

  const initial = (user.name || "").trim().charAt(0).toUpperCase() || "U";

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: "var(--color-paper)",
        color: "var(--color-ink)",
      }}
    >
      <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-16">
          <aside className="md:col-span-1">
            <nav aria-label="Profile navigation">
              <div className="md:sticky md:top-8">
                <div className="mb-5">
                  <p
                    className="text-xs uppercase tracking-[0.16em]"
                    style={{ color: "var(--color-stone)" }}
                  >
                    Account
                  </p>
                </div>

                <div className="space-y-1">
                  {NAV.map((item) => {
                    const selected = active === item.key;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActive(item.key)}
                        className="w-full text-left px-3.5 py-2.5 text-sm rounded-sm transition-all duration-200"
                        style={{
                          backgroundColor: selected
                            ? "var(--color-surface)"
                            : "transparent",
                          color: selected
                            ? "var(--color-ink)"
                            : "var(--color-stone)",
                          border: selected
                            ? "1px solid var(--color-hairline)"
                            : "1px solid transparent",
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <div
                  className="mt-6 pt-5"
                  style={{
                    borderTop: "1px solid var(--color-hairline)",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-left rounded-sm transition-colors hover:bg-[var(--color-surface)]"
                    style={{ color: "var(--color-clay)" }}
                  >
                    <LogOut size={15} strokeWidth={1.7} />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </nav>
          </aside>

          <div className="md:col-span-3 min-w-0">
            {active === "account" && (
              <SectionCard
                title="Account details"
                description="Keep your personal information up to date so we can contact you about your orders."
              >
                <form onSubmit={handleSaveProfile}>
                  <div className="mb-8">
                    <span
                      className="block mb-3 text-sm"
                      style={{ color: "var(--color-stone)" }}
                    >
                      Profile photo
                    </span>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                      <div
                        className="relative w-20 h-20 shrink-0 rounded-full overflow-hidden flex items-center justify-center"
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

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={savingProfile}
                          className="absolute bottom-1 right-1 w-7 h-7 flex items-center justify-center rounded-full border transition-all duration-200 hover:scale-105 disabled:opacity-50"
                          style={{
                            backgroundColor: "var(--color-surface)",
                            borderColor: "var(--color-paper)",
                            color: "var(--color-ink)",
                          }}
                          aria-label="Change profile photo"
                        >
                          <Camera size={13} strokeWidth={2} />
                        </button>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
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
                              aria-label="Remove profile photo"
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>

                        <p
                          className="mt-2 text-xs"
                          style={{
                            color: "var(--color-stone)",
                          }}
                        >
                          JPG, PNG or WebP. Maximum 5MB.
                        </p>
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>

                  <div
                    className="pt-1"
                    style={{
                      borderTop: "1px solid var(--color-hairline)",
                    }}
                  >
                    <div className="pt-7">
                      <Field
                        label="Full name"
                        value={form.name}
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            name: e.target.value,
                          }))
                        }
                        error={formErrors.name}
                        autoComplete="name"
                      />

                      <Field
                        label="Email"
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            email: e.target.value,
                          }))
                        }
                        error={formErrors.email}
                        autoComplete="email"
                      />

                      <Field
                        label="Phone"
                        value={form.phone}
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            phone: e.target.value,
                          }))
                        }
                        error={formErrors.phone}
                        autoComplete="tel"
                      />

                      <div className="pt-1">
                        <PrimaryButton type="submit" disabled={savingProfile}>
                          {savingProfile ? "Saving..." : "Save changes"}
                        </PrimaryButton>
                      </div>
                    </div>
                  </div>
                </form>
              </SectionCard>
            )}

            {active === "security" && (
              <SectionCard
                title="Password & security"
                description="Choose a strong password that you don't use anywhere else."
              >
                <form onSubmit={handleUpdatePassword}>
                  <Field
                    label="Current password"
                    type="password"
                    value={pw.current_password}
                    onChange={(e) =>
                      setPw((current) => ({
                        ...current,
                        current_password: e.target.value,
                      }))
                    }
                    error={pwErrors.current_password}
                    autoComplete="current-password"
                  />

                  <Field
                    label="New password"
                    type="password"
                    value={pw.password}
                    onChange={(e) =>
                      setPw((current) => ({
                        ...current,
                        password: e.target.value,
                      }))
                    }
                    error={pwErrors.password}
                    autoComplete="new-password"
                  />

                  <Field
                    label="Confirm new password"
                    type="password"
                    value={pw.password_confirmation}
                    onChange={(e) =>
                      setPw((current) => ({
                        ...current,
                        password_confirmation: e.target.value,
                      }))
                    }
                    error={pwErrors.password_confirmation}
                    autoComplete="new-password"
                  />

                  <PrimaryButton type="submit" disabled={savingPw}>
                    {savingPw ? "Updating..." : "Update password"}
                  </PrimaryButton>
                </form>
              </SectionCard>
            )}

            {active === "addresses" && (
              <SectionCard
                title="Addresses"
                description="Manage the addresses used for your deliveries."
              >
                {loadingAddresses ? (
                  <div className="py-8">
                    <p
                      className="text-sm"
                      style={{
                        color: "var(--color-stone)",
                      }}
                    >
                      Loading addresses...
                    </p>
                  </div>
                ) : addresses.length === 0 ? (
                  <div
                    className="py-10 text-center rounded-sm border"
                    style={{
                      borderColor: "var(--color-hairline)",
                    }}
                  >
                    <p
                      className="text-sm"
                      style={{
                        color: "var(--color-stone)",
                      }}
                    >
                      You haven't saved an address yet.
                    </p>

                    <GhostButton
                      className="mt-5"
                      onClick={() => {
                        setEditingAddress(null);
                        setModalOpen(true);
                      }}
                    >
                      <Plus size={15} />
                      Add new address
                    </GhostButton>
                  </div>
                ) : (
                  <div
                    className="border-t"
                    style={{
                      borderColor: "var(--color-hairline)",
                    }}
                  >
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className="py-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
                        style={{
                          borderBottom: "1px solid var(--color-hairline)",
                        }}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium">
                              {address.label || address.full_name}
                            </p>

                            {address.is_default && (
                              <span
                                className="inline-flex px-2 py-0.5 text-[11px] rounded-full"
                                style={{
                                  backgroundColor: "var(--color-surface)",
                                  border: "1px solid var(--color-hairline)",
                                  color: "var(--color-stone)",
                                }}
                              >
                                Default
                              </span>
                            )}
                          </div>

                          <p
                            className="mt-1.5 text-sm leading-6"
                            style={{
                              color: "var(--color-stone)",
                            }}
                          >
                            {[
                              address.street,
                              address.commune,
                              address.district,
                              address.city_province,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>

                          {address.telephone && (
                            <p
                              className="mt-0.5 text-sm"
                              style={{
                                color: "var(--color-stone)",
                              }}
                            >
                              {address.telephone}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAddress(address);
                              setModalOpen(true);
                            }}
                            className="text-sm transition-opacity hover:opacity-60"
                            style={{
                              color: "var(--color-ink)",
                            }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(address)}
                            className="text-sm transition-opacity hover:opacity-60"
                            style={{
                              color: "var(--color-clay)",
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {addresses.length > 0 && (
                  <GhostButton
                    className="mt-5"
                    onClick={() => {
                      setEditingAddress(null);
                      setModalOpen(true);
                    }}
                  >
                    <Plus size={15} />
                    Add new address
                  </GhostButton>
                )}
              </SectionCard>
            )}
          </div>
        </div>
      </div>

      <AddressFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingAddress(null);
        }}
        onSave={handleSaveAddress}
        initialData={editingAddress}
      />
    </main>
  );
}

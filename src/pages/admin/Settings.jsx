import { useContext, useEffect, useRef, useState } from "react";
import {
  Store,
  User,
  CreditCard,
  Bell,
  Upload,
  X,
  Loader2,
  Save,
  Send,
} from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast";
import { ConfirmContext } from "../../context/ConfirmContext";

const TABS = [
  { id: "store", label: "Store Profile", icon: Store },
  { id: "account", label: "Account", icon: User },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
];

function SettingsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 w-64 rounded-lg bg-surface" />
      <div className="h-64 rounded-2xl bg-surface" />
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-ink">
      {children}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-hairline bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-moss focus:ring-1 focus:ring-moss"
    />
  );
}

function SaveButton({ saving, label = "Save changes" }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="inline-flex items-center gap-2 rounded-lg bg-moss px-4 py-2 text-sm font-medium text-paper transition hover:bg-moss-deep disabled:opacity-60"
    >
      {saving ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Save size={16} />
      )}
      {saving ? "Saving..." : label}
    </button>
  );
}

function StoreTab({ initial, onSaved }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: initial.name || "",
    contact_email: initial.contact_email || "",
    contact_phone: initial.contact_phone || "",
    address: initial.address || "",
  });
  const [logo, setLogo] = useState(initial.logo || null);
  const [logoFile, setLogoFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    setLogoFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) =>
        fd.append(key, value ?? ""),
      );
      if (logoFile) fd.append("logo", logoFile);
      if (!logo && !logoFile) fd.append("remove_logo", "1");

      const res = await api.post("/admin/settings/store", fd);
      const data = res.data?.data || res.data;
      onSaved(data);
      setLogoFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      showToast("Store profile updated", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to save store profile",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const logoSrc = preview || logo?.url || null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <FieldLabel>Store logo</FieldLabel>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-hairline bg-surface">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt="Store logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <Store size={28} className="text-stone" />
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-hairline px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface"
            >
              <Upload size={14} />
              Upload
            </button>
            {logoSrc && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="inline-flex items-center gap-2 rounded-lg border border-hairline px-3 py-2 text-sm font-medium text-clay transition hover:bg-surface"
              >
                <X size={14} />
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Store name</FieldLabel>
          <TextInput
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <FieldLabel>Contact email</FieldLabel>
          <TextInput
            type="email"
            value={form.contact_email}
            onChange={(e) =>
              setForm({ ...form, contact_email: e.target.value })
            }
          />
        </div>
        <div>
          <FieldLabel>Contact phone</FieldLabel>
          <TextInput
            value={form.contact_phone}
            onChange={(e) =>
              setForm({ ...form, contact_phone: e.target.value })
            }
          />
        </div>
        <div>
          <FieldLabel>Address</FieldLabel>
          <TextInput
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
      </div>

      <SaveButton saving={saving} />
    </form>
  );
}

function AccountTab() {
  const { user, updateProfile, updateProfileImage, removeProfileImage } =
    useAuth();
  const { showToast } = useToast();
  const { confirm } = useContext(ConfirmContext);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      showToast("Account updated", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to update account",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      await updateProfileImage(file);
      showToast("Profile photo updated", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to upload photo",
        "error",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    const ok = await confirm("Remove your profile photo?", {
      title: "Remove photo",
    });
    if (!ok) return;
    try {
      await removeProfileImage();
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      showToast("Profile photo removed", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to remove photo",
        "error",
      );
    }
  };

  const avatarSrc = preview || user?.profile_image || null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <FieldLabel>Profile photo</FieldLabel>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-hairline bg-surface">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <User size={28} className="text-stone" />
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg border border-hairline px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              Upload
            </button>
            {user?.profile_image && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="inline-flex items-center gap-2 rounded-lg border border-hairline px-3 py-2 text-sm font-medium text-clay transition hover:bg-surface"
              >
                <X size={14} />
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Name</FieldLabel>
          <TextInput
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <FieldLabel>Email</FieldLabel>
          <TextInput
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div>
          <FieldLabel>Phone</FieldLabel>
          <TextInput
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
      </div>

      <SaveButton saving={saving} />
    </form>
  );
}

function PaymentTab({ initial, onSaved }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    bakong_account_id: initial.bakong_account_id || "",
    bakong_developer_token: initial.bakong_developer_token || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put("/admin/settings/payment", form);
      const data = res.data?.data || res.data;
      onSaved(data);
      showToast("Payment settings updated", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to save payment settings",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const isPending = !form.bakong_account_id || !form.bakong_developer_token;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        className={`rounded-xl border px-4 py-3 text-sm ${
          isPending
            ? "border-clay/40 bg-clay/10 text-clay"
            : "border-moss/40 bg-moss-tint text-moss-deep"
        }`}
      >
        {isPending
          ? "Bakong KHQR is not active yet. Add your developer token and account ID from NBC Cambodia to enable it."
          : "Bakong KHQR credentials are set."}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Bakong account ID</FieldLabel>
          <TextInput
            value={form.bakong_account_id}
            onChange={(e) =>
              setForm({ ...form, bakong_account_id: e.target.value })
            }
            placeholder="e.g. your_name@wing"
          />
        </div>
        <div>
          <FieldLabel>Bakong developer token</FieldLabel>
          <TextInput
            type="password"
            value={form.bakong_developer_token}
            onChange={(e) =>
              setForm({ ...form, bakong_developer_token: e.target.value })
            }
          />
        </div>
      </div>

      <SaveButton saving={saving} />
    </form>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-hairline px-4 py-3">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      ></input>
      <span
        aria-hidden="true"
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-moss" : "bg-surface"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </span>
    </label>
  );
}

function NotificationsTab({ initial, onSaved }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    email_enabled: initial.email_enabled ?? true,
    telegram_enabled: initial.telegram_enabled ?? false,
    telegram_bot_token: initial.telegram_bot_token || "",
    telegram_chat_id: initial.telegram_chat_id || "",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put("/admin/settings/notifications", form);
      const data = res.data?.data || res.data;
      onSaved(data);
      showToast("Notification settings updated", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to save notification settings",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!form.telegram_bot_token || !form.telegram_chat_id) {
      showToast("Please enter both Bot Token and Chat ID before testing", "error");
      return;
    }
    setTesting(true);
    try {
      const res = await api.post("/admin/settings/notifications/test-telegram", {
        telegram_bot_token: form.telegram_bot_token,
        telegram_chat_id: form.telegram_chat_id,
      });
      showToast(res.data?.message || "Test message sent to Telegram!", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to send test message",
        "error",
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <Toggle
          checked={form.email_enabled}
          onChange={(v) => setForm({ ...form, email_enabled: v })}
          label="Email notifications for new orders"
        />
        <Toggle
          checked={form.telegram_enabled}
          onChange={(v) => setForm({ ...form, telegram_enabled: v })}
          label="Telegram notifications for new orders"
        />
      </div>

      {form.telegram_enabled && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Telegram bot token</FieldLabel>
            <TextInput
              type="password"
              placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              value={form.telegram_bot_token}
              onChange={(e) =>
                setForm({ ...form, telegram_bot_token: e.target.value })
              }
            />
          </div>
          <div>
            <FieldLabel>Telegram chat ID</FieldLabel>
            <TextInput
              placeholder="e.g. -1001234567890 or 123456789"
              value={form.telegram_chat_id}
              onChange={(e) =>
                setForm({ ...form, telegram_chat_id: e.target.value })
              }
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SaveButton saving={saving} />
        {form.telegram_enabled && (
          <button
            type="button"
            onClick={handleTestTelegram}
            disabled={testing || saving}
            className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-hairline/50 disabled:opacity-60"
          >
            {testing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            Send test notification
          </button>
        )}
      </div>
    </form>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("store");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    api
      .get("/admin/settings", { signal: controller.signal })
      .then((res) => {
        if (!mounted) return;
        setSettings(res.data?.data || res.data);
      })
      .catch((err) => {
        if (!mounted || err.name === "CanceledError") return;
        setError("Failed to load settings");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  if (loading) return <SettingsSkeleton />;

  if (error) {
    return (
      <div className="rounded-xl border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-clay">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Settings</h1>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-hairline">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              activeTab === id
                ? "border-moss text-moss-deep"
                : "border-transparent text-stone hover:text-ink"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-hairline bg-paper p-6">
        {activeTab === "store" && (
          <StoreTab
            initial={settings.store}
            onSaved={(data) =>
              setSettings((prev) => ({ ...prev, store: data }))
            }
          />
        )}
        {activeTab === "account" && <AccountTab />}
        {activeTab === "payment" && (
          <PaymentTab
            initial={settings.payment}
            onSaved={(data) =>
              setSettings((prev) => ({ ...prev, payment: data }))
            }
          />
        )}
        {activeTab === "notifications" && (
          <NotificationsTab
            initial={settings.notifications}
            onSaved={(data) =>
              setSettings((prev) => ({ ...prev, notifications: data }))
            }
          />
        )}
      </div>
    </div>
  );
}

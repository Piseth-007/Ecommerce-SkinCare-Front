import React, { useState, useEffect } from "react";

/**
 * AddressFormModal — add/edit a shipping address.
 * Field names match AddressController::addressRules() exactly:
 *   full_name, telephone, city_province, district, commune, street, label, is_default
 *
 * Props:
 *   open        - boolean
 *   onClose     - () => void
 *   onSave      - (formData) => Promise<void>   // parent does the api.post/put + refetch
 *   initialData - existing address when editing, null when creating
 */

const EMPTY = {
  label: "",
  full_name: "",
  telephone: "",
  city_province: "",
  district: "",
  commune: "",
  street: "",
  is_default: false,
};

function Input({ label, ...props }) {
  return (
    <label className="block mb-4">
      <span
        className="text-sm block mb-1.5"
        style={{ color: "var(--color-stone)" }}
      >
        {label}
      </span>
      <input
        {...props}
        className="w-full px-3 py-2.5 text-sm rounded-sm outline-none transition-colors"
        style={{
          backgroundColor: "var(--color-paper)",
          border: "1px solid var(--color-hairline)",
          color: "var(--color-ink)",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--color-moss)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--color-hairline)")}
      />
    </label>
  );
}

export default function AddressFormModal({
  open,
  onClose,
  onSave,
  initialData,
}) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialData ? { ...EMPTY, ...initialData } : EMPTY);
    setErrors({});
  }, [initialData, open]);

  if (!open) return null;

  const set = (key) => (e) =>
    setForm({
      ...form,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      // Laravel validation errors: { errors: { field: [msg] } }
      const laravelErrors = err?.response?.data?.errors;
      if (laravelErrors) {
        setErrors(
          Object.fromEntries(
            Object.entries(laravelErrors).map(([k, v]) => [k, v[0]]),
          ),
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(38, 36, 32, 0.4)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-6 rounded-sm max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-hairline)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl mb-5" style={{ fontFamily: "Fraunces, serif" }}>
          {initialData ? "Edit address" : "Add address"}
        </h2>

        <form onSubmit={handleSubmit}>
          <Input
            label="Label (e.g. Home, Office)"
            value={form.label}
            onChange={set("label")}
          />
          <Input
            label="Full name"
            value={form.full_name}
            onChange={set("full_name")}
            required
          />
          {errors.full_name && (
            <p
              className="text-xs -mt-3 mb-3"
              style={{ color: "var(--color-clay)" }}
            >
              {errors.full_name}
            </p>
          )}

          <Input
            label="Telephone"
            value={form.telephone}
            onChange={set("telephone")}
            required
          />
          {errors.telephone && (
            <p
              className="text-xs -mt-3 mb-3"
              style={{ color: "var(--color-clay)" }}
            >
              {errors.telephone}
            </p>
          )}

          <Input
            label="City / Province"
            value={form.city_province}
            onChange={set("city_province")}
            required
          />
          <Input
            label="District"
            value={form.district}
            onChange={set("district")}
            required
          />
          <Input
            label="Commune"
            value={form.commune}
            onChange={set("commune")}
            required
          />
          <Input
            label="Street (optional)"
            value={form.street}
            onChange={set("street")}
          />

          <label
            className="flex items-center gap-2 mb-6 text-sm"
            style={{ color: "var(--color-ink)" }}
          >
            <input
              type="checkbox"
              checked={!!form.is_default}
              onChange={set("is_default")}
            />
            Set as default address
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm rounded-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-moss)",
                color: "var(--color-paper)",
              }}
            >
              {saving ? "Saving…" : "Save address"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm rounded-sm border transition-colors hover:bg-[var(--color-paper)]"
              style={{
                borderColor: "var(--color-hairline)",
                color: "var(--color-ink)",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

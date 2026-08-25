import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf } from "lucide-react";
import { useAuth } from "../../context/useAuth";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setErrors(
        err.response?.data?.errors || {
          general: [err.response?.data?.message || "Registration failed"],
        },
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-paper px-4 py-16">
      <div className="w-full max-w-[380px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-full bg-moss-tint flex items-center justify-center mb-4">
            <Leaf size={18} className="text-moss" strokeWidth={1.75} />
          </div>
          <h1 className="font-display text-[26px] font-medium text-ink">
            Create an account
          </h1>
          <p className="text-[13.5px] text-stone mt-1">
            Join us for skincare that works
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-hairline rounded-2xl p-7 space-y-4 shadow-[0_1px_2px_rgba(33,31,27,0.04)]"
        >
          <Field label="Name" error={errors.name}>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className={inputClass}
              placeholder="Jane Doe"
              required
            />
          </Field>

          <Field label="Email" error={errors.email}>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={inputClass}
              placeholder="you@example.com"
              required
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className={inputClass}
              placeholder="At least 8 characters"
              required
            />
          </Field>

          <Field label="Confirm password">
            <input
              type="password"
              name="password_confirmation"
              value={form.password_confirmation}
              onChange={handleChange}
              className={inputClass}
              placeholder="••••••••"
              required
            />
          </Field>

          {errors.general && (
            <p className="text-[13px] text-clay bg-clay-tint border border-clay/15 rounded-lg px-3.5 py-2.5">
              {errors.general[0]}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-moss text-white text-[13.5px] font-medium hover:bg-moss-deep transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-[13px] text-stone mt-5">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-moss font-medium hover:text-moss-deep"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-paper text-ink text-[14px] placeholder:text-stone/60 focus:outline-none focus:ring-2 focus:ring-moss/30 focus:border-moss transition-shadow";

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-stone mb-2">
        {label}
      </label>
      {children}
      {error && <p className="text-[12px] text-clay mt-1.5">{error[0]}</p>}
    </div>
  );
}

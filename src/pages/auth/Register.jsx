import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import AuthShell, {
  AuthField,
  authInputClass,
} from "../../components/auth/AuthShell";

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
    <AuthShell
      eyebrow="New here?"
      title="Make space for your ritual."
      description="Create an account and find skincare that fits your everyday."
      visualTitle="A gentler way to glow."
      visualCopy="Build a routine around considered ingredients, calm textures, and the little moments that belong to you."
      reverse
      compact
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <AuthField label="Name" error={errors.name}>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className={authInputClass}
            placeholder="Jane Doe"
            required
          />
        </AuthField>

        <AuthField label="Email" error={errors.email}>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className={authInputClass}
            placeholder="you@example.com"
            required
          />
        </AuthField>

        <AuthField label="Password" error={errors.password}>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className={authInputClass}
            placeholder="At least 8 characters"
            required
          />
        </AuthField>

        <AuthField label="Confirm password">
          <input
            type="password"
            name="password_confirmation"
            value={form.password_confirmation}
            onChange={handleChange}
            className={authInputClass}
            placeholder="••••••••"
            required
          />
        </AuthField>

        {errors.general && <p className="auth-alert">{errors.general[0]}</p>}

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-moss font-medium hover:text-moss-deep"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

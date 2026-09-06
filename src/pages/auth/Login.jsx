import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import AuthShell, {
  AuthField,
  authInputClass,
} from "../../components/auth/AuthShell";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const redirectTo = location.state?.from || "/";
      navigate(redirectTo);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Your skin, your ritual."
      description="Sign in to continue your thoughtful skincare routine."
      visualTitle="Small rituals. Visible results."
      visualCopy="Discover formulas made to make your everyday routine feel a little more considered."
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <AuthField label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
            placeholder="you@example.com"
            required
          />
        </AuthField>

        <AuthField label="Password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
            placeholder="••••••••"
            required
          />
        </AuthField>

        <div className="auth-form-meta">
          <Link
            to="/forgot-password"
            className="text-[12.5px] text-moss hover:text-moss-deep font-medium"
          >
            Forgot password?
          </Link>
        </div>

        {error && <p className="auth-alert">{error}</p>}

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="auth-switch">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-moss font-medium hover:text-moss-deep"
        >
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}

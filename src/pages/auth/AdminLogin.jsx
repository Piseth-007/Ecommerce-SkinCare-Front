import { useState } from "react";
import { useNavigate, useLocation, Navigate, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import AuthShell, {
  AuthField,
  authInputClass,
} from "../../components/auth/AuthShell";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Already logged in as admin? Skip the form entirely.
  if (!authLoading && user?.role === "admin") {
    const redirectTo = location.state?.from || "/admin/dashboard";
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role !== "admin") {
        setError("This account does not have admin access.");
        return;
      }
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Store administration"
      title="Keep the whole shop in view."
      description="Sign in to manage products, orders, and the details behind every customer experience."
      visualTitle="Everything, thoughtfully arranged."
      visualCopy="A clear space for the work that keeps your store moving beautifully."
      compact
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <AuthField label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
            placeholder="admin@example.com"
            required
          />
        </AuthField>

        <AuthField label="Password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
            placeholder="Your admin password"
            required
          />
        </AuthField>

        <div className="auth-form-meta">
          <Link to="/admin/forgot-password">Forgot admin password?</Link>
        </div>

        {error && <p className="auth-alert">{error}</p>}

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

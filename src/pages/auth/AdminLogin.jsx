import { useState } from "react";
import { useNavigate, useLocation, Navigate, Link } from "react-router-dom";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import AuthShell, {
  AuthField,
  AuthInput,
} from "../../components/auth/AuthShell";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  
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
      badge="Store Administration"
      tags={["✦ Admin Workspace", "Store Controls", "Analytics & Orders"]}
      compact
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <AuthField label="Email">
          <AuthInput
            icon={Mail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            autoComplete="username"
            required
          />
        </AuthField>

        <AuthField label="Password">
          <AuthInput
            icon={Lock}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your admin password"
            autoComplete="current-password"
            required
          />
        </AuthField>

        <div className="auth-form-meta">
          <Link
            to="/admin/forgot-password"
            className="text-[12px] text-moss hover:text-moss-deep font-medium transition-colors"
          >
            Forgot admin password?
          </Link>
        </div>

        {error && (
          <div className="auth-alert">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Signing in…</span>
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>
    </AuthShell>
  );
}

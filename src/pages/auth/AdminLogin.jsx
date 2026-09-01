import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Leaf } from "lucide-react";
import { useAuth } from "../../context/useAuth";

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
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-[380px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-full bg-moss-tint flex items-center justify-center mb-4">
            <Leaf size={18} className="text-moss" strokeWidth={1.75} />
          </div>
          <h1 className="font-display text-[26px] font-medium text-ink">
            Store admin
          </h1>
          <p className="text-[13.5px] text-stone mt-1">
            Sign in to manage your store
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-hairline rounded-2xl p-7 space-y-4 shadow-[0_1px_2px_rgba(33,31,27,0.04)]"
        >
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </Field>

          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
            />
          </Field>

          {error && (
            <p className="text-[13px] text-clay bg-clay-tint border border-clay/15 rounded-lg px-3.5 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-moss text-white text-[13.5px] font-medium hover:bg-moss-deep transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-paper text-ink text-[14px] focus:outline-none focus:ring-2 focus:ring-moss/30 focus:border-moss transition-shadow";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-stone mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

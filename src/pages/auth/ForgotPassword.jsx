import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Loader2, AlertCircle } from "lucide-react";
import api from "../../api/axios";
import AuthShell, {
  AuthField,
  AuthInput,
} from "../../components/auth/AuthShell";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="A fresh start is close."
      description="Enter your email and we’ll send a secure link to reset your password."
      visualTitle="Your routine is worth returning to."
      visualCopy="We’ll help you get back to the products and rituals that make you feel at home in your skin."
      badge="Account Recovery"
      tags={["✦ Secure Link", "Instant Recovery", "24/7 Support"]}
    >
      <div className="auth-form">
        {sent ? (
          <div className="auth-success">
            <div className="auth-brand-mark">
              <Mail size={17} strokeWidth={1.8} />
            </div>
            <strong>Check your inbox</strong>
            <p>We’ve sent a password reset link to {email}.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <AuthField label="Email">
              <AuthInput
                icon={Mail}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </AuthField>

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
                  <span>Sending…</span>
                </>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>
        )}
      </div>

      <p className="auth-switch">
        <Link
          to="/login"
          className="text-moss font-medium hover:text-moss-deep"
        >
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}

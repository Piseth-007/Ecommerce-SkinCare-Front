import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import api from "../../api/axios";
import AuthShell, {
  AuthField,
  authInputClass,
} from "../../components/auth/AuthShell";

export default function AdminForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/forgot-password", { email });
      setSent(true);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We could not send a reset link right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Admin account recovery"
      title="Get back to the work."
      description="Enter your admin email and we’ll send a secure password reset link."
      visualTitle="The details behind every order."
      visualCopy="Reset your access and return to the calm, clear space that keeps your store moving."
      compact
    >
      <div className="auth-form">
        {sent ? (
          <div className="auth-success">
            <div className="auth-brand-mark">
              <Mail size={17} strokeWidth={1.8} />
            </div>
            <strong>Check your inbox</strong>
            <p>We’ve sent a reset link to {email}.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <AuthField label="Admin email">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={authInputClass}
                placeholder="admin@example.com"
                required
              />
            </AuthField>

            {error && <p className="auth-alert">{error}</p>}

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
      </div>

      <p className="auth-switch">
        <Link to="/admin/login">Back to admin sign in</Link>
      </p>
    </AuthShell>
  );
}

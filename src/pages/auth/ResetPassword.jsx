import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import api from "../../api/axios";
import AuthShell, {
  AuthField,
  authInputClass,
} from "../../components/auth/AuthShell";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/reset-password", {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <main className="auth-page px-4 py-8">
        <p className="auth-alert">Invalid or expired reset link.</p>
      </main>
    );
  }

  return (
    <AuthShell
      eyebrow="Almost there"
      title="Choose a new password."
      description="Make it something memorable, private, and easy to come back to."
      visualTitle="Back to your best skin days."
      visualCopy="One small reset, then you’re ready to return to your everyday ritual."
      reverse
    >
      <div className="auth-form">
        {success ? (
          <div className="auth-success">
            <CheckCircle2
              size={28}
              className="auth-success-icon"
              strokeWidth={1.75}
            />
            <strong>Password reset successfully</strong>
            <p>Redirecting you to sign in…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <AuthField label="New password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={authInputClass}
                required
              />
            </AuthField>

            <AuthField label="Confirm password">
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className={authInputClass}
                required
              />
            </AuthField>

            {error && <p className="auth-alert">{error}</p>}

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? "Resetting…" : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}

import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import api from "../../api/axios";
import AuthShell, {
  AuthField,
  AuthInput,
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

  const passwordsMatch =
    passwordConfirmation.length > 0 && password === passwordConfirmation;
  const passwordsMismatch =
    passwordConfirmation.length > 0 && password !== passwordConfirmation;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirmation) {
      setError("Passwords do not match");
      return;
    }

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
        <div className="auth-alert">
          <AlertCircle size={16} className="shrink-0" />
          <span>Invalid or expired reset link.</span>
        </div>
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
              <AuthInput
                icon={Lock}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
            </AuthField>

            <AuthField label="Confirm password">
              <AuthInput
                icon={Lock}
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Confirm password"
                required
              />
            </AuthField>

            {passwordsMatch && (
              <div className="flex items-center gap-1.5 text-[11.5px] text-moss font-medium -mt-1">
                <CheckCircle2 size={13} className="shrink-0" />
                <span>Passwords match</span>
              </div>
            )}
            {passwordsMismatch && (
              <div className="flex items-center gap-1.5 text-[11.5px] text-clay font-medium -mt-1">
                <XCircle size={13} className="shrink-0" />
                <span>Passwords do not match</span>
              </div>
            )}

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
                  <span>Resetting…</span>
                </>
              ) : (
                "Reset password"
              )}
            </button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}

import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Leaf, CheckCircle2 } from "lucide-react";
import api from "../../api/axios";

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
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-paper px-4">
        <p className="text-[13.5px] text-clay">
          Invalid or expired reset link.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-paper px-4 py-16">
      <div className="w-full max-w-[380px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-full bg-moss-tint flex items-center justify-center mb-4">
            <Leaf size={18} className="text-moss" strokeWidth={1.75} />
          </div>
          <h1 className="font-display text-[26px] font-medium text-ink">
            Set a new password
          </h1>
        </div>

        <div className="bg-surface border border-hairline rounded-2xl p-7 shadow-[0_1px_2px_rgba(33,31,27,0.04)]">
          {success ? (
            <div className="text-center py-2">
              <CheckCircle2
                size={28}
                className="text-moss mx-auto mb-3"
                strokeWidth={1.75}
              />
              <p className="text-[13.5px] text-ink font-medium">
                Password reset. Redirecting to sign in…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-stone mb-2">
                  New password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-paper text-ink text-[14px] focus:outline-none focus:ring-2 focus:ring-moss/30 focus:border-moss"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-stone mb-2">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-paper text-ink text-[14px] focus:outline-none focus:ring-2 focus:ring-moss/30 focus:border-moss"
                  required
                />
              </div>

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
                {loading ? "Resetting…" : "Reset password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

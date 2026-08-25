import { useState } from "react";
import { Link } from "react-router-dom";
import { Leaf, Mail } from "lucide-react";
import api from "../../api/axios";

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
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-paper px-4 py-16">
      <div className="w-full max-w-[380px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-full bg-moss-tint flex items-center justify-center mb-4">
            <Leaf size={18} className="text-moss" strokeWidth={1.75} />
          </div>
          <h1 className="font-display text-[26px] font-medium text-ink">
            Reset your password
          </h1>
          <p className="text-[13.5px] text-stone mt-1 text-center">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="bg-surface border border-hairline rounded-2xl p-7 shadow-[0_1px_2px_rgba(33,31,27,0.04)]">
          {sent ? (
            <div className="text-center py-2">
              <div className="w-11 h-11 rounded-full bg-moss-tint flex items-center justify-center mx-auto mb-4">
                <Mail size={18} className="text-moss" strokeWidth={1.75} />
              </div>
              <p className="text-[13.5px] text-ink font-medium mb-1">
                Check your inbox
              </p>
              <p className="text-[13px] text-stone">
                We've sent a reset link to {email}.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-stone mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-paper text-ink text-[14px] focus:outline-none focus:ring-2 focus:ring-moss/30 focus:border-moss"
                  placeholder="you@example.com"
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
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[13px] text-stone mt-5">
          <Link
            to="/login"
            className="text-moss font-medium hover:text-moss-deep"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Loader2, AlertCircle, Sparkles } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/useAuth";
import AuthShell, {
  AuthField,
  AuthInput,
} from "../../components/auth/AuthShell";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

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

  const handleGoogleResponse = async (response) => {
    setError("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle(response.credential);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message || "Google sign-in failed. Please try again."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      return;
    }

    const scriptId = "google-identity-services";
    let script = document.getElementById(scriptId);

    const initGoogle = () => {
      if (!window.google || !googleBtnRef.current) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: googleBtnRef.current.offsetWidth,
        text: "continue_with",
      });
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    } else {
      initGoogle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="A fresh start is close."
      description="Enter your email to receive a reset link, or sign in instantly with Google."
      visualTitle="Your routine is worth returning to."
      visualCopy="We’ll help you get back to the products and rituals that make you feel at home in your skin."
      badge="Instant Recovery"
      quote={{
        text: "Thoughtful, simple, and always easy to pick up right where you left off.",
        author: "Botaniq Care Team",
      }}
      tags={["✦ Secure Access", "Instant Google Recovery", "24/7 Support"]}
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
            <AuthField label="Email address">
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
                  <span>Sending reset link…</span>
                </>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>
        )}
      </div>

      {!sent && (
        <>
          <div className="auth-divider">
            <span>or signed up with Google?</span>
          </div>

          <div className="w-full flex justify-center min-h-10">
            {googleLoading ? (
              <div className="flex items-center gap-2 text-[13px] text-stone py-2">
                <Loader2 size={15} className="animate-spin text-moss" />
                <span>Signing in with Google…</span>
              </div>
            ) : (
              <div ref={googleBtnRef} className="w-full [&>div]:w-full flex justify-center" />
            )}
          </div>

          <div className="mt-2.5 p-2.5 rounded-lg bg-moss-tint/70 border border-moss/10 flex items-start gap-2 text-[11.5px] text-stone">
            <Sparkles size={13} className="text-moss shrink-0 mt-0.5" />
            <span>
              If you originally created your account with Google, you don't need a password reset — clicking above logs you in immediately.
            </span>
          </div>
        </>
      )}

      <p className="auth-switch">
        Remember your password?{" "}
        <Link
          to="/login"
          className="text-moss font-medium hover:text-moss-deep"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

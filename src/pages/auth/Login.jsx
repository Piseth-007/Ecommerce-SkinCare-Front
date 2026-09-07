import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import AuthShell, {
  AuthField,
  AuthInput,
} from "../../components/auth/AuthShell";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleBtnRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const redirectTo = location.state?.from || "/";
      navigate(redirectTo);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleResponse = async (response) => {
    setError("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle(response.credential);
      const redirectTo = location.state?.from || "/";
      navigate(redirectTo);
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
      console.warn("VITE_GOOGLE_CLIENT_ID is not set — Google sign-in disabled.");
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
      eyebrow="Welcome back"
      title="Your skin, your ritual."
      description="Sign in to continue your thoughtful skincare routine."
      visualTitle="Small rituals. Visible results."
      visualCopy="Formulas made to make your everyday routine feel considered, calm, and restorative."
      badge="Member Ritual"
      quote={{
        text: "The only routine that calmed my barrier within days. Completely irreplaceable.",
        author: "Sophia L. — Verified Routine Member",
      }}
      tags={["✦ 100% Active Botanicals", "Dermatologist Tested", "Cruelty-Free"]}
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <AuthField label="Email">
          <AuthInput
            icon={Mail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
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
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </AuthField>

        <div className="auth-form-meta">
          <Link
            to="/forgot-password"
            className="text-[12px] text-moss hover:text-moss-deep font-medium transition-colors"
          >
            Forgot password?
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

      <div className="auth-divider">
        <span>or</span>
      </div>

      <div className="w-full flex justify-center min-h-[40px]">
        {googleLoading ? (
          <div className="flex items-center gap-2 text-[13px] text-stone py-2">
            <Loader2 size={15} className="animate-spin text-moss" />
            <span>Connecting to Google…</span>
          </div>
        ) : (
          <div ref={googleBtnRef} className="w-full [&>div]:!w-full flex justify-center" />
        )}
      </div>

      <p className="auth-switch">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-moss font-medium hover:text-moss-deep"
        >
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
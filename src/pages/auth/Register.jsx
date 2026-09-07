import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import AuthShell, {
  AuthField,
  AuthInput,
} from "../../components/auth/AuthShell";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const passwordsMatch =
    form.password_confirmation.length > 0 &&
    form.password === form.password_confirmation;
  const passwordsMismatch =
    form.password_confirmation.length > 0 &&
    form.password !== form.password_confirmation;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (form.password !== form.password_confirmation) {
      setErrors({
        password_confirmation: ["Passwords do not match"],
      });
      return;
    }

    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setErrors(
        err.response?.data?.errors || {
          general: [err.response?.data?.message || "Registration failed"],
        },
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleResponse = async (response) => {
    setErrors({});
    setGoogleLoading(true);
    try {
      await loginWithGoogle(response.credential);
      navigate("/");
    } catch (err) {
      setErrors({
        general: [
          err.response?.data?.message ||
            "Google sign-up failed. Please try again.",
        ],
      });
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
        text: "signup_with",
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
      eyebrow="New here?"
      title="Make space for your ritual."
      description="Create an account and find skincare that fits your everyday."
      visualTitle="A gentler way to glow."
      visualCopy="Build a routine around considered ingredients, calm textures, and the little moments that belong to you."
      imageUrl="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1200&q=80"
      badge="Welcome Ritual"
      quote={{
        text: "I simplified my routine down to Botaniq and my skin has never been more balanced and radiant.",
        author: "Camille D. — Verified Member",
      }}
      tags={["✦ 100% Botanical Extracts", "Dermatologist Tested", "Microbiome Gentle"]}
      reverse
      compact
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <AuthField label="Full name" error={errors.name}>
          <AuthInput
            icon={User}
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Jane Doe"
            autoComplete="name"
            required
          />
        </AuthField>

        <AuthField label="Email" error={errors.email}>
          <AuthInput
            icon={Mail}
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </AuthField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AuthField label="Password" error={errors.password}>
            <AuthInput
              icon={Lock}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 chars"
              autoComplete="new-password"
              required
            />
          </AuthField>

          <AuthField
            label="Confirm password"
            error={errors.password_confirmation}
          >
            <AuthInput
              icon={Lock}
              type="password"
              name="password_confirmation"
              value={form.password_confirmation}
              onChange={handleChange}
              placeholder="Repeat password"
              autoComplete="new-password"
              required
            />
          </AuthField>
        </div>

        {/* Real-time match feedback */}
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

        {errors.general && (
          <div className="auth-alert">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errors.general[0]}</span>
          </div>
        )}

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Creating account…</span>
            </>
          ) : (
            "Create account"
          )}
        </button>

        <p className="text-[11px] text-stone text-center leading-relaxed mt-0.5">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
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
        Already have an account?{" "}
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
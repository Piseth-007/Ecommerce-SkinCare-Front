import { useState } from "react";
import { Link } from "react-router-dom";
import { Leaf, ArrowRight, ShieldCheck, Check } from "lucide-react";
import { createElement } from "react";  
const SOCIAL_ICONS = {
  instagram: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M15 3h-2a5 5 0 0 0-5 5v3H6v4h2v6h4v-6h3l1-4h-4V8a1 1 0 0 1 1-1h3z" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M18.9 3H21l-6.6 7.5L22 21h-6.3l-4.9-6.4L5.2 21H3l7-8-7-10h6.4l4.4 5.9L18.9 3zM17.8 19h1.2L7.9 5H6.6l11.2 14z" />
    </svg>
  ),
  youtube: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <rect x="2.5" y="6" width="19" height="12" rx="3" />
      <path d="M10.5 9.5 15 12l-4.5 2.5z" fill="currentColor" stroke="none" />
    </svg>
  ),
};

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();

    if (!email.trim()) return;

    // TODO: wire to a real newsletter endpoint once one exists on the backend
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="border-t border-hairline bg-surface">
      {/* Newsletter strip */}
      <div className="border-b border-hairline bg-moss-tint">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="font-display text-[20px] font-medium text-ink mb-1">
              Skincare notes, in your inbox
            </p>
            <p className="text-[13px] text-stone">
              New arrivals, restocks, and the occasional ingredient deep-dive.
              No spam.
            </p>
          </div>

          {subscribed ? (
            <div className="flex items-center gap-2 text-[13.5px] font-medium text-moss-deep">
              <span className="w-6 h-6 rounded-full bg-surface flex items-center justify-center">
                <Check size={13} strokeWidth={2.5} />
              </span>
              You're on the list
            </div>
          ) : (
            <form
              onSubmit={handleSubscribe}
              className="flex w-full lg:w-auto max-w-sm gap-2"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 min-w-0 px-4 py-2.5 rounded-lg border border-hairline bg-surface text-[13.5px] text-ink placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-moss/25 focus:border-moss transition-colors"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-moss text-white text-[13px] font-medium hover:bg-moss-deep active:scale-[0.98] transition-all shrink-0"
              >
                Subscribe
                <ArrowRight size={14} strokeWidth={2} />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Link columns */}
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-3">
            <Leaf size={18} className="text-moss" strokeWidth={1.75} />
            <span className="font-display text-[18px] font-medium text-ink">
              Botaniq
            </span>
          </Link>

          <p className="text-[13px] text-stone leading-relaxed max-w-xs mb-5">
            Thoughtfully formulated skincare for every skin type, made with
            clean ingredients and backed by real reviews.
          </p>

          <div className="flex items-center gap-2">
            <SocialLink platform="instagram" label="Instagram" href="#" />
            <SocialLink platform="facebook" label="Facebook" href="#" />
            <SocialLink platform="twitter" label="Twitter" href="#" />
            <SocialLink platform="youtube" label="YouTube" href="#" />
          </div>
        </div>

        <FooterColumn
          title="Shop"
          links={[
            { label: "All products", to: "/products" },
            { label: "Categories", to: "/categories" },
            { label: "Brands", to: "/brands" },
            { label: "Best rated", to: "/products?sort=rating" },
          ]}
        />

        <FooterColumn
          title="Company"
          links={[
            { label: "About us", to: "/about" },
            { label: "Contact", to: "/contact" },
          ]}
        />

        <FooterColumn
          title="Account"
          links={[
            { label: "My orders", to: "/orders" },
            { label: "My profile", to: "/profile" },
            { label: "Sign in", to: "/login" },
          ]}
        />
      </div>

      {/* Bottom bar */}
      <div className="border-t border-hairline">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-stone font-mono">
            © {new Date().getFullYear()} Botaniq. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <Link
              to="/privacy"
              className="text-[12px] text-stone hover:text-ink transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-[12px] text-stone hover:text-ink transition-colors"
            >
              Terms of Service
            </Link>

            <span className="flex items-center gap-1.5 text-[11px] font-medium text-stone">
              <ShieldCheck size={13} className="text-moss" strokeWidth={1.75} />
              Secured by KHQR
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-stone mb-4">
        {title}
      </p>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="text-[13px] text-ink hover:text-moss-deep transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({ platform, label, href }) {
  return createElement(
    "a",
    {
      href,
      target: "_blank",
      rel: "noopener noreferrer",
      "aria-label": label,
      className:
        "w-8 h-8 rounded-lg border border-hairline flex items-center justify-center text-stone hover:text-moss hover:border-moss/40 hover:bg-moss-tint transition-colors [&>svg]:w-3.5 [&>svg]:h-3.5",
    },
    SOCIAL_ICONS[platform],
  );
}

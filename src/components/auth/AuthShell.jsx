import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Leaf, Sparkles, ShieldCheck } from "lucide-react";
import { useStoreSettings } from "../../context/StoreSettingsContext";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1608248597359-052062638843?auto=format&fit=crop&w=1200&q=80";

const smoothEase = [0.22, 1, 0.36, 1];

const cardVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

const textVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

const layoutTransition = { duration: 0.6, ease: smoothEase };
const fadeTransition = { duration: 0.5, ease: smoothEase };

export default function AuthShell({
  children,
  eyebrow,
  title,
  description,
  visualTitle,
  visualCopy,
  imageUrl = DEFAULT_IMAGE,
  quote,
  badge = "Thoughtful Skincare",
  tags = ["✦ 100% Botanical", "Dermatologist Tested", "Cruelty-Free"],
  reverse = false,
  compact = false,
}) {
  const store = useStoreSettings();
  const storeName = store?.name || "Botaniq";

  return (
    <main className="auth-page px-4 py-8 sm:px-6 sm:py-12">
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={layoutTransition}
        className={`auth-shell ${compact ? "auth-shell-compact" : ""}`}
      >
        <section
          className="auth-form-panel"
          style={{ order: reverse ? 2 : 1 }}
        >
          {/* Top navigation header: Brand + Back to shop */}
          <div className="auth-nav-header">
            <Link to="/" className="auth-brand-link" aria-label={`${storeName} Home`}>
              <div className="auth-brand-mark">
                <Leaf size={18} strokeWidth={1.9} />
              </div>
              <span className="auth-brand-name">{storeName}</span>
            </Link>

            <Link to="/" className="auth-back-link">
              <ArrowLeft size={14} />
              <span>Back to shop</span>
            </Link>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={title}
              variants={textVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={fadeTransition}
              className="flex flex-col flex-1"
            >
              <div className="auth-heading">
                {eyebrow && <p className="auth-eyebrow">{eyebrow}</p>}
                <h1>{title}</h1>
                {description && (
                  <p className="auth-description">{description}</p>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-center">
                {children}
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        <aside
          className="auth-visual-panel"
          style={{
            backgroundImage: `url(${imageUrl})`,
            order: reverse ? 1 : 2,
          }}
        >
          <div className="auth-visual-overlay" />
          <AnimatePresence mode="wait">
            <motion.div
              key={visualTitle}
              className="auth-visual-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fadeTransition}
            >
              <div className="auth-visual-badge">
                <Sparkles size={14} />
                <span>{badge}</span>
              </div>

              <div className="my-auto py-6">
                <p className="auth-visual-kicker">A little ritual, every day</p>
                <h2>{visualTitle}</h2>
                <p>{visualCopy}</p>

                {quote && (
                  <div className="auth-visual-quote-card">
                    <p className="auth-visual-quote-text">"{quote.text}"</p>
                    {quote.author && (
                      <p className="auth-visual-quote-author">
                        <ShieldCheck size={13} className="text-moss-tint shrink-0" />
                        <span>{quote.author}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="auth-visual-line">
                <div className="auth-visual-tags">
                  {tags.map((tag, idx) => (
                    <span key={idx} className="opacity-90">
                      {tag}
                    </span>
                  ))}
                </div>
                <ArrowRight size={16} className="shrink-0 ml-2 opacity-75" />
              </div>
            </motion.div>
          </AnimatePresence>
        </aside>
      </motion.div>
    </main>
  );
}

export function AuthField({
  label,
  error,
  required = false,
  hint,
  children,
  className = "",
}) {
  const errorMessage = Array.isArray(error) ? error[0] : error;

  return (
    <div className={`auth-field ${className}`}>
      {label && (
        <label>
          {label}
          {required && <span className="text-clay ml-1">*</span>}
        </label>
      )}
      {children}
      {hint && !errorMessage && (
        <p className="text-[11.5px] text-stone mt-1">{hint}</p>
      )}
      {errorMessage && (
        <motion.p
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          className="auth-field-error"
        >
          {errorMessage}
        </motion.p>
      )}
    </div>
  );
}

export function AuthInput({
  icon: Icon,
  type = "text",
  className = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const effectiveType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="auth-input-wrapper">
      {Icon && (
        <span className="auth-input-icon">
          <Icon size={16} strokeWidth={1.8} />
        </span>
      )}
      <input
        type={effectiveType}
        className={`auth-input ${Icon ? "has-icon" : ""} ${isPassword ? "has-toggle" : ""} ${className}`}
        {...props}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="auth-input-toggle"
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      )}
    </div>
  );
}

export const authInputClass = "auth-input";

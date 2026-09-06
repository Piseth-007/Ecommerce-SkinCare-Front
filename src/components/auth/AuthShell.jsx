import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Leaf, Sparkles } from "lucide-react";

const imageUrl =
  "https://images.unsplash.com/photo-1556229010-6c3f2c9c5c8b?auto=format&fit=crop&w=1200&q=85";

const smoothEase = [0.22, 1, 0.36, 1]; // ease-out-expo, no overshoot

const cardVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const textVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

const layoutTransition = { duration: 0.85, ease: smoothEase };
const fadeTransition = { duration: 0.85, ease: smoothEase };

export default function AuthShell({
  children,
  eyebrow,
  title,
  description,
  visualTitle,
  visualCopy,
  reverse = false,
  compact = false,
}) {
  return (
    <main className="auth-page px-4 py-8 sm:px-6 sm:py-12">
      <motion.div
        layout="position"
        layoutId="auth-card"
        variants={cardVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={layoutTransition}
        className={`auth-shell ${compact ? "auth-shell-compact" : ""}`}
      >
        <motion.section
          layout="position"
          layoutId="auth-form-panel"
          transition={layoutTransition}
          className="auth-form-panel"
          style={{ order: reverse ? 2 : 1 }}
        >
          <div className="auth-brand-mark">
            <Leaf size={17} strokeWidth={1.8} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={title}
              variants={textVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={fadeTransition}
            >
              <div className="auth-heading">
                <p className="auth-eyebrow">{eyebrow}</p>
                <h1>{title}</h1>
                {description && (
                  <p className="auth-description">{description}</p>
                )}
              </div>
              {children}
            </motion.div>
          </AnimatePresence>
        </motion.section>

        <motion.aside
          layout="position"
          layoutId="auth-visual-panel"
          transition={layoutTransition}
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
                <Sparkles size={15} />
                <span>Thoughtful skincare</span>
              </div>
              <div>
                <p className="auth-visual-kicker">A little ritual, every day</p>
                <h2>{visualTitle}</h2>
                <p>{visualCopy}</p>
              </div>
              <div className="auth-visual-line">
                <span>Care for your skin</span>
                <ArrowRight size={16} />
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.aside>
      </motion.div>
    </main>
  );
}

export function AuthField({ label, error, children }) {
  const errorMessage = Array.isArray(error) ? error[0] : error;

  return (
    <div className="auth-field">
      <label>{label}</label>
      {children}
      {errorMessage && <p className="auth-field-error">{errorMessage}</p>}
    </div>
  );
}

export const authInputClass = "auth-input";

import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Leaf,
  Sparkles,
  ArrowUp,
  RefreshCw,
} from "lucide-react";
import api from "../../api/axios";
import ProductCard from "../../components/storefront/ProductCart";

const INGREDIENTS = [
  "Niacinamide",
  "Centella Asiatica",
  "Squalane",
  "Green Tea",
  "Hyaluronic Acid",
  "Ceramides",
  "Vitamin C",
  "Panthenol",
];

// Hardened scroll-reveal: falls back to visible after a timeout so a section
// can never get stuck at opacity-0 if the observer doesn't fire.
function useReveal(threshold = 0.15, fallbackMs = 1000) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);

    const fallback = setTimeout(() => setVisible(true), fallbackMs);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, [threshold, fallbackMs]);

  return [ref, visible];
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight =
        (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight;

      setProgress(
        scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0,
      );
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return progress;
}

function useBackToTop(threshold = 480) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > threshold);

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return show;
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [productsError, setProductsError] = useState(false);
  const [categoriesError, setCategoriesError] = useState(false);

  const loadProducts = useCallback(() => {
    setLoadingProducts(true);
    setProductsError(false);

    return api
      .get("/products", { params: { sort: "newest" } })
      .then((res) =>
        setProducts((res.data?.data || res.data || []).slice(0, 8)),
      )
      .catch(() => setProductsError(true))
      .finally(() => setLoadingProducts(false));
  }, []);

  const loadCategories = useCallback(() => {
    setLoadingCategories(true);
    setCategoriesError(false);

    return api
      .get("/categories")
      .then((res) => setCategories((res.data || []).slice(0, 5)))
      .catch(() => setCategoriesError(true))
      .finally(() => setLoadingCategories(false));
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  const [trustRef, trustVisible] = useReveal(0.1, 400);
  const [categoriesRef, categoriesVisible] = useReveal();
  const [journalRef, journalVisible] = useReveal();
  const [arrivalsRef, arrivalsVisible] = useReveal();

  const scrollProgress = useScrollProgress();
  const showBackToTop = useBackToTop();

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div>
      <style>{`
        @keyframes botaniq-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .botaniq-marquee-track {
          animation: botaniq-marquee 26s linear infinite;
        }
        .botaniq-marquee-wrap:hover .botaniq-marquee-track {
          animation-play-state: paused;
        }
        @keyframes botaniq-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
        .botaniq-bounce {
          animation: botaniq-bounce 1.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .botaniq-marquee-track,
          .botaniq-bounce {
            animation: none;
          }
        }
      `}</style>

      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-transparent">
        <div
          className="h-full bg-moss transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Hero */}
      <section className="relative border-b border-hairline overflow-hidden">
        <svg
          className="pointer-events-none absolute -right-24 -top-24 w-[520px] h-[520px] text-moss/[0.06]"
          viewBox="0 0 200 200"
          fill="currentColor"
        >
          <path d="M100 10c40 0 80 35 80 90s-40 90-80 90-80-35-80-90S60 10 100 10Z" />
        </svg>

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-14 text-center">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-moss mb-5">
            <Leaf size={12} strokeWidth={2} />
            Clean, effective skincare
          </p>

          <h1 className="font-display text-[32px] sm:text-[46px] leading-[1.1] font-medium text-ink mb-5 max-w-2xl mx-auto text-balance">
            Skincare that respects{" "}
            <span className="italic text-moss-deep">your skin's story</span>
          </h1>

          <p className="text-[15.5px] text-stone max-w-md mx-auto mb-9 leading-relaxed">
            Thoughtfully formulated products for every skin type, backed by real
            reviews from real customers.
          </p>

          <div className="flex items-center justify-center gap-3 mb-3">
            <Link
              to="/products"
              className="group flex items-center gap-2 px-6 py-3 rounded-lg bg-moss text-white text-[14px] font-medium hover:bg-moss-deep active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40 focus-visible:ring-offset-2"
            >
              Shop the collection
              <ArrowRight
                size={15}
                strokeWidth={2}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          <div className="botaniq-bounce flex justify-center pt-6 text-stone/50">
            <ArrowDown />
          </div>
        </div>

        {/* Signature: ingredient ticker */}
        <div className="botaniq-marquee-wrap relative border-t border-hairline bg-paper/60 overflow-hidden">
          <div className="botaniq-marquee-track flex w-max py-3.5">
            {[...INGREDIENTS, ...INGREDIENTS].map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-2 px-6 text-[12px] font-medium uppercase tracking-[0.08em] text-stone whitespace-nowrap"
              >
                <Sparkles
                  size={11}
                  className="text-moss/60"
                  strokeWidth={1.75}
                />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section
        ref={trustRef}
        className={`border-b border-hairline bg-surface motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out ${
          trustVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TrustItem icon={Leaf} label="Clean formulations" />
          <TrustItem icon={ShieldCheck} label="Verified reviews only" />
          <TrustItem icon={Truck} label="Fast delivery in Phnom Penh" />
        </div>
      </section>

      {/* Categories — asymmetric bento */}
      <section
        ref={categoriesRef}
        className={`max-w-6xl mx-auto px-6 py-16 motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out ${
          categoriesVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6"
        }`}
      >
        <div className="flex items-baseline justify-between gap-2 mb-6">
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-[22px] font-medium text-ink">
              Shop by category
            </h2>
            {!loadingCategories && categories.length > 0 && (
              <span className="text-[12px] text-stone font-mono">
                {String(categories.length).padStart(2, "0")}
              </span>
            )}
          </div>
        </div>

        {loadingCategories ? (
          <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-4 md:auto-rows-[110px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`animate-pulse bg-hairline/30 rounded-xl ${
                  i === 0 ? "col-span-2 row-span-2 md:min-h-[240px]" : ""
                }`}
              />
            ))}
          </div>
        ) : categoriesError ? (
          <ErrorState
            message="Couldn't load categories."
            onRetry={loadCategories}
          />
        ) : categories.length === 0 ? (
          <p className="text-[13px] text-stone py-6">
            No categories to show yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-4 md:auto-rows-[110px]">
            {categories.map((cat, index) => (
              <Link
                key={cat.id}
                to={`/products?category_id=${cat.id}`}
                className={`group relative flex items-end bg-paper border border-hairline rounded-xl p-5 overflow-hidden hover:border-moss/40 hover:bg-moss-tint transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40 ${
                  index === 0 ? "col-span-2 row-span-2 md:min-h-[240px]" : ""
                }`}
              >
                <span
                  className={`absolute -right-3 -top-3 font-display italic text-moss/[0.08] group-hover:text-moss/[0.14] transition-colors select-none ${
                    index === 0 ? "text-[120px]" : "text-[64px]"
                  }`}
                >
                  {cat.name?.[0] || "?"}
                </span>

                <p
                  className={`relative font-display font-medium text-ink group-hover:text-moss-deep transition-colors ${
                    index === 0 ? "text-[20px]" : "text-[14px]"
                  }`}
                >
                  {cat.name}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Editorial note */}
      <section
        ref={journalRef}
        className={`border-y border-hairline bg-surface motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out ${
          journalVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6"
        }`}
      >
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="font-display italic text-[22px] sm:text-[26px] leading-[1.4] text-ink text-balance">
            "Good skincare isn't about chasing trends — it's about listening to
            what your skin needs today, and giving it exactly that."
          </p>
          <p className="mt-4 text-[12px] uppercase tracking-[0.1em] text-stone">
            The Botaniq Journal
          </p>
        </div>
      </section>

      {/* New arrivals */}
      <section
        ref={arrivalsRef}
        className={`max-w-6xl mx-auto px-6 py-20 motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out ${
          arrivalsVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6"
        }`}
      >
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display text-[22px] font-medium text-ink">
            New arrivals
          </h2>
          <Link
            to="/products"
            className="group flex items-center gap-1 text-[13px] font-medium text-moss hover:text-moss-deep transition-colors"
          >
            View all
            <ArrowRight
              size={13}
              strokeWidth={2}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-hairline/40 rounded-xl mb-3" />
                <div className="h-2.5 w-16 bg-hairline/50 rounded mb-2" />
                <div className="h-3.5 w-3/4 bg-hairline/60 rounded" />
              </div>
            ))}
          </div>
        ) : productsError ? (
          <ErrorState
            message="Couldn't load new arrivals."
            onRetry={loadProducts}
          />
        ) : products.length === 0 ? (
          <p className="text-[13.5px] text-stone py-12 text-center">
            New products will appear here soon.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((p, i) => (
              <div
                key={p.id}
                className={`motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out ${
                  arrivalsVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Back to top */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        className={`fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-moss text-white shadow-[0_6px_18px_rgba(63,88,67,0.35)] flex items-center justify-center hover:bg-moss-deep active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40 focus-visible:ring-offset-2 ${
          showBackToTop
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <ArrowUp size={18} strokeWidth={2} />
      </button>
    </div>
  );
}

function TrustItem({ icon: Icon, label }) {
  return (
    <div className="group flex items-center justify-center gap-2.5 py-2 rounded-lg hover:bg-moss-tint transition-colors motion-safe:hover:-translate-y-0.5 motion-safe:transition-transform">
      <span className="w-7 h-7 rounded-full bg-moss-tint flex items-center justify-center group-hover:bg-surface transition-colors">
        <Icon size={14} className="text-moss" strokeWidth={1.75} />
      </span>
      <span className="text-[13px] font-medium text-stone group-hover:text-ink transition-colors">
        {label}
      </span>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[13px] text-clay bg-clay-tint border border-clay/15 rounded-lg px-4 py-3">
      <span>{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1.5 font-medium underline underline-offset-2 shrink-0"
      >
        <RefreshCw size={13} strokeWidth={1.75} />
        Retry
      </button>
    </div>
  );
}

function ArrowDown() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        d="M12 5v14M6 13l6 6 6-6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

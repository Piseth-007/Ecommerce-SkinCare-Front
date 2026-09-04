import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Leaf,
  Sparkles,
  ArrowUp,
  RefreshCw,
  Heart,
  Star,
  MousePointer2,
} from "lucide-react";

import api from "../../api/axios";
import ProductCard from "../../components/storefront/ProductCart";

/* =========================================================
   CONSTANTS
========================================================= */

const CACHE_VERSION = "botaniq-home-v2";

const PRODUCT_CACHE_KEY = `${CACHE_VERSION}:products`;
const CATEGORY_CACHE_KEY = `${CACHE_VERSION}:categories`;

const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

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

/* =========================================================
   CACHE HELPERS
========================================================= */

function readCache(key) {
  try {
    const raw = sessionStorage.getItem(key);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.data)) {
      return null;
    }

    return {
      data: parsed.data,
      cachedAt: Number(parsed.cachedAt) || 0,
    };
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        data,
        cachedAt: Date.now(),
      }),
    );
  } catch {
    // Storage can fail in private browsing or when quota is exceeded.
  }
}

function isCacheFresh(cachedAt) {
  if (!cachedAt) return false;

  return Date.now() - cachedAt < CACHE_TTL;
}

/* =========================================================
   CACHED RESOURCE HOOK
========================================================= */

function useCachedResource({ cacheKey, fetcher, initialData = [] }) {
  const initialCache = useMemo(() => readCache(cacheKey), [cacheKey]);

  const [data, setData] = useState(initialCache?.data ?? initialData);

  const [loading, setLoading] = useState(!initialCache?.data?.length);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(false);

  const mountedRef = useRef(false);
  const controllerRef = useRef(null);
  const dataRef = useRef(initialCache?.data ?? initialData);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      controllerRef.current?.abort();
    };
  }, []);

  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      controllerRef.current?.abort();

      const controller = new AbortController();

      controllerRef.current = controller;

      const hasExistingData = dataRef.current.length > 0;

      if (silent || hasExistingData) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(false);

      try {
        const result = await fetcher(controller.signal);

        if (!mountedRef.current) {
          return;
        }

        const nextData = Array.isArray(result) ? result : [];

        dataRef.current = nextData;

        setData(nextData);

        writeCache(cacheKey, nextData);
      } catch (err) {
        if (err?.name === "CanceledError") {
          return;
        }

        if (err?.name === "AbortError") {
          return;
        }

        if (!mountedRef.current) {
          return;
        }

        setError(true);
      } finally {
        if (!mountedRef.current) {
          return;
        }

        setLoading(false);
        setRefreshing(false);
      }
    },
    [cacheKey, fetcher],
  );

  return {
    data,
    setData,
    loading,
    refreshing,
    error,
    refresh,
    hasData: data.length > 0,
    cacheFresh: isCacheFresh(initialCache?.cachedAt),
  };
}

/* =========================================================
   REVEAL HOOK
========================================================= */

function useReveal(threshold = 0.12, fallbackMs = 1200) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

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
      {
        threshold,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    observer.observe(element);

    const fallback = setTimeout(() => {
      setVisible(true);
    }, fallbackMs);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, [threshold, fallbackMs]);

  return [ref, visible];
}

/* =========================================================
   SCROLL PROGRESS
========================================================= */

function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;

      window.requestAnimationFrame(() => {
        const documentElement = document.documentElement;

        const scrollTop = documentElement.scrollTop || document.body.scrollTop;

        const scrollHeight =
          Math.max(documentElement.scrollHeight, document.body.scrollHeight) -
          documentElement.clientHeight;

        const percentage =
          scrollHeight > 0
            ? Math.min(100, (scrollTop / scrollHeight) * 100)
            : 0;

        setProgress(percentage);

        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return progress;
}

/* =========================================================
   BACK TO TOP
========================================================= */

function useBackToTop(threshold = 480) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;

      window.requestAnimationFrame(() => {
        setShow(window.scrollY > threshold);
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);

  return show;
}

/* =========================================================
   REDUCED MOTION
========================================================= */

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => {
      setReducedMotion(mediaQuery.matches);
    };

    update();

    mediaQuery.addEventListener?.("change", update);

    return () => {
      mediaQuery.removeEventListener?.("change", update);
    };
  }, []);

  return reducedMotion;
}

/* =========================================================
   HOME
========================================================= */

export default function Home() {
  /* =======================================================
     RESOURCES
  ======================================================= */

  const fetchProducts = useCallback(async (signal) => {
    const response = await api.get("/products", {
      params: {
        sort: "newest",
      },
      signal,
    });

    return (response.data?.data || response.data || []).slice(0, 8);
  }, []);

  const fetchCategories = useCallback(async (signal) => {
    const response = await api.get("/categories", {
      signal,
    });

    return (response.data?.data || response.data || []).slice(0, 5);
  }, []);

  const productsResource = useCachedResource({
    cacheKey: PRODUCT_CACHE_KEY,
    fetcher: fetchProducts,
  });

  const categoriesResource = useCachedResource({
    cacheKey: CATEGORY_CACHE_KEY,
    fetcher: fetchCategories,
  });

  const {
    data: products,
    loading: loadingProducts,
    refreshing: refreshingProducts,
    error: productsError,
    refresh: refreshProducts,
    hasData: hasProducts,
  } = productsResource;

  const {
    data: categories,
    loading: loadingCategories,
    refreshing: refreshingCategories,
    error: categoriesError,
    refresh: refreshCategories,
    hasData: hasCategories,
  } = categoriesResource;

  const refreshing = refreshingProducts || refreshingCategories;

  /* =======================================================
     REVEALS
  ======================================================= */

  const [heroRef, heroVisible] = useReveal(0.05, 500);

  const [trustRef, trustVisible] = useReveal(0.1, 700);

  const [categoriesRef, categoriesVisible] = useReveal();

  const [journalRef, journalVisible] = useReveal();

  const [arrivalsRef, arrivalsVisible] = useReveal();

  /* =======================================================
     GLOBAL UI
  ======================================================= */

  const scrollProgress = useScrollProgress();

  const showBackToTop = useBackToTop();

  const reducedMotion = usePrefersReducedMotion();

  /* =======================================================
     MOUSE PARALLAX
  ======================================================= */

  const [mouse, setMouse] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (reducedMotion) return;

    let frame = null;

    const handleMouseMove = (event) => {
      if (frame) return;

      frame = requestAnimationFrame(() => {
        const x = event.clientX / window.innerWidth - 0.5;

        const y = event.clientY / window.innerHeight - 0.5;

        setMouse({
          x,
          y,
        });

        frame = null;
      });
    };

    window.addEventListener("mousemove", handleMouseMove, {
      passive: true,
    });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);

      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [reducedMotion]);

  /* =======================================================
     INITIAL DATA LOAD
  ======================================================= */

  useEffect(() => {
    /*
      If cached data exists, render it immediately and
      quietly refresh it in the background.

      If no cache exists, show skeletons.
    */

    refreshProducts({
      silent: hasProducts,
    });

    refreshCategories({
      silent: hasCategories,
    });
  }, [refreshProducts, refreshCategories, hasProducts, hasCategories]);

  /* =======================================================
     REFRESH WHEN TAB BECOMES VISIBLE
  ======================================================= */

  const lastVisibilityRefresh = useRef(0);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      const now = Date.now();

      /*
        Prevent excessive API requests when
        switching tabs repeatedly.
      */

      if (now - lastVisibilityRefresh.current < 60 * 1000) {
        return;
      }

      lastVisibilityRefresh.current = now;

      refreshProducts({
        silent: true,
      });

      refreshCategories({
        silent: true,
      });
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshProducts, refreshCategories]);

  /* =======================================================
     ACTIONS
  ======================================================= */

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [reducedMotion]);

  const scrollToProducts = useCallback(() => {
    document.getElementById("new-arrivals")?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [reducedMotion]);

  /* =======================================================
     PRODUCT LOADING STATE
  ======================================================= */

  const showProductSkeleton = loadingProducts && products.length === 0;

  const showCategorySkeleton = loadingCategories && categories.length === 0;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="overflow-hidden bg-paper text-ink">
      {/* ===================================================
          ANIMATION STYLES
      =================================================== */}

      <style>{`
  @keyframes botaniq-marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  @keyframes botaniq-float {
    0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
    50% { transform: translate3d(0, -14px, 0) rotate(3deg); }
  }

  @keyframes botaniq-float-reverse {
    0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
    50% { transform: translate3d(0, 12px, 0) rotate(-4deg); }
  }

  @keyframes botaniq-pulse {
    0%, 100% { opacity: .30; transform: scale(1); }
    50% { opacity: .60; transform: scale(1.08); }
  }

  @keyframes botaniq-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(7px); }
  }

  @keyframes botaniq-shimmer {
    0% { transform: translateX(-120%); }
    100% { transform: translateX(120%); }
  }

  @keyframes botaniq-fade-up {
    from { opacity: 0; transform: translate3d(0, 14px, 0); }
    to { opacity: 1; transform: translate3d(0, 0, 0); }
  }

  @keyframes botaniq-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* ---------- HERO BACKGROUND WAVES (LEFT -> RIGHT) ---------- */

  @keyframes botaniq-wave-scroll-ltr {
    from { transform: translateX(-50%); }
    to { transform: translateX(0); }
  }

  @keyframes botaniq-wave-drift {
    0%, 100% { transform: translate3d(0, 0, 0) scaleY(1); }
    50% { transform: translate3d(0, -6px, 0) scaleY(1.04); }
  }

  @keyframes botaniq-wave-drift-reverse {
    0%, 100% { transform: translate3d(0, 0, 0) scaleY(1); }
    50% { transform: translate3d(0, 5px, 0) scaleY(0.97); }
  }

  @keyframes botaniq-wave-shimmer-sweep {
    0% { transform: translateX(-30%); opacity: 0; }
    50% { opacity: .5; }
    100% { transform: translateX(130%); opacity: 0; }
  }

  .botaniq-wave-scroll-slow {
    animation: botaniq-wave-scroll-ltr 26s linear infinite,
               botaniq-wave-drift 8s ease-in-out infinite;
    transform-origin: bottom;
  }

  .botaniq-wave-scroll-mid {
    animation: botaniq-wave-scroll-ltr 18s linear infinite,
               botaniq-wave-drift-reverse 7s ease-in-out infinite;
    transform-origin: bottom;
  }

  .botaniq-wave-scroll-fast {
    animation: botaniq-wave-scroll-ltr 12s linear infinite,
               botaniq-wave-drift 5.5s ease-in-out infinite;
    transform-origin: bottom;
  }

  .botaniq-wave-shimmer {
    animation: botaniq-wave-shimmer-sweep 6s ease-in-out infinite;
  }

  /* ---------- CTA BUTTON WAVES (LEFT -> RIGHT) ---------- */

  @keyframes botaniq-btn-wave-scroll-ltr {
    from { transform: translateX(-50%); }
    to { transform: translateX(0); }
  }

  @keyframes botaniq-btn-ripple {
    0% { transform: scale(0); opacity: 0.5; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  .botaniq-btn-wave {
    animation: botaniq-btn-wave-scroll-ltr 3.5s linear infinite;
  }

  .group:hover .botaniq-btn-wave {
    animation-duration: 1.6s;
  }

  .botaniq-btn-ripple {
    animation: botaniq-btn-ripple 1.8s ease-out infinite;
  }

  /* ---------- SHARED ---------- */

  .botaniq-marquee-track {
    animation: botaniq-marquee 28s linear infinite;
  }

  .botaniq-marquee-wrap:hover .botaniq-marquee-track {
    animation-play-state: paused;
  }

  .botaniq-float { animation: botaniq-float 7s ease-in-out infinite; }
  .botaniq-float-reverse { animation: botaniq-float-reverse 8s ease-in-out infinite; }
  .botaniq-pulse { animation: botaniq-pulse 5s ease-in-out infinite; }
  .botaniq-bounce { animation: botaniq-bounce 1.8s ease-in-out infinite; }
  .botaniq-shimmer { animation: botaniq-shimmer 2.4s ease-in-out infinite; }

  .botaniq-skeleton {
    position: relative;
    overflow: hidden;
    background: rgba(100, 110, 100, 0.10);
  }

  .botaniq-skeleton::after {
    content: "";
    position: absolute;
    inset: 0;
    width: 55%;
    transform: translateX(-120%);
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent);
    animation: botaniq-shimmer 1.7s ease-in-out infinite;
  }

  .botaniq-fade-up { animation: botaniq-fade-up .7s cubic-bezier(.22,1,.36,1) both; }
  .botaniq-fade { animation: botaniq-fade .5s ease-out both; }

  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }

  @media (prefers-reduced-motion: reduce) {
    .botaniq-marquee-track,
    .botaniq-float,
    .botaniq-float-reverse,
    .botaniq-pulse,
    .botaniq-bounce,
    .botaniq-shimmer,
    .botaniq-skeleton::after,
    .botaniq-fade-up,
    .botaniq-fade,
    .botaniq-wave-scroll-slow,
    .botaniq-wave-scroll-mid,
    .botaniq-wave-scroll-fast,
    .botaniq-wave-shimmer,
    .botaniq-btn-wave,
    .botaniq-btn-ripple {
      animation: none !important;
    }
  }
`}</style>

      {/* ===================================================
          REFRESH INDICATOR
      =================================================== */}

      <div
        className={`
          pointer-events-none
          fixed
          right-5
          top-20
          z-[90]
          flex
          items-center
          gap-2
          rounded-full
          border
          border-hairline
          bg-surface/90
          px-3
          py-2
          text-[10px]
          font-medium
          uppercase
          tracking-[0.14em]
          text-stone
          shadow-[0_10px_30px_rgba(40,55,43,0.08)]
          backdrop-blur-xl
          transition-all
          duration-500
          ${
            refreshing
              ? "translate-y-0 opacity-100"
              : "-translate-y-2 opacity-0"
          }
        `}
      >
        <RefreshCw size={12} className="animate-spin text-moss" />
        Updating
      </div>

      {/* ===================================================
          SCROLL PROGRESS
      =================================================== */}

      <div
        className="
          fixed
          left-0
          right-0
          top-0
          z-[100]
          h-[2px]
          bg-transparent
        "
      >
        <div
          className="
            h-full
            origin-left
            bg-moss
            transition-[width]
            duration-150
          "
          style={{
            width: `${scrollProgress}%`,
          }}
        />
      </div>

      {/* ===================================================
          HERO
      =================================================== */}

      <section
        ref={heroRef}
        className="
          relative
          min-h-[680px]
          overflow-hidden
          border-b
          border-hairline
        "
      >
        {/* Background glow */}
        <div
          className="
            pointer-events-none
            absolute
            -left-32
            top-20
            h-[420px]
            w-[420px]
            rounded-full
            bg-moss/[0.07]
            blur-3xl
            transition-transform
            duration-1000
          "
          style={{
            transform: reducedMotion
              ? undefined
              : `translate3d(${mouse.x * -25}px, ${mouse.y * -25}px, 0)`,
          }}
        />

        <div
          className="
            pointer-events-none
            absolute
            -right-40
            top-0
            h-[520px]
            w-[520px]
            rounded-full
            bg-sage/[0.10]
            blur-3xl
            transition-transform
            duration-1000
          "
          style={{
            transform: reducedMotion
              ? undefined
              : `translate3d(${mouse.x * 35}px, ${mouse.y * 35}px, 0)`,
          }}
        />

        {/* Floating circle */}
        <div
          className="
            botaniq-float
            pointer-events-none
            absolute
            right-[12%]
            top-24
            h-20
            w-20
            rounded-full
            border
            border-moss/10
          "
          style={{
            transform: reducedMotion
              ? undefined
              : `translate3d(${mouse.x * 12}px, ${mouse.y * 12}px, 0)`,
          }}
        />

        <div
          className="
            botaniq-float-reverse
            pointer-events-none
            absolute
            bottom-32
            left-[9%]
            h-12
            w-12
            rounded-full
            bg-moss/[0.06]
          "
          style={{
            transform: reducedMotion
              ? undefined
              : `translate3d(${mouse.x * -18}px, ${mouse.y * -18}px, 0)`,
          }}
        />

        {/* Organic background shape */}
        <svg
          className="
            pointer-events-none
            absolute
            -right-20
            -top-20
            h-[500px]
            w-[500px]
            text-moss/[0.055]
            transition-transform
            duration-1000
          "
          viewBox="0 0 200 200"
          fill="currentColor"
          style={{
            transform: reducedMotion
              ? undefined
              : `translate3d(${mouse.x * 18}px, ${mouse.y * 18}px, 0) rotate(${mouse.x * 4}deg)`,
          }}
        >
          <path d="M100 10c40 0 80 35 80 90s-40 90-80 90-80-35-80-90S60 10 100 10Z" />
        </svg>

        <div
          className="
            relative
            mx-auto
            flex
            min-h-[680px]
            max-w-6xl
            items-center
            px-6
            py-24
          "
        >
          <div
            className="
              grid
              w-full
              items-center
              gap-14
              lg:grid-cols-[1.05fr_.95fr]
            "
          >
            {/* HERO CONTENT */}
            <div
              className={`
                max-w-xl
                transition-all
                duration-1000
                ease-out
                ${heroVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
              `}
            >
              {/* Eyebrow */}
              <div
                className={`
                  mb-6
                  flex
                  items-center
                  gap-2
                  text-[11px]
                  font-medium
                  uppercase
                  tracking-[0.16em]
                  text-moss
                  transition-all
                  duration-700
                  ${heroVisible ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"}
                `}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-moss-tint">
                  <Leaf size={13} strokeWidth={1.8} />
                </span>
                Clean, effective skincare
              </div>

              {/* Heading */}
              <h1
                className={`
                  font-display
                  text-[42px]
                  font-medium
                  leading-[1.05]
                  tracking-[-0.025em]
                  text-ink
                  transition-all
                  delay-100
                  duration-1000
                  sm:text-[58px]
                  lg:text-[68px]
                  ${heroVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
                `}
              >
                Skincare that respects{" "}
                <span className="relative italic text-moss-deep">
                  your skin's story.
                  <span className="absolute -bottom-1 left-0 h-px w-full origin-left bg-moss/30" />
                </span>
              </h1>

              {/* Description */}
              <p
                className={`
                  mt-7
                  max-w-md
                  text-[15.5px]
                  leading-relaxed
                  text-stone
                  transition-all
                  delay-200
                  duration-1000
                  ${heroVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
                `}
              >
                Thoughtfully formulated products for every skin type,
                thoughtfully selected for your everyday ritual.
              </p>

              {/* CTA */}
              <div
                className={`
                  mt-9
                  flex
                  flex-wrap
                  items-center
                  gap-3
                  transition-all
                  delay-300
                  duration-1000
                  ${heroVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
                `}
              >
                <Link
                  to="/products"
                  className="
                    group
                    relative
                    flex
                    items-center
                    gap-2
                    overflow-hidden
                    rounded-lg
                    bg-moss
                    px-6
                    py-3.5
                    text-[14px]
                    font-medium
                    text-white
                    shadow-[0_10px_30px_rgba(63,88,67,0.18)]
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:bg-moss-deep
                    hover:shadow-[0_15px_35px_rgba(63,88,67,0.25)]
                    active:translate-y-0
                  "
                >
                  {/* Water wave layer 1 */}
                  <svg
                    className="
                      botaniq-btn-wave
                      pointer-events-none
                      absolute
                      -bottom-1
                      left-0
                      h-5
                      w-[200%]
                      text-white/[0.14]
                    "
                    viewBox="0 0 400 30"
                    preserveAspectRatio="none"
                    fill="currentColor"
                  >
                    <path d="M0,15 C40,25 60,5 100,15 C140,25 160,5 200,15 C240,25 260,5 300,15 C340,25 360,5 400,15 L400,30 L0,30 Z" />
                  </svg>

                  {/* Water wave layer 2 — same direction, slightly faster for depth */}
                  <svg
                    className="
                      botaniq-btn-wave
                      pointer-events-none
                      absolute
                      -bottom-0.5
                      left-0
                      h-4
                      w-[200%]
                      text-white/[0.10]
                    "
                    viewBox="0 0 400 30"
                    preserveAspectRatio="none"
                    fill="currentColor"
                    style={{ animationDuration: "2.6s" }}
                  >
                    <path d="M0,18 C50,8 70,28 120,18 C170,8 190,28 240,18 C290,8 310,28 360,18 C380,13 390,23 400,18 L400,30 L0,30 Z" />
                  </svg>

                  {/* Ripple pulse */}
                  <span
                    className="
                      botaniq-btn-ripple
                      pointer-events-none
                      absolute
                      left-[18%]
                      top-1/2
                      h-2
                      w-2
                      -translate-y-1/2
                      rounded-full
                      bg-white/40
                    "
                  />

                  {/* Shimmer sweep */}
                  <span
                    className="
                      botaniq-shimmer
                      absolute
                      inset-0
                      -translate-x-full
                      bg-white/10
                    "
                  />

                  <span className="relative">Shop the collection</span>

                  <ArrowRight
                    size={15}
                    className="
                      relative
                      transition-transform
                      duration-300
                      group-hover:translate-x-1
                    "
                  />
                </Link>

                <button
                  type="button"
                  onClick={scrollToProducts}
                  className="
                    group
                    flex
                    items-center
                    gap-2
                    rounded-lg
                    border
                    border-hairline
                    bg-surface/70
                    px-5
                    py-3.5
                    text-[14px]
                    font-medium
                    text-ink
                    backdrop-blur-sm
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:border-moss/30
                    hover:bg-moss-tint
                  "
                >
                  Explore products
                  <MousePointer2
                    size={14}
                    className="
                      text-stone
                      transition-all
                      duration-300
                      group-hover:rotate-12
                      group-hover:text-moss
                    "
                  />
                </button>
              </div>

              {/* Trust */}
              <div
                className={`
                  mt-9
                  flex
                  flex-wrap
                  items-center
                  gap-x-6
                  gap-y-3
                  text-[11px]
                  uppercase
                  tracking-[0.08em]
                  text-stone
                  transition-all
                  delay-500
                  duration-1000
                  ${heroVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
                `}
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles size={12} className="text-moss" />
                  Carefully selected
                </span>

                <span className="h-1 w-1 rounded-full bg-hairline" />

                <span className="flex items-center gap-1.5">
                  <Star size={12} className="text-moss" />
                  Customer loved
                </span>
              </div>
            </div>

            {/* HERO VISUAL */}
            <div
              className={`
                relative
                hidden
                h-[480px]
                transition-all
                delay-300
                duration-1000
                lg:block
                ${heroVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}
              `}
            >
              <div
                className="
                  absolute
                  left-[18%]
                  top-[12%]
                  h-[290px]
                  w-[290px]
                  rounded-full
                  bg-moss/[0.06]
                  blur-2xl
                "
                style={{
                  transform: reducedMotion
                    ? undefined
                    : `translate3d(${mouse.x * 20}px, ${mouse.y * 20}px, 0)`,
                }}
              />

              <div
                className="
                  absolute
                  left-[12%]
                  top-[8%]
                  h-[330px]
                  w-[330px]
                  rounded-[45%_55%_52%_48%]
                  border
                  border-white/70
                  bg-gradient-to-br
                  from-white/80
                  to-moss-tint/60
                  shadow-[0_30px_80px_rgba(63,88,67,0.12)]
                  backdrop-blur-md
                "
                style={{
                  transform: reducedMotion
                    ? undefined
                    : `translate3d(${mouse.x * -12}px, ${mouse.y * -12}px, 0) rotate(${mouse.x * 3}deg)`,
                }}
              />

              {/* Bottle */}
              <div
                className="botaniq-float absolute left-[31%] top-[19%] z-10"
                style={{ animationDelay: "-2s" }}
              >
                <div
                  className="
                    mx-auto
                    h-16
                    w-24
                    rounded-t-2xl
                    border
                    border-ink/10
                    bg-white
                    shadow-xl
                  "
                />

                <div
                  className="
                    relative
                    h-64
                    w-36
                    rounded-[20px_20px_30px_30px]
                    border
                    border-ink/10
                    bg-gradient-to-br
                    from-white
                    via-paper
                    to-moss-tint
                    shadow-[0_25px_45px_rgba(40,55,43,0.18)]
                  "
                >
                  <div
                    className="
                      absolute
                      bottom-5
                      left-4
                      right-4
                      top-14
                      flex
                      flex-col
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-moss/10
                      bg-white/70
                      text-center
                    "
                  >
                    <Leaf
                      size={25}
                      strokeWidth={1.2}
                      className="mb-3 text-moss"
                    />

                    <span className="font-display text-[15px] italic text-moss-deep">
                      BOTANIQ
                    </span>

                    <span className="mt-1 text-[7px] uppercase tracking-[0.18em] text-stone">
                      Skin ritual
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating card */}
              <div
                className="
                  botaniq-float
                  absolute
                  right-[4%]
                  top-[18%]
                  z-20
                  rounded-2xl
                  border
                  border-white/70
                  bg-white/80
                  px-4
                  py-3
                  shadow-[0_15px_35px_rgba(40,55,43,0.10)]
                  backdrop-blur-md
                "
                style={{ animationDelay: "-2s" }}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-moss-tint">
                    <Leaf size={13} className="text-moss" />
                  </span>

                  <div>
                    <p className="text-[10px] font-medium text-ink">
                      Gentle formulas
                    </p>
                    <p className="text-[9px] text-stone">Everyday friendly</p>
                  </div>
                </div>
              </div>

              {/* Floating card 2 */}
              <div
                className="
                  botaniq-float-reverse
                  absolute
                  bottom-[16%]
                  left-[2%]
                  z-20
                  rounded-2xl
                  border
                  border-white/70
                  bg-white/80
                  px-4
                  py-3
                  shadow-[0_15px_35px_rgba(40,55,43,0.10)]
                  backdrop-blur-md
                "
                style={{ animationDelay: "-3s" }}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-moss-tint">
                    <Heart size={13} className="text-moss" />
                  </span>

                  <div>
                    <p className="text-[10px] font-medium text-ink">
                      Made for rituals
                    </p>
                    <p className="text-[9px] text-stone">
                      Simple. Calm. Effective.
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="
                  absolute
                  bottom-[4%]
                  right-[14%]
                  h-24
                  w-24
                  rounded-full
                  border
                  border-moss/10
                "
              />
            </div>
          </div>

          {/* Discover */}
          <button
            type="button"
            onClick={scrollToProducts}
            className="
              botaniq-bounce
              absolute
              bottom-7
              left-1/2
              flex
              -translate-x-1/2
              flex-col
              items-center
              gap-2
              text-stone/50
              transition-colors
              hover:text-moss
              z-10
            "
            aria-label="Scroll to products"
          >
            <span className="text-[9px] uppercase tracking-[0.18em]">
              Discover
            </span>
            <ArrowDown />
          </button>
        </div>

        {/* ===============================================
            HERO BACKGROUND WAVES
            Three layered SVG waves, all scrolling
            left -> right at different speeds, plus a
            subtle vertical drift and a light shimmer
            sweep to feel like real moving water.
        =============================================== */}
        <div
          className="
            pointer-events-none
            absolute
            inset-x-0
            bottom-0
            h-44
            overflow-hidden
          "
          aria-hidden="true"
        >
          {/* Back layer — widest, slowest, faintest */}
          <svg
            className="
              botaniq-wave-scroll-slow
              absolute
              -bottom-4
              left-0
              h-full
              w-[200%]
              text-moss/[0.05]
            "
            viewBox="0 0 2400 220"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path
              d="M0,120 C200,180 400,60 600,120 C800,180 1000,60 1200,120
                 C1400,180 1600,60 1800,120 C2000,180 2200,60 2400,120
                 L2400,220 L0,220 Z"
            />
          </svg>

          {/* Mid layer — same direction, medium speed & opacity */}
          <svg
            className="
              botaniq-wave-scroll-mid
              absolute
              -bottom-2
              left-0
              h-full
              w-[200%]
              text-moss/[0.08]
            "
            viewBox="0 0 2400 220"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path
              d="M0,140 C180,80 420,190 600,140 C780,90 1020,190 1200,140
                 C1380,90 1620,190 1800,140 C1980,90 2220,190 2400,140
                 L2400,220 L0,220 Z"
            />
          </svg>

          {/* Front layer — fastest, most visible, sits on the border */}
          <svg
            className="
              botaniq-wave-scroll-fast
              absolute
              bottom-0
              left-0
              h-full
              w-[200%]
              text-moss/[0.12]
            "
            viewBox="0 0 2400 220"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path
              d="M0,160 C220,110 380,200 600,160 C820,110 980,200 1200,160
                 C1420,110 1580,200 1800,160 C2020,110 2180,200 2400,160
                 L2400,220 L0,220 Z"
            />
          </svg>

          {/* Soft light sweep drifting across the waves */}
          <div
            className="
              botaniq-wave-shimmer
              absolute
              inset-y-0
              left-0
              w-1/3
              bg-gradient-to-r
              from-transparent
              via-white/40
              to-transparent
              mix-blend-overlay
            "
          />
        </div>

        {/* Ingredient ticker */}
        <div
          className="
            botaniq-marquee-wrap
            relative
            border-t
            border-hairline
            bg-paper/60
            backdrop-blur-sm
          "
        >
          <div className="botaniq-marquee-track flex w-max py-4">
            {[...INGREDIENTS, ...INGREDIENTS].map((ingredient, index) => (
              <span
                key={`${ingredient}-${index}`}
                className="
                  flex
                  items-center
                  gap-2
                  px-7
                  text-[11px]
                  font-medium
                  uppercase
                  tracking-[0.1em]
                  text-stone
                "
              >
                <Sparkles
                  size={11}
                  className="text-moss/60"
                  strokeWidth={1.75}
                />
                {ingredient}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================
          TRUST STRIP
      =================================================== */}

      <section
        ref={trustRef}
        className={`
          border-b
          border-hairline
          bg-surface
          transition-all
          duration-1000
          ${
            trustVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          }
        `}
      >
        <div
          className="
            mx-auto
            grid
            max-w-6xl
            grid-cols-1
            gap-2
            px-6
            py-6
            sm:grid-cols-3
          "
        >
          <TrustItem icon={Leaf} label="Clean formulations" />

          <TrustItem icon={ShieldCheck} label="Verified reviews only" />

          <TrustItem icon={Truck} label="Fast delivery in Phnom Penh" />
        </div>
      </section>

      {/* ===================================================
          CATEGORIES
      =================================================== */}

      <section
        ref={categoriesRef}
        className={`
          mx-auto
          max-w-6xl
          px-6
          py-14
          transition-all
          duration-1000
          ${
            categoriesVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          }
        `}
      >
        <div
          className="
            mb-6
            flex
            items-end
            justify-between
            gap-4
          "
        >
          <div>
            <p
              className="
                mb-1.5
                text-[10px]
                font-medium
                uppercase
                tracking-[0.18em]
                text-moss
              "
            >
              Explore
            </p>

            <div className="flex items-baseline gap-2">
              <h2
                className="
                  font-display
                  text-[24px]
                  font-medium
                  text-ink
                "
              >
                Shop by category
              </h2>

              {hasCategories && (
                <span
                  className="
                    font-mono
                    text-[10px]
                    text-stone
                  "
                >
                  {String(categories.length).padStart(2, "0")}
                </span>
              )}
            </div>
          </div>

          <Link
            to="/products"
            className="
              group
              hidden
              items-center
              gap-1
              text-[12px]
              font-medium
              text-stone
              transition-colors
              hover:text-moss
              sm:flex
            "
          >
            Browse all
            <ArrowRight
              size={12}
              className="
                transition-transform
                duration-300
                group-hover:translate-x-1
              "
            />
          </Link>
        </div>

        {/* CATEGORY CONTENT */}

        {showCategorySkeleton ? (
          <CategorySkeleton />
        ) : categoriesError && categories.length === 0 ? (
          <ErrorState
            message="Couldn't load categories."
            onRetry={() => refreshCategories()}
          />
        ) : categories.length === 0 ? (
          <p
            className="
              py-5
              text-[13px]
              text-stone
            "
          >
            No categories to show yet.
          </p>
        ) : (
          <div
            className="
              scrollbar-hide
              flex
              snap-x
              snap-mandatory
              gap-3
              overflow-x-auto
              pb-2
              md:grid
              md:grid-cols-5
              md:overflow-visible
            "
          >
            {categories.map((category, index) => (
              <CompactCategoryCard
                key={category.id}
                category={category}
                index={index}
              />
            ))}
          </div>
        )}

        <Link
          to="/products"
          className="
            group
            mt-4
            flex
            items-center
            justify-center
            gap-1
            text-[12px]
            font-medium
            text-stone
            sm:hidden
          "
        >
          Browse all
          <ArrowRight
            size={12}
            className="
              transition-transform
              duration-300
              group-hover:translate-x-1
            "
          />
        </Link>
      </section>

      {/* ===================================================
          JOURNAL
      =================================================== */}

      <section
        ref={journalRef}
        className={`
          relative
          overflow-hidden
          border-y
          border-hairline
          bg-surface
          transition-all
          duration-1000
          ${
            journalVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }
        `}
      >
        <div
          className="
            botaniq-pulse
            pointer-events-none
            absolute
            left-[10%]
            top-1/2
            h-40
            w-40
            -translate-y-1/2
            rounded-full
            bg-moss/[0.05]
            blur-3xl
          "
        />

        <div
          className="
            relative
            mx-auto
            max-w-3xl
            px-6
            py-16
            text-center
          "
        >
          <div className="mb-5 flex justify-center">
            <span
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                border
                border-moss/15
                bg-paper
              "
            >
              <Sparkles size={16} className="text-moss" strokeWidth={1.5} />
            </span>
          </div>

          <p
            className="
              font-display
              text-[23px]
              italic
              leading-[1.45]
              text-ink
              sm:text-[28px]
            "
          >
            "Good skincare isn't about chasing trends — it's about listening to
            what your skin needs today."
          </p>

          <p
            className="
              mt-5
              text-[11px]
              font-medium
              uppercase
              tracking-[0.16em]
              text-stone
            "
          >
            The Botaniq Journal
          </p>
        </div>
      </section>

      {/* ===================================================
          NEW ARRIVALS
      =================================================== */}

      <section
        id="new-arrivals"
        ref={arrivalsRef}
        className={`
          mx-auto
          max-w-6xl
          px-6
          py-20
          transition-all
          duration-1000
          ${
            arrivalsVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }
        `}
      >
        <div
          className="
            mb-7
            flex
            items-end
            justify-between
            gap-4
          "
        >
          <div>
            <p
              className="
                mb-1.5
                text-[10px]
                font-medium
                uppercase
                tracking-[0.18em]
                text-moss
              "
            >
              Freshly selected
            </p>

            <h2
              className="
                font-display
                text-[25px]
                font-medium
                text-ink
              "
            >
              New arrivals
            </h2>
          </div>

          <Link
            to="/products"
            className="
              group
              flex
              items-center
              gap-1
              text-[12px]
              font-medium
              text-stone
              transition-colors
              hover:text-moss
            "
          >
            View all
            <ArrowRight
              size={13}
              className="
                transition-transform
                duration-300
                group-hover:translate-x-1
              "
            />
          </Link>
        </div>

        {/* PRODUCT CONTENT */}

        {showProductSkeleton ? (
          <ProductSkeletonGrid />
        ) : productsError && products.length === 0 ? (
          <ErrorState
            message="Couldn't load new arrivals."
            onRetry={() => refreshProducts()}
          />
        ) : products.length === 0 ? (
          <p
            className="
              py-12
              text-center
              text-[13.5px]
              text-stone
            "
          >
            New products will appear here soon.
          </p>
        ) : (
          <div
            className="
              grid
              grid-cols-2
              gap-x-5
              gap-y-12
              md:grid-cols-4
              md:gap-6
            "
          >
            {products.map((product, index) => (
              <div
                key={product.id}
                className="
                    botaniq-fade-up
                  "
                style={{
                  animationDelay: reducedMotion ? "0ms" : `${index * 70}ms`,
                }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}

        {/* Background refresh state */}

        {refreshingProducts && products.length > 0 && (
          <div
            className="
                mt-7
                flex
                items-center
                justify-center
                gap-2
                text-[10px]
                uppercase
                tracking-[0.14em]
                text-stone/60
              "
          >
            <RefreshCw size={11} className="animate-spin" />
            Updating products
          </div>
        )}
      </section>

      {/* ===================================================
          FINAL CTA
      =================================================== */}

      <section
        className="
          border-t
          border-hairline
          bg-moss
          text-white
        "
      >
        <div
          className="
            mx-auto
            max-w-5xl
            px-6
            py-20
            text-center
          "
        >
          <p
            className="
              mb-4
              text-[10px]
              font-medium
              uppercase
              tracking-[0.2em]
              text-white/60
            "
          >
            Your ritual starts here
          </p>

          <h2
            className="
              font-display
              text-[32px]
              leading-tight
              sm:text-[42px]
            "
          >
            Find what your skin
            <span className="italic text-white/70"> needs.</span>
          </h2>

          <p
            className="
              mx-auto
              mt-5
              max-w-md
              text-[14px]
              leading-relaxed
              text-white/65
            "
          >
            Explore our carefully selected collection and build a skincare
            routine that feels like yours.
          </p>

          <Link
            to="/products"
            className="
              group
              mt-8
              inline-flex
              items-center
              gap-2
              rounded-lg
              bg-white
              px-6
              py-3.5
              text-[14px]
              font-medium
              text-moss
              transition-all
              duration-300
              hover:-translate-y-1
              hover:bg-paper
              hover:shadow-xl
            "
          >
            Explore collection
            <ArrowRight
              size={15}
              className="
                transition-transform
                duration-300
                group-hover:translate-x-1
              "
            />
          </Link>
        </div>
      </section>

      {/* ===================================================
          BACK TO TOP
      =================================================== */}

      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        className={`
          group
          fixed
          bottom-6
          right-6
          z-40
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-full
          bg-moss
          text-white
          shadow-[0_8px_25px_rgba(63,88,67,0.25)]
          transition-all
          duration-500
          hover:-translate-y-1
          hover:bg-moss-deep
          ${
            showBackToTop
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-5 opacity-0"
          }
        `}
      >
        <ArrowUp
          size={18}
          className="
            transition-transform
            duration-300
            group-hover:-translate-y-0.5
          "
        />
      </button>
    </div>
  );
}

/* =========================================================
   PRODUCT SKELETON
========================================================= */

function ProductSkeletonGrid() {
  return (
    <div
      className="
        grid
        grid-cols-2
        gap-x-5
        gap-y-12
        md:grid-cols-4
        md:gap-6
      "
    >
      {Array.from({
        length: 8,
      }).map((_, index) => (
        <div
          key={index}
          className="botaniq-fade"
          style={{
            animationDelay: `${index * 50}ms`,
          }}
        >
          <ProductSkeleton />
        </div>
      ))}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div>
      {/* Image */}

      <div
        className="
          botaniq-skeleton
          aspect-square
          rounded-2xl
          bg-hairline/20
        "
      />

      {/* Brand */}

      <div
        className="
          botaniq-skeleton
          mt-4
          h-2.5
          w-16
          rounded
        "
      />

      {/* Name */}

      <div
        className="
          botaniq-skeleton
          mt-2
          h-4
          w-3/4
          rounded
        "
      />

      {/* Price */}

      <div
        className="
          botaniq-skeleton
          mt-2
          h-3
          w-1/3
          rounded
        "
      />
    </div>
  );
}

/* =========================================================
   CATEGORY SKELETON
========================================================= */

function CategorySkeleton() {
  return (
    <div
      className="
        flex
        gap-3
        overflow-hidden
        md:grid
        md:grid-cols-5
      "
    >
      {Array.from({
        length: 5,
      }).map((_, index) => (
        <div
          key={index}
          className="
            botaniq-skeleton
            h-[116px]
            min-w-[190px]
            rounded-xl
            md:min-w-0
          "
        />
      ))}
    </div>
  );
}

/* =========================================================
   COMPACT CATEGORY CARD
========================================================= */

function CompactCategoryCard({ category, index }) {
  return (
    <Link
      to={`/products?category_id=${category.id}`}
      className="
        group
        relative
        min-w-[190px]
        snap-start
        overflow-hidden
        rounded-xl
        border
        border-hairline
        bg-surface
        p-4
        transition-all
        duration-500
        hover:-translate-y-1
        hover:border-moss/30
        hover:bg-moss-tint
        hover:shadow-[0_14px_35px_rgba(63,88,67,0.08)]
        md:min-w-0
      "
    >
      {/* Background */}

      <div
        className="
          pointer-events-none
          absolute
          -right-8
          -top-8
          h-24
          w-24
          rounded-full
          bg-moss/[0.055]
          transition-all
          duration-700
          group-hover:scale-[1.6]
          group-hover:bg-moss/[0.09]
        "
      />

      {/* Number */}

      <span
        className="
          relative
          z-10
          text-[9px]
          font-medium
          uppercase
          tracking-[0.14em]
          text-stone
        "
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Icon */}

      <div
        className="
          relative
          z-10
          mt-4
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-full
          border
          border-moss/15
          bg-paper
          transition-all
          duration-500
          group-hover:scale-110
          group-hover:rotate-6
        "
      >
        <Leaf size={14} strokeWidth={1.5} className="text-moss" />
      </div>

      {/* Content */}

      <div
        className="
          relative
          z-10
          mt-3
          flex
          items-end
          justify-between
          gap-2
        "
      >
        <p
          className="
            font-display
            text-[16px]
            font-medium
            text-ink
            transition-all
            duration-300
            group-hover:translate-x-0.5
            group-hover:text-moss-deep
          "
        >
          {category.name}
        </p>

        <span
          className="
            flex
            h-6
            w-6
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-paper
            text-stone
            translate-x-2
            opacity-0
            transition-all
            duration-300
            group-hover:translate-x-0
            group-hover:opacity-100
          "
        >
          <ArrowRight size={11} />
        </span>
      </div>

      {/* Bottom line */}

      <div
        className="
          relative
          mt-4
          h-px
          overflow-hidden
          bg-hairline
        "
      >
        <div
          className="
            absolute
            inset-y-0
            left-0
            w-0
            bg-moss
            transition-all
            duration-500
            group-hover:w-full
          "
        />
      </div>
    </Link>
  );
}

/* =========================================================
   TRUST ITEM
========================================================= */

function TrustItem({ icon: Icon, label }) {
  return (
    <div
      className="
        group
        flex
        items-center
        justify-center
        gap-3
        rounded-xl
        px-4
        py-3
        transition-all
        duration-300
        hover:-translate-y-1
        hover:bg-moss-tint
      "
    >
      <span
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-full
          bg-moss-tint
          transition-all
          duration-300
          group-hover:scale-110
          group-hover:bg-paper
        "
      >
        <Icon
          size={15}
          className="
            text-moss
            transition-transform
            duration-300
            group-hover:scale-110
          "
          strokeWidth={1.7}
        />
      </span>

      <span
        className="
          text-[13px]
          font-medium
          text-stone
          transition-colors
          group-hover:text-ink
        "
      >
        {label}
      </span>
    </div>
  );
}


function ErrorState({ message, onRetry }) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (retrying) return;

    setRetrying(true);

    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-4
        rounded-xl
        border
        border-clay/15
        bg-clay-tint
        px-4
        py-3
        text-[13px]
        text-clay
      "
    >
      <span>{message}</span>

      <button
        type="button"
        onClick={handleRetry}
        disabled={retrying}
        className="
          flex
          shrink-0
          items-center
          gap-1.5
          font-medium
          underline
          underline-offset-2
          transition-opacity
          hover:opacity-70
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        <RefreshCw
          size={13}
          strokeWidth={1.75}
          className={retrying ? "animate-spin" : ""}
        />

        {retrying ? "Retrying" : "Retry"}
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
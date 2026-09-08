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
  Star,
  MousePointer2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import api from "../../api/axios";
import ProductCard from "../../components/storefront/ProductCart";
import FadeImage from "../../components/common/FadeImage";

/* =========================================================
   CONSTANTS
========================================================= */

const CACHE_VERSION = "botaniq-home-v3";

const PRODUCT_CACHE_KEY = `${CACHE_VERSION}:products`;
const CATEGORY_CACHE_KEY = `${CACHE_VERSION}:categories`;

const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

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
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
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
   REVEAL HOOK (still used by trust / categories / journal / arrivals)
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
        sort: "latest_updated",
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

  const heroSlides = useMemo(() => {
    if (!products || products.length === 0) {
      return [
        {
          id: 1,
          name: "Hydrating Botanical Essence",
          brand: "Botaniq Ritual",
          price: 38.0,
          discount: 0,
          image:
            "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80",
          tag: "Latest Arrival",
        },
        {
          id: 2,
          name: "Restorative Facial Treatment",
          brand: "Botaniq Ritual",
          price: 52.0,
          discount: 10,
          image:
            "https://images.unsplash.com/photo-1608248597359-00f7238290f6?w=800&auto=format&fit=crop&q=80",
          tag: "Customer Loved",
        },
        {
          id: 3,
          name: "Purifying Gentle Cleanse",
          brand: "Botaniq Ritual",
          price: 32.0,
          discount: 0,
          image:
            "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
          tag: "Pure Botanical",
        },
      ];
    }

    const count = Math.min(products.length, 3);
    return products.slice(0, count).map((item, idx) => {
      const images = Array.isArray(item.images) ? item.images : [];
      const primary = images.find((img) => img?.is_primary);
      const imageUrl =
        primary?.url ||
        images[0]?.url ||
        (typeof images[0] === "string" ? images[0] : "") ||
        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80";

      return {
        id: item.id,
        name: item.name,
        brand: item.brand?.name || item.category?.name || "Skincare Ritual",
        price: Number(item.price) || 0,
        discount: Number(item.discount) || 0,
        free_delivery: Boolean(item.free_delivery),
        image: imageUrl,
        tag: idx === 0 ? "Latest Arrival" : idx === 1 ? "Popular" : "Featured",
      };
    });
  }, [products]);

  const [activeSlide, setActiveSlide] = useState(0);
  const [isSliderHovered, setIsSliderHovered] = useState(false);
  const touchStartXRef = useRef(null);

  const totalSlides = heroSlides.length || 1;

  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setActiveSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Gentle auto-advance (every 5s, paused when hovering)
  useEffect(() => {
    if (isSliderHovered || totalSlides <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(timer);
  }, [isSliderHovered, totalSlides]);

  useEffect(() => {
    if (activeSlide >= heroSlides.length && heroSlides.length > 0) {
      setActiveSlide(0);
    }
  }, [activeSlide, heroSlides.length]);

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartXRef.current = null;
  };

  const formatPrice = useCallback((value) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }, []);

  /* =======================================================
     REVEALS (trust / categories / journal / arrivals only —
     hero no longer uses this, it animates on mount instead)
  ======================================================= */

  const [trustRef, trustVisible] = useReveal(0.1, 700);

  const [categoriesRef, categoriesVisible] = useReveal();

  const [journalRef, journalVisible] = useReveal();

  const [arrivalsRef, arrivalsVisible] = useReveal();

  /* =======================================================
     GLOBAL UI
  ======================================================= */

  const showBackToTop = useBackToTop();

  const reducedMotion = usePrefersReducedMotion();

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
    .botaniq-skeleton::after,
    .botaniq-fade-up,
    .botaniq-fade {
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
          z-90
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
          HERO — Clean, simple layout with product image slider
      =================================================== */}

      <section className="relative overflow-hidden border-b border-hairline bg-paper">
        {/* Subtle ambient backdrop, no animations */}
        <div
          className="pointer-events-none absolute -left-20 top-10 h-96 w-96 rounded-full bg-moss/5 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-20 top-20 h-96 w-96 rounded-full bg-sage/8 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
            {/* HERO CONTENT — Clean editorial left column */}
            <div className="max-w-xl">
              {/* Eyebrow */}
              <div className="mb-5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-moss">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-moss-tint">
                  <Leaf size={13} strokeWidth={1.8} />
                </span>
                Clean, effective skincare
              </div>

              {/* Heading */}
              <h1 className="font-display text-[40px] sm:text-[54px] lg:text-[64px] font-medium leading-[1.06] tracking-tight text-ink">
                Skincare that respects{" "}
                <span className="relative italic text-moss-deep">
                  your skin's story.
                  <span className="absolute -bottom-1 left-0 h-px w-full bg-moss/30" />
                </span>
              </h1>

              {/* Description */}
              <p className="mt-6 max-w-md text-[15.5px] leading-relaxed text-stone">
                Thoughtfully formulated products for every skin type,
                thoughtfully selected for your everyday ritual.
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/products"
                  className="
                    group
                    inline-flex
                    items-center
                    gap-2
                    rounded-lg
                    bg-moss
                    px-6
                    py-3.5
                    text-[14px]
                    font-medium
                    text-white
                    shadow-[0_10px_25px_rgba(63,88,67,0.18)]
                    transition-all
                    duration-200
                    hover:bg-moss-deep
                    hover:shadow-[0_14px_30px_rgba(63,88,67,0.24)]
                    active:translate-y-0.5
                  "
                >
                  <span>Shop the collection</span>
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </Link>

                <button
                  type="button"
                  onClick={scrollToProducts}
                  className="
                    group
                    inline-flex
                    items-center
                    gap-2
                    rounded-lg
                    border
                    border-hairline
                    bg-surface/80
                    px-5
                    py-3.5
                    text-[14px]
                    font-medium
                    text-ink
                    backdrop-blur-sm
                    transition-all
                    duration-200
                    hover:border-moss/30
                    hover:bg-moss-tint
                    hover:text-moss-deep
                    active:translate-y-0.5
                  "
                >
                  Explore products
                  <MousePointer2
                    size={14}
                    className="text-stone transition-transform duration-200 group-hover:rotate-12 group-hover:text-moss"
                  />
                </button>
              </div>

              {/* Trust badges */}
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] uppercase tracking-[0.08em] text-stone">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={12} className="text-moss" />
                  Carefully selected
                </span>

                <span className="h-1 w-1 rounded-full bg-hairline" />

                <span className="flex items-center gap-1.5">
                  <Star size={12} className="text-moss" />
                  Customer loved
                </span>

                <span className="h-1 w-1 rounded-full bg-hairline" />

                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-moss" />
                  Pure botanical
                </span>
              </div>
            </div>

            {/* HERO VISUAL — Clean Product Image Slider */}
            <div className="relative flex w-full items-center justify-center">
              {showProductSkeleton ? (
                /* Skeleton loader while products load */
                <div className="w-full max-w-md rounded-3xl border border-hairline/80 bg-surface/90 p-5 sm:p-6 shadow-[0_20px_50px_rgba(40,55,43,0.06)] backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-24 rounded-full botaniq-skeleton" />
                    <div className="h-6 w-16 rounded-full botaniq-skeleton" />
                  </div>
                  <div className="mt-4 aspect-square w-full rounded-2xl botaniq-skeleton" />
                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-1/4 rounded botaniq-skeleton" />
                    <div className="h-5 w-3/4 rounded botaniq-skeleton" />
                    <div className="flex items-center justify-between pt-2">
                      <div className="h-5 w-20 rounded botaniq-skeleton" />
                      <div className="h-2 w-12 rounded botaniq-skeleton" />
                    </div>
                  </div>
                </div>
              ) : (
                /* Product Image Slider */
                <div
                  className="w-full max-w-md sm:max-w-lg lg:max-w-md xl:max-w-lg rounded-3xl border border-hairline/80 bg-surface/90 p-5 sm:p-6 shadow-[0_20px_50px_rgba(40,55,43,0.07)] backdrop-blur-md"
                  onMouseEnter={() => setIsSliderHovered(true)}
                  onMouseLeave={() => setIsSliderHovered(false)}
                >
                  {/* Slider Top Bar: Tag, Counter & Arrows */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-moss-tint px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-moss">
                        <span className="h-1.5 w-1.5 rounded-full bg-moss" />
                        {heroSlides[activeSlide]?.tag || "Featured Product"}
                      </span>
                      {Number(heroSlides[activeSlide]?.discount) > 0 && (
                        <span className="rounded-full bg-terracotta/10 px-2 py-0.5 text-[10.5px] font-semibold text-terracotta">
                          -{Math.round(Number(heroSlides[activeSlide]?.discount))}% OFF
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium tracking-widest text-stone">
                        0{activeSlide + 1} / 0{heroSlides.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={prevSlide}
                          aria-label="Previous product"
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-hairline bg-surface text-stone transition-colors hover:border-moss/30 hover:bg-moss-tint hover:text-moss active:scale-95"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={nextSlide}
                          aria-label="Next product"
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-hairline bg-surface text-stone transition-colors hover:border-moss/30 hover:bg-moss-tint hover:text-moss active:scale-95"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Product Image Carousel Track */}
                  <div
                    className="relative mt-4 aspect-square w-full overflow-hidden rounded-2xl border border-hairline/70 bg-paper/60"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div
                      className="flex h-full w-full transition-transform duration-500 ease-out"
                      style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                    >
                      {heroSlides.map((slide, idx) => (
                        <div
                          key={slide.id || idx}
                          className="relative h-full w-full shrink-0"
                        >
                          <Link
                            to={`/products/${slide.id}`}
                            className="group/slide block h-full w-full"
                            aria-label={`View product: ${slide.name}`}
                          >
                            <FadeImage
                              src={slide.image}
                              alt={slide.name}
                              loading={idx === 0 ? "eager" : "lazy"}
                              wrapperClassName="h-full w-full"
                              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/slide:scale-105"
                            />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Product Info & Indicators */}
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone truncate">
                        {heroSlides[activeSlide]?.brand}
                      </p>
                      <Link
                        to={`/products/${heroSlides[activeSlide]?.id}`}
                        className="mt-1 block font-display text-[16px] sm:text-[18px] font-medium leading-snug text-ink truncate hover:text-moss transition-colors"
                      >
                        {heroSlides[activeSlide]?.name}
                      </Link>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-[15.5px] font-semibold text-ink">
                          ${formatPrice(
                            Number(heroSlides[activeSlide]?.discount) > 0
                              ? Number(heroSlides[activeSlide]?.price) -
                                  (Number(heroSlides[activeSlide]?.price) *
                                    Number(heroSlides[activeSlide]?.discount)) /
                                    100
                              : Number(heroSlides[activeSlide]?.price)
                          )}
                        </span>
                        {Number(heroSlides[activeSlide]?.discount) > 0 && (
                          <span className="text-[12px] text-stone line-through">
                            ${formatPrice(Number(heroSlides[activeSlide]?.price))}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pagination Dots */}
                    <div className="flex items-center gap-1.5 pb-1">
                      {heroSlides.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveSlide(idx)}
                          aria-label={`Go to product slide ${idx + 1}`}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            activeSlide === idx
                              ? "w-6 bg-moss"
                              : "w-2 bg-hairline hover:bg-stone/50"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </section>

      {/* ===================================================
          TRUST STRIP — unchanged (useReveal + CSS)
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
          CATEGORIES — unchanged (useReveal + CSS)
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
          JOURNAL — unchanged (useReveal + CSS)
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
            bg-moss/5
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
          NEW ARRIVALS — unchanged (useReveal + CSS)
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
          FINAL CTA — unchanged
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
              bg-surface
              border border-hairline/20
              px-6
              py-3.5
              text-[14px]
              font-medium
              text-ink
              transition-all
              duration-300
              hover:-translate-y-1
              hover:bg-paper
              hover:text-ink
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
          BACK TO TOP — unchanged
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
      <div
        className="
          botaniq-skeleton
          aspect-square
          rounded-2xl
          bg-hairline/20
        "
      />

      <div
        className="
          botaniq-skeleton
          mt-4
          h-2.5
          w-16
          rounded
        "
      />

      <div
        className="
          botaniq-skeleton
          mt-2
          h-4
          w-3/4
          rounded
        "
      />

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
            h-29
            min-w-47.5
            rounded-xl
            md:min-w-0
          "
        />
      ))}
    </div>
  );
}


function CompactCategoryCard({ category, index }) {
  return (
    <Link
      to={`/products?category_id=${category.id}`}
      className="
        group
        relative
        min-w-47.5
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
      <div
        className="
          pointer-events-none
          absolute
          -right-8
          -top-8
          h-24
          w-24
          rounded-full
          bg-moss/5.5
          transition-all
          duration-700
          group-hover:scale-[1.6]
          group-hover:bg-moss/9
        "
      />

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

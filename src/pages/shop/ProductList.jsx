import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  SlidersHorizontal,
  X,
  Tag,
  Award,
  Sparkles,
  Wallet,
  ChevronLeft,
  ChevronRight,
  PackageX,
  Check,
  RefreshCw,
} from "lucide-react";
import api from "../../api/axios";
import ProductCard from "../../components/storefront/ProductCart";

const SORTS = [
  { value: "", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

const FILTERS_CACHE_KEY = "botaniq-productlist-v1:filters";
const FILTERS_CACHE_TTL = 1000 * 60 * 10; // 10 minutes

/* =========================================================
   FILTER DATA CACHE HELPERS
   (categories / brands / skin types rarely change, so we
   hydrate instantly from cache and refresh silently)
========================================================= */

function readFiltersCache() {
  try {
    const raw = sessionStorage.getItem(FILTERS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.data) return null;

    return {
      data: parsed.data,
      cachedAt: Number(parsed.cachedAt) || 0,
    };
  } catch {
    return null;
  }
}

function writeFiltersCache(data) {
  try {
    sessionStorage.setItem(
      FILTERS_CACHE_KEY,
      JSON.stringify({ data, cachedAt: Date.now() }),
    );
  } catch {
    // ignore quota / private-mode errors
  }
}

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);

  // Filter option lists (categories/brands/skinTypes)
  const cachedFilters = readFiltersCache();

  const [categories, setCategories] = useState(
    cachedFilters?.data?.categories ?? [],
  );
  const [brands, setBrands] = useState(cachedFilters?.data?.brands ?? []);
  const [skinTypes, setSkinTypes] = useState(
    cachedFilters?.data?.skinTypes ?? [],
  );

  // Product loading state, split into "first load" vs "refetching"
  // so we don't flash a full skeleton on every filter tweak.
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(false);

  const [showFilters, setShowFilters] = useState(false);

  const mountedRef = useRef(false);
  const productsControllerRef = useRef(null);
  const hasLoadedOnceRef = useRef(false);

  const page = searchParams.get("page") || 1;
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("category_id") || "";
  const brandId = searchParams.get("brand_id") || "";
  const skinTypeId = searchParams.get("skin_type_id") || "";
  const sort = searchParams.get("sort") || "";
  const minPrice = searchParams.get("min_price") || "";
  const maxPrice = searchParams.get("max_price") || "";

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      productsControllerRef.current?.abort();
    };
  }, []);

  /* =======================================================
     FILTER OPTIONS
     Hydrate from cache instantly, refresh in background,
     skip the request entirely if cache is still fresh.
  ======================================================= */

  useEffect(() => {
    const isFresh =
      cachedFilters && Date.now() - cachedFilters.cachedAt < FILTERS_CACHE_TTL;

    if (isFresh) return;

    let cancelled = false;

    Promise.all([
      api.get("/categories"),
      api.get("/brands"),
      api.get("/skin-types"),
    ])
      .then(([catRes, brandRes, skinRes]) => {
        if (cancelled || !mountedRef.current) return;

        const nextCategories = catRes.data?.data || catRes.data || [];
        const nextBrands = brandRes.data?.data || brandRes.data || [];
        const nextSkinTypes = skinRes.data?.data || skinRes.data || [];

        setCategories(nextCategories);
        setBrands(nextBrands);
        setSkinTypes(nextSkinTypes);

        writeFiltersCache({
          categories: nextCategories,
          brands: nextBrands,
          skinTypes: nextSkinTypes,
        });
      })
      .catch(() => {
        // Filter sidebar failing silently is fine — it's not
        // the primary content, and cached/empty state still works.
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================================================
     PRODUCTS
  ======================================================= */

  const fetchProducts = useCallback(async () => {
    productsControllerRef.current?.abort();

    const controller = new AbortController();
    productsControllerRef.current = controller;

    if (hasLoadedOnceRef.current) {
      setFetching(true);
    } else {
      setLoading(true);
    }

    setError(false);

    try {
      const res = await api.get("/products", {
        params: {
          page,
          search: search || undefined,
          category_id: categoryId || undefined,
          brand_id: brandId || undefined,
          skin_type_id: skinTypeId || undefined,
          sort: sort || undefined,
          min_price: minPrice || undefined,
          max_price: maxPrice || undefined,
        },
        signal: controller.signal,
      });

      if (!mountedRef.current) return;

      setProducts(res.data.data || []);
      setMeta(res.data);
      hasLoadedOnceRef.current = true;
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;
      if (!mountedRef.current) return;

      setError(true);
    } finally {
      if (!mountedRef.current) return;

      setLoading(false);
      setFetching(false);
    }
  }, [
    page,
    search,
    categoryId,
    brandId,
    skinTypeId,
    sort,
    minPrice,
    maxPrice,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (search) next.set("search", search);
    setSearchParams(next);
  };

  const clearSearch = () => updateParam("search", "");

  const categoryName = categories.find(
    (c) => String(c.id) === categoryId,
  )?.name;
  const brandName = brands.find((b) => String(b.id) === brandId)?.name;
  const skinTypeName = skinTypes.find((s) => String(s.id) === skinTypeId)?.name;

  const activeChips = [
    search && { key: "search", label: `"${search}"`, onClear: clearSearch },
    categoryId && {
      key: "category",
      label: categoryName || "Category",
      onClear: () => updateParam("category_id", ""),
    },
    brandId && {
      key: "brand",
      label: brandName || "Brand",
      onClear: () => updateParam("brand_id", ""),
    },
    skinTypeId && {
      key: "skinType",
      label: skinTypeName || "Skin type",
      onClear: () => updateParam("skin_type_id", ""),
    },
    (minPrice || maxPrice) && {
      key: "price",
      label: `$${minPrice || "0"} – $${maxPrice || "∞"}`,
      onClear: () => {
        const next = new URLSearchParams(searchParams);
        next.delete("min_price");
        next.delete("max_price");
        next.delete("page");
        setSearchParams(next);
      },
    },
  ].filter(Boolean);

  const activeFilterCount = [
    categoryId,
    brandId,
    skinTypeId,
    minPrice,
    maxPrice,
  ].filter(Boolean).length;

  const showFullSkeleton = loading && products.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-1">
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-moss mb-1">
            Shop
          </p>

          <h1 className="font-display text-[30px] font-medium text-ink">
            {search ? `Results for "${search}"` : "All Products"}
          </h1>
        </div>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[13px] font-medium transition-colors ${
            showFilters
              ? "border-moss bg-moss-tint text-moss-deep"
              : "border-hairline text-ink hover:bg-paper"
          }`}
        >
          <SlidersHorizontal size={14} strokeWidth={1.75} />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-4.5 h-4.5 rounded-full bg-moss text-white text-[10px] font-medium flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {meta && (
          <p className="text-[13px] text-stone">
            {meta.total} {meta.total === 1 ? "product" : "products"}
          </p>
        )}

        {fetching && products.length > 0 && (
          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-stone/60">
            <RefreshCw size={11} className="animate-spin" />
            Updating
          </span>
        )}
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              onClick={chip.onClear}
              className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full border border-hairline bg-surface text-[12px] font-medium text-ink hover:border-clay/40 hover:text-clay transition-colors"
            >
              {chip.label}
              <X size={13} strokeWidth={2} />
            </button>
          ))}

          <button
            onClick={clearFilters}
            className="text-[12px] font-medium text-stone hover:text-clay transition-colors px-1"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex gap-8 items-start">
        {showFilters && (
          <aside className="w-64 shrink-0 rounded-xl border border-hairline bg-surface p-5 space-y-6 lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-stone">
                Filters
              </p>

              <button
                onClick={() => setShowFilters(false)}
                className="text-stone hover:text-ink transition-colors lg:hidden"
                aria-label="Close filters"
              >
                <X size={16} />
              </button>
            </div>

            <FilterGroup icon={Tag} label="Category">
              {categories.length === 0 ? (
                <p className="text-[12.5px] text-stone">No categories yet.</p>
              ) : (
                categories.map((c) => (
                  <FilterOption
                    key={c.id}
                    label={c.name}
                    active={categoryId === String(c.id)}
                    onClick={() =>
                      updateParam(
                        "category_id",
                        categoryId === String(c.id) ? "" : c.id,
                      )
                    }
                  />
                ))
              )}
            </FilterGroup>

            <FilterGroup icon={Award} label="Brand">
              {brands.length === 0 ? (
                <p className="text-[12.5px] text-stone">No brands yet.</p>
              ) : (
                brands.map((b) => (
                  <FilterOption
                    key={b.id}
                    label={b.name}
                    active={brandId === String(b.id)}
                    onClick={() =>
                      updateParam(
                        "brand_id",
                        brandId === String(b.id) ? "" : b.id,
                      )
                    }
                  />
                ))
              )}
            </FilterGroup>

            {skinTypes.length > 0 && (
              <FilterGroup icon={Sparkles} label="Skin Type">
                {skinTypes.map((s) => (
                  <FilterOption
                    key={s.id}
                    label={s.name}
                    active={skinTypeId === String(s.id)}
                    onClick={() =>
                      updateParam(
                        "skin_type_id",
                        skinTypeId === String(s.id) ? "" : s.id,
                      )
                    }
                  />
                ))}
              </FilterGroup>
            )}

            <FilterGroup icon={Wallet} label="Price">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-stone">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    defaultValue={minPrice}
                    onBlur={(e) => updateParam("min_price", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                    className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-hairline bg-paper text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-moss/30 focus:border-moss"
                  />
                </div>

                <span className="text-stone text-[13px]">–</span>

                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-stone">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    defaultValue={maxPrice}
                    onBlur={(e) => updateParam("max_price", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                    className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-hairline bg-paper text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-moss/30 focus:border-moss"
                  />
                </div>
              </div>
            </FilterGroup>
          </aside>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex justify-end mb-5">
            <select
              value={sort}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="px-3 py-2 rounded-lg border border-hairline bg-surface text-[13px] font-medium text-ink focus:outline-none focus:ring-2 focus:ring-moss/30 focus:border-moss"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {showFullSkeleton ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-hairline/40 rounded-xl mb-3" />
                  <div className="h-2.5 w-16 bg-hairline/50 rounded mb-2" />
                  <div className="h-3.5 w-3/4 bg-hairline/60 rounded" />
                </div>
              ))}
            </div>
          ) : error && products.length === 0 ? (
            <div className="flex flex-col items-center text-center py-20 border border-dashed border-clay/20 rounded-xl">
              <p className="text-[14px] text-clay mb-3">
                Couldn't load products.
              </p>
              <button
                onClick={fetchProducts}
                className="flex items-center gap-1.5 text-[13px] font-medium text-moss hover:text-moss-deep transition-colors"
              >
                <RefreshCw size={13} />
                Retry
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center text-center py-20 border border-dashed border-hairline rounded-xl">
              <div className="w-14 h-14 rounded-2xl bg-moss-tint flex items-center justify-center mb-4">
                <PackageX size={22} className="text-moss" strokeWidth={1.75} />
              </div>

              <p className="text-[15px] font-medium text-ink mb-1">
                No products found
              </p>

              <p className="text-[13px] text-stone mb-5 max-w-sm">
                Try adjusting or clearing your filters to see more results.
              </p>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-[13px] font-medium text-moss hover:text-moss-deep transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div
                className={`
                  grid grid-cols-2 sm:grid-cols-3 gap-5 sm:gap-6 mb-10
                  transition-opacity duration-300
                  ${fetching ? "opacity-60" : "opacity-100"}
                `}
              >
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => updateParam("page", Number(page) - 1)}
                    disabled={Number(page) === 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-stone hover:bg-paper hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => updateParam("page", p)}
                        className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-colors ${
                          Number(page) === p
                            ? "bg-moss text-white"
                            : "text-stone hover:bg-paper hover:text-ink"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}

                  <button
                    onClick={() => updateParam("page", Number(page) + 1)}
                    disabled={Number(page) === meta.last_page}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-stone hover:bg-paper hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ icon: Icon, label, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2.5">
        {Icon && <Icon size={13} strokeWidth={1.75} className="text-stone" />}
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-stone">
          {label}
        </p>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function FilterOption({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
        active
          ? "bg-moss-tint text-moss-deep font-medium"
          : "text-stone hover:bg-paper hover:text-ink"
      }`}
    >
      <span className="truncate">{label}</span>

      {active && (
        <Check size={14} strokeWidth={2.5} className="text-moss shrink-0" />
      )}
    </button>
  );
}
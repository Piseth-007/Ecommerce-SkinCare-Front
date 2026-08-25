import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import api from "../../api/axios";
import ProductCard from "../../components/storefront/ProductCart";

const SORTS = [
  { value: "", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const page = searchParams.get("page") || 1;
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("category_id") || "";
  const brandId = searchParams.get("brand_id") || "";
  const sort = searchParams.get("sort") || "";
  const minPrice = searchParams.get("min_price") || "";
  const maxPrice = searchParams.get("max_price") || "";

  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data));
    api.get("/brands").then((res) => setBrands(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get("/products", {
        params: {
          page,
          search: search || undefined,
          category_id: categoryId || undefined,
          brand_id: brandId || undefined,
          sort: sort || undefined,
          min_price: minPrice || undefined,
          max_price: maxPrice || undefined,
        },
      })
      .then((res) => {
        setProducts(res.data.data);
        setMeta(res.data);
      })
      .finally(() => setLoading(false));
  }, [page, search, categoryId, brandId, sort, minPrice, maxPrice]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({});

  const activeFilterCount = [categoryId, brandId, minPrice, maxPrice].filter(
    Boolean,
  ).length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-[28px] font-medium text-ink">
          {search ? `Results for "${search}"` : "Shop all"}
        </h1>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-hairline text-[13px] font-medium text-ink hover:bg-paper transition-colors"
        >
          <SlidersHorizontal size={14} strokeWidth={1.75} />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-moss text-white text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
      {meta && (
        <p className="text-[13px] text-stone mb-6">{meta.total} products</p>
      )}

      <div className="flex gap-8">
        {showFilters && (
          <aside className="w-56 shrink-0 space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-stone">
                Filters
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-[12px] text-moss hover:text-moss-deep font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            <FilterGroup label="Category">
              {categories.map((c) => (
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
              ))}
            </FilterGroup>

            <FilterGroup label="Brand">
              {brands.map((b) => (
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
              ))}
            </FilterGroup>

            <FilterGroup label="Price">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  defaultValue={minPrice}
                  onBlur={(e) => updateParam("min_price", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-hairline bg-paper text-[13px] focus:outline-none focus:ring-2 focus:ring-moss/30"
                />
                <span className="text-stone text-[13px]">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  defaultValue={maxPrice}
                  onBlur={(e) => updateParam("max_price", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-hairline bg-paper text-[13px] focus:outline-none focus:ring-2 focus:ring-moss/30"
                />
              </div>
            </FilterGroup>
          </aside>
        )}

        <div className="flex-1">
          <div className="flex justify-end mb-5">
            <select
              value={sort}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="px-3 py-2 rounded-lg border border-hairline bg-surface text-[13px] font-medium text-ink focus:outline-none focus:ring-2 focus:ring-moss/30"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-hairline/40 rounded-xl mb-3" />
                  <div className="h-2.5 w-16 bg-hairline/50 rounded mb-2" />
                  <div className="h-3.5 w-3/4 bg-hairline/60 rounded" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="text-[13.5px] text-stone text-center py-20">
              No products match your filters.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-6 mb-10">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-center gap-2">
                  {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => updateParam("page", p)}
                        className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-colors ${
                          Number(page) === p
                            ? "bg-ink text-white"
                            : "text-stone hover:bg-paper"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-stone mb-2.5">
        {label}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function FilterOption({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
        active
          ? "bg-moss-tint text-moss-deep font-medium"
          : "text-stone hover:bg-paper hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

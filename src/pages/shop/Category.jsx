import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Leaf, ArrowUpRight, FolderOpen } from "lucide-react";
import api from "../../api/axios";

const TILE_STYLES = [
  "from-moss/90 to-moss-deep",
  "from-clay/85 to-clay-deep",
  "from-amber-500/85 to-amber-700",
  "from-moss-deep to-ink",
];

export default function Category() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/categories")
      .then((res) => setCategories(res.data?.data || res.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <style>{`
        @keyframes cat-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cat-fade-up {
          animation: cat-fade-up .6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .cat-fade-up { animation: none !important; }
        }
      `}</style>

      {/* Hero */}
      <div className="cat-fade-up text-center max-w-xl mx-auto mb-12">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-moss mb-2">
          Browse
        </p>

        <h1 className="font-display text-[34px] sm:text-[40px] font-medium leading-[1.1] tracking-[-0.02em] text-ink">
          Shop by category
        </h1>

        <p className="mt-3 text-[14px] leading-relaxed text-stone">
          Explore our range, organized so you can find exactly what your skin
          needs.
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-2xl bg-hairline/30 animate-pulse"
            />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center text-center py-20 border border-dashed border-hairline rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-moss-tint flex items-center justify-center mb-4">
            <FolderOpen size={22} className="text-moss" strokeWidth={1.75} />
          </div>

          <p className="text-[15px] font-medium text-ink mb-1">
            No categories yet
          </p>

          <p className="text-[13px] text-stone max-w-sm">
            Check back soon — new categories are on the way.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {categories.map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryCard({ category, index }) {
  const gradient = TILE_STYLES[index % TILE_STYLES.length];
  const delay = Math.min(index, 9) * 60;

  return (
    <Link
      to={`/products?category_id=${category.id}`}
      className="cat-fade-up group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[0_1px_3px_rgba(33,31,27,0.06)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(33,31,27,0.14)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-700 group-hover:scale-110`}
      />

      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl transition-transform duration-700 group-hover:scale-125" />

      {/* Icon */}
      <div className="absolute inset-0 flex items-center justify-center opacity-25 transition-all duration-500 group-hover:scale-110 group-hover:opacity-30">
        <Leaf size={56} strokeWidth={1} className="text-white" />
      </div>

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <div className="flex items-end justify-between gap-2">
          <h3 className="font-display text-[16px] sm:text-[18px] font-medium capitalize text-white leading-tight">
            {category.name}
          </h3>

          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-all duration-300 group-hover:bg-white group-hover:text-ink">
            <ArrowUpRight
              size={14}
              strokeWidth={2}
              className="transition-transform duration-300 group-hover:rotate-45"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

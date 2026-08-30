import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, ArrowUpRight } from "lucide-react";
import api from "../../api/axios";

export default function Brand() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/brands")
      .then((res) => setBrands(res.data?.data || res.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <style>{`
        @keyframes brand-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .brand-fade-up {
          animation: brand-fade-up .6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .brand-fade-up { animation: none !important; }
        }
      `}</style>

      {/* Hero */}
      <div className="brand-fade-up text-center max-w-xl mx-auto mb-12">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-moss mb-2">
          Our partners
        </p>

        <h1 className="font-display text-[34px] sm:text-[40px] font-medium leading-[1.1] tracking-[-0.02em] text-ink">
          Shop by brand
        </h1>

        <p className="mt-3 text-[14px] leading-relaxed text-stone">
          Trusted formulas from skincare brands we've carefully selected.
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl bg-hairline/30 animate-pulse"
            />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="flex flex-col items-center text-center py-20 border border-dashed border-hairline rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-moss-tint flex items-center justify-center mb-4">
            <Award size={22} className="text-moss" strokeWidth={1.75} />
          </div>

          <p className="text-[15px] font-medium text-ink mb-1">No brands yet</p>

          <p className="text-[13px] text-stone max-w-sm">
            Check back soon — new brands are on the way.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {brands.map((brand, index) => (
            <BrandCard key={brand.id} brand={brand} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

function BrandCard({ brand, index }) {
  const delay = Math.min(index, 9) * 60;

  return (
    <Link
      to={`/products?brand_id=${brand.id}`}
      className="brand-fade-up group relative flex aspect-square flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-hairline bg-surface p-5 text-center transition-all duration-500 hover:-translate-y-1.5 hover:border-moss/30 hover:shadow-[0_20px_40px_rgba(33,31,27,0.08)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Arrow */}
      <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-paper text-stone opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:bg-moss group-hover:text-white">
        <ArrowUpRight
          size={14}
          strokeWidth={2}
          className="transition-transform duration-300 group-hover:rotate-45"
        />
      </span>

      {/* Logo / fallback */}
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-paper transition-transform duration-500 group-hover:scale-105">
        {brand.logo_url ? (
          <img
            src={brand.logo_url}
            alt={brand.name}
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <span className="font-display text-[22px] font-medium text-moss">
            {brand.name?.charAt(0).toUpperCase() || "B"}
          </span>
        )}
      </div>

      <h3 className="font-display text-[15px] font-medium capitalize text-ink leading-tight">
        {brand.name}
      </h3>
    </Link>
  );
}

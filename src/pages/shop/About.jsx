import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Leaf,
  Sparkles,
  ShieldCheck,
  Heart,
  ArrowRight,
  Users,
  Package,
  Star,
} from "lucide-react";

const VALUES = [
  {
    icon: Leaf,
    title: "Thoughtfully sourced",
    text: "We select formulas with clear ingredient lists and real skincare science behind them.",
  },
  {
    icon: ShieldCheck,
    title: "Verified quality",
    text: "Every brand we carry is vetted before it ever reaches our shelves.",
  },
  {
    icon: Heart,
    title: "Skin-conscious",
    text: "We tag products by skin type so you can shop for what actually works for you.",
  },
  {
    icon: Sparkles,
    title: "Honest recommendations",
    text: "No filler, no gimmicks — just skincare that does what it says.",
  },
];

const STATS = [
  { icon: Package, value: "500+", label: "Products curated" },
  { icon: Users, value: "10k+", label: "Happy customers" },
  { icon: Star, value: "4.8", label: "Average rating" },
];

export default function About() {
  return (
    <div className="overflow-hidden bg-paper text-ink">
      <style>{`
        @keyframes about-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .about-reveal {
          opacity: 0;
        }
        .about-reveal.is-visible {
          animation: about-fade-up .7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes about-pulse {
          0%, 100% { transform: scale(1); opacity: .5; }
          50% { transform: scale(1.1); opacity: .8; }
        }
        .about-pulse {
          animation: about-pulse 5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .about-reveal { opacity: 1 !important; animation: none !important; }
          .about-pulse { animation: none !important; }
        }
      `}</style>

      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="relative px-6 pt-20 pb-24 text-center">
        <div className="about-pulse pointer-events-none absolute left-1/2 top-10 -z-0 h-72 w-72 -translate-x-1/2 rounded-full bg-moss/[0.07] blur-3xl" />

        <Reveal>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-moss mb-3">
            Our story
          </p>

          <h1 className="mx-auto max-w-2xl font-display text-[38px] sm:text-[48px] font-medium leading-[1.08] tracking-[-0.02em] text-ink">
            Skincare that respects your skin — and your intelligence.
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-stone">
            Botaniq began with a simple frustration: too many skincare shelves
            are full of noise. We built the store we wished existed — curated,
            honest, and organized around real skin needs.
          </p>
        </Reveal>
      </section>

      {/* =====================================================
          STATS
      ===================================================== */}
      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {STATS.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 100}>
              <div className="rounded-2xl border border-hairline bg-surface p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(33,31,27,0.06)]">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-moss-tint">
                  <stat.icon
                    size={18}
                    className="text-moss"
                    strokeWidth={1.75}
                  />
                </div>

                <p className="font-display text-[26px] font-medium text-ink">
                  {stat.value}
                </p>

                <p className="mt-1 text-[12.5px] text-stone">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* =====================================================
          STORY SPLIT
      ===================================================== */}
      <section className="px-6 py-20 border-y border-hairline bg-surface">
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-moss/90 to-moss-deep">
              <div className="absolute inset-0 flex items-center justify-center opacity-25">
                <Leaf size={120} strokeWidth={0.75} className="text-white" />
              </div>

              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            </div>
          </Reveal>

          <Reveal delay={150}>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-moss mb-2">
              Why we started
            </p>

            <h2 className="font-display text-[28px] sm:text-[32px] font-medium leading-tight text-ink mb-4">
              Less noise, more skin science
            </h2>

            <p className="text-[14px] leading-[1.8] text-stone mb-4">
              We were tired of shelves overflowing with trends and buzzwords. So
              we built Botaniq around a simpler idea: every product should earn
              its place — through ingredients, formulation, and real results.
            </p>

            <p className="text-[14px] leading-[1.8] text-stone">
              Every item in our catalog is organized by category, brand, and
              skin type, so you spend less time guessing and more time caring
              for your skin the way it actually needs.
            </p>
          </Reveal>
        </div>
      </section>

      {/* =====================================================
          VALUES
      ===================================================== */}
      <section className="px-6 py-24">
        <Reveal>
          <div className="mx-auto max-w-xl text-center mb-14">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-moss mb-2">
              What guides us
            </p>

            <h2 className="font-display text-[30px] sm:text-[34px] font-medium text-ink">
              Our values
            </h2>
          </div>
        </Reveal>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2">
          {VALUES.map((value, index) => (
            <Reveal key={value.title} delay={index * 100}>
              <div className="group flex gap-4 rounded-2xl border border-hairline bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-moss/30 hover:shadow-[0_16px_32px_rgba(33,31,27,0.06)]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-moss-tint transition-all duration-300 group-hover:scale-105 group-hover:bg-moss">
                  <value.icon
                    size={19}
                    strokeWidth={1.5}
                    className="text-moss transition-colors duration-300 group-hover:text-white"
                  />
                </span>

                <div>
                  <h3 className="text-[15px] font-medium text-ink mb-1.5">
                    {value.title}
                  </h3>

                  <p className="text-[13px] leading-relaxed text-stone">
                    {value.text}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* =====================================================
          CTA
      ===================================================== */}
      <section className="px-6 pb-24">
        <Reveal>
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-moss px-8 py-14 text-center sm:px-16">
            <div className="about-pulse pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="about-pulse pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

            <h2 className="relative font-display text-[26px] sm:text-[32px] font-medium leading-tight text-white">
              Ready to find your routine?
            </h2>

            <p className="relative mt-3 text-[14px] text-white/80 max-w-md mx-auto">
              Browse our curated catalog, filtered by category, brand, and skin
              type.
            </p>

            <Link
              to="/products"
              className="relative mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[13.5px] font-medium text-moss-deep transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,0,0,0.2)]"
            >
              Shop now
              <ArrowRight
                size={15}
                strokeWidth={2}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

/* =========================================================
   SCROLL REVEAL WRAPPER
========================================================= */

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`about-reveal ${visible ? "is-visible" : ""}`}
      style={{ animationDelay: visible ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}

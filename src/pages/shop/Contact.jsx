import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  Check,
  Clock,
  MessageCircle,
} from "lucide-react";
import api from "../../api/axios";

const CONTACT_INFO = [
  {
    icon: Mail,
    label: "Email us",
    value: "hello@botaniq.com",
    href: "mailto:hello@botaniq.com",
  },
  {
    icon: Phone,
    label: "Call us",
    value: "+855 12 345 678",
    href: "tel:+85512345678",
  },
  {
    icon: MapPin,
    label: "Visit us",
    value: "Phnom Penh, Cambodia",
  },
];

const FAQS = [
  {
    q: "How long does delivery take?",
    a: "Most orders in Phnom Penh arrive within 1–2 business days. Products marked free delivery ship at no extra cost.",
  },
  {
    q: "Can I return a product?",
    a: "Reach out within 7 days of delivery and we'll help sort out a return or exchange for unopened items.",
  },
  {
    q: "Do you ship outside Phnom Penh?",
    a: "Yes — contact us with your location and we'll confirm delivery options and timing.",
  },
];

const initialForm = { name: "", email: "", message: "" };

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setSending(true);
    setError("");

    try {
      await api.post("/contact", form);

      setSent(true);
      setForm(initialForm);

      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Couldn't send your message right now. Please email us directly.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-paper text-ink">
      <style>{`
        @keyframes contact-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .contact-fade-up {
          animation: contact-fade-up .6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes contact-pulse {
          0%, 100% { transform: scale(1); opacity: .45; }
          50% { transform: scale(1.08); opacity: .7; }
        }
        .contact-pulse {
          animation: contact-pulse 5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .contact-fade-up { animation: none !important; }
          .contact-pulse { animation: none !important; }
        }
      `}</style>

      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="relative px-6 pt-16 pb-10 text-center overflow-hidden">
        <div className="contact-pulse pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 h-64 w-64 rounded-full bg-moss/[0.07] blur-3xl" />

        <div className="contact-fade-up relative">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-moss mb-2">
            Get in touch
          </p>

          <h1 className="mx-auto max-w-xl font-display text-[34px] sm:text-[42px] font-medium leading-[1.1] tracking-[-0.02em] text-ink">
            We'd love to hear from you
          </h1>

          <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-stone">
            Questions about a product, your order, or just want to say hi — send
            us a message and we'll get back to you soon.
          </p>
        </div>
      </section>

      {/* =====================================================
          MAIN GRID
      ===================================================== */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          {/* Contact info */}
          <div
            className="contact-fade-up space-y-4"
            style={{ animationDelay: "100ms" }}
          >
            {CONTACT_INFO.map((item) => {
              const Content = (
                <div className="group flex items-center gap-4 rounded-2xl border border-hairline bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-moss/30 hover:shadow-[0_12px_28px_rgba(33,31,27,0.06)]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-moss-tint transition-all duration-300 group-hover:bg-moss">
                    <item.icon
                      size={18}
                      strokeWidth={1.75}
                      className="text-moss transition-colors duration-300 group-hover:text-white"
                    />
                  </span>

                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-stone mb-0.5">
                      {item.label}
                    </p>

                    <p className="text-[14px] font-medium text-ink truncate">
                      {item.value}
                    </p>
                  </div>
                </div>
              );

              return item.href ? (
                <a key={item.label} href={item.href}>
                  {Content}
                </a>
              ) : (
                <div key={item.label}>{Content}</div>
              );
            })}

            {/* Hours */}
            <div className="rounded-2xl border border-hairline bg-surface p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <Clock size={16} className="text-moss" strokeWidth={1.75} />
                <p className="text-[13px] font-medium text-ink">
                  Response hours
                </p>
              </div>

              <div className="space-y-1.5 text-[12.5px] text-stone">
                <div className="flex justify-between">
                  <span>Mon – Fri</span>
                  <span className="font-mono text-ink">9am – 6pm</span>
                </div>
                <div className="flex justify-between">
                  <span>Sat – Sun</span>
                  <span className="font-mono text-ink">10am – 4pm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div
            className="contact-fade-up rounded-2xl border border-hairline bg-surface p-6 sm:p-8"
            style={{ animationDelay: "180ms" }}
          >
            <div className="flex items-center gap-2.5 mb-6">
              <MessageCircle
                size={18}
                className="text-moss"
                strokeWidth={1.75}
              />
              <h2 className="font-display text-[19px] font-medium text-ink">
                Send a message
              </h2>
            </div>

            {error && (
              <div className="mb-5 rounded-lg border border-clay/15 bg-clay-tint px-4 py-3 text-[13px] text-clay">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Your name">
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    disabled={sending}
                    required
                    placeholder="Jane Doe"
                    className={inputClass}
                  />
                </Field>

                <Field label="Email">
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={sending}
                    required
                    placeholder="jane@example.com"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Message">
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  disabled={sending}
                  required
                  rows={5}
                  placeholder="How can we help?"
                  className={`${inputClass} resize-none`}
                />
              </Field>

              <button
                type="submit"
                disabled={sending}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[13.5px] font-medium text-white shadow-[0_10px_25px_rgba(63,88,67,0.14)] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
                  sent
                    ? "bg-moss-deep"
                    : "bg-moss hover:-translate-y-0.5 hover:bg-moss-deep hover:shadow-[0_14px_30px_rgba(63,88,67,0.22)]"
                }`}
              >
                {sent ? (
                  <>
                    <Check size={16} strokeWidth={2} />
                    Message sent
                  </>
                ) : sending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={15} strokeWidth={1.75} />
                    Send message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* =====================================================
          FAQ
      ===================================================== */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="contact-fade-up text-center mb-10">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-moss mb-2">
              Quick answers
            </p>

            <h2 className="font-display text-[26px] sm:text-[30px] font-medium text-ink">
              Frequently asked
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => (
              <FaqItem key={faq.q} faq={faq} delay={index * 90} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   FAQ ITEM
========================================================= */

function FaqItem({ faq, delay }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="contact-fade-up overflow-hidden rounded-xl border border-hairline bg-surface"
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-[13.5px] font-medium text-ink">{faq.q}</span>

        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper text-stone transition-transform duration-300 ${
            open ? "rotate-45" : ""
          }`}
        >
          <span className="text-[16px] leading-none">+</span>
        </span>
      </button>

      <div
        className="grid transition-all duration-300 ease-out"
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
        }}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-4 text-[13px] leading-relaxed text-stone">
            {faq.a}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FORM HELPERS
========================================================= */

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-paper text-ink text-[14px] placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss transition-shadow disabled:opacity-60";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-stone mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

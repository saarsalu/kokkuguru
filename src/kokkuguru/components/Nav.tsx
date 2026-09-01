import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChefHat, Settings, Menu, X } from "lucide-react";
import { useAppState, openKeyModal } from "../lib/store";

const LINKS = [
  { href: "#konverter", label: "Konverter" },
  { href: "#kuidas", label: "Kuidas töötab" },
  { href: "#platvormid", label: "Platvormid" },
  { href: "#retseptid", label: "Retseptid" },
  { href: "#kkk", label: "KKK" },
];

function StatusDot() {
  const { mode } = useAppState();
  const color =
    mode === "live"
      ? "bg-leaf"
      : mode === "auth-error"
        ? "bg-flame"
        : "bg-gold";
  const label =
    mode === "live" ? "API ühendatud" : mode === "auth-error" ? "Võtme viga" : "Demo režiim";
  return (
    <button
      onClick={openKeyModal}
      title="API seaded — klõpsa, et seadistada recipeapi.io võti"
      className="hidden sm:flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-smoke hover:border-flame/40 hover:text-ink transition-colors"
    >
      <span className={`h-2 w-2 rounded-full ${color} animate-pulse-soft`} />
      {label}
    </button>
  );
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-paper/85 backdrop-blur-xl border-b border-ink/8 shadow-[0_8px_30px_-18px_rgba(29,24,17,0.35)]"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8 py-4">
        <a href="#algus" className="flex items-center gap-2.5 group">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-flame text-paper shadow-lg shadow-flame/30 transition-transform duration-300 group-hover:rotate-[-8deg]">
            <ChefHat className="h-5.5 w-5.5" strokeWidth={2.2} />
          </span>
          <span className="font-display text-[22px] font-black tracking-tight">
            Kokku<span className="text-flame">Guru</span>
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-7">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] font-bold uppercase tracking-[0.08em] text-smoke hover:text-ink transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <StatusDot />
          <button
            onClick={openKeyModal}
            aria-label="API seaded"
            className="grid h-10 w-10 place-items-center rounded-full border border-ink/10 bg-white/70 text-smoke hover:text-ink hover:border-flame/40 transition-colors"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>
          <a
            href="#konverter"
            className="hidden sm:inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-[13px] font-bold uppercase tracking-wider text-paper transition-all hover:bg-flame hover:shadow-lg hover:shadow-flame/30"
          >
            Ava konverter
          </a>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Menüü"
            className="lg:hidden grid h-10 w-10 place-items-center rounded-full border border-ink/10 bg-white/70"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobiilimenüü */}
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0 }}
        className="lg:hidden overflow-hidden bg-paper/95 backdrop-blur-xl border-b border-ink/8"
      >
        <div className="flex flex-col gap-1 px-5 py-4">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 font-display text-xl font-bold hover:bg-cream transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>
      </motion.div>
    </motion.header>
  );
}

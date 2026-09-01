import { motion } from "framer-motion";
import { ArrowUpRight, ChefHat } from "lucide-react";
import { openKeyModal, useAppState } from "../lib/store";

const HERO_IMG =
  "https://images.pexels.com/photos/1435895/pexels-photo-1435895.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";

export default function Footer() {
  const { mode } = useAppState();

  return (
    <footer className="relative overflow-hidden bg-ink text-paper">
      {/* CTA pael foto taustaga */}
      <div className="relative">
        <img
          src={HERO_IMG}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/85 to-ink" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 py-20 sm:py-28 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            className="mx-auto max-w-3xl font-display text-4xl sm:text-6xl font-black leading-[1.02] tracking-tight"
          >
            Järgmine retsept on ühe <span className="italic text-flame">lingi</span> kaugusel
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-paper/60"
          >
            Ava sotsiaalmeedia, leia toiduvideo ja kleebi link — rohkem ei ole sul ja
            õhtusöögi vahel midagi.
          </motion.p>
          <motion.a
            href="#konverter"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.18 }}
            className="group mt-9 inline-flex items-center gap-2.5 rounded-full bg-flame px-8 py-4 font-display text-lg font-black text-paper shadow-2xl shadow-flame/30 transition-all hover:bg-flame-deep"
          >
            Ava konverter
            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </motion.a>
        </div>
      </div>

      {/* jaluse põhiosa */}
      <div className="border-t border-paper/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-flame text-paper">
                <ChefHat className="h-5.5 w-5.5" strokeWidth={2.2} />
              </span>
              <span className="font-display text-[22px] font-black tracking-tight">
                Kokku<span className="text-flame">Guru</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/50">
              Sotsiaalmeedia toiduvideod selgeteks, samm-sammulisteks retseptideks —
              retseptiandmete toiteallikaks recipeapi.io.
            </p>
            <button
              onClick={openKeyModal}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-paper/15 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-paper/60 transition-colors hover:border-gold/60 hover:text-paper"
            >
              <span
                className={`h-2 w-2 rounded-full animate-pulse-soft ${
                  mode === "live" ? "bg-leaf" : mode === "auth-error" ? "bg-flame" : "bg-gold"
                }`}
              />
              {mode === "live" ? "API ühendatud" : mode === "auth-error" ? "Võtme viga" : "Demo režiim"}
            </button>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-paper/40">
              Navigeerimine
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold">
              {[
                ["#konverter", "Konverter"],
                ["#kuidas", "Kuidas töötab"],
                ["#platvormid", "Platvormid"],
                ["#retseptid", "Retseptid"],
                ["#kkk", "KKK"],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="text-paper/60 transition-colors hover:text-gold">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-paper/40">
              Ressursid
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold">
              <li>
                <a
                  href="https://recipeapi.io"
                  target="_blank"
                  rel="noreferrer"
                  className="text-paper/60 transition-colors hover:text-gold"
                >
                  recipeapi.io
                </a>
              </li>
              <li>
                <a
                  href="https://recipeapi.io/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="text-paper/60 transition-colors hover:text-gold"
                >
                  API dokumentatsioon
                </a>
              </li>
              <li>
                <a
                  href="https://recipeapi.io/pricing"
                  target="_blank"
                  rel="noreferrer"
                  className="text-paper/60 transition-colors hover:text-gold"
                >
                  Hinnakiri
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-paper/40">
              Toetatud lingid
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {["TikTok", "Instagram", "YouTube", "Facebook", "Pinterest", "Rednote"].map(
                (p) => (
                  <span
                    key={p}
                    className="rounded-full border border-paper/12 px-3 py-1.5 text-[12px] font-bold text-paper/55"
                  >
                    {p}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* hiiglaslik watermark */}
      <div className="pointer-events-none select-none overflow-hidden">
        <p className="text-outline-light -mb-[0.23em] text-center font-display text-[19vw] leading-none font-black tracking-tight">
          KOKKU
        </p>
      </div>

      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 sm:px-8 py-5 text-[12px] font-semibold text-paper/40">
          <span>© 2026 KokkuGuru — ehitatud recipeapi.io peale</span>
          <span>Fotod: Pexels · Ikoonid: Lucide</span>
        </div>
      </div>
    </footer>
  );
}

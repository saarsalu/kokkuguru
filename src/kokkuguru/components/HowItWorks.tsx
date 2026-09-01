import { motion } from "framer-motion";
import { Link2, Search, Sparkles } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: Search,
    title: "Leia toiduvideo",
    text: "Sirvi TikToki, Reelsi või Shortse ja leia roog, mida tahad kohe järele proovida — fotokarusellid töötavad samuti.",
  },
  {
    n: "02",
    icon: Link2,
    title: "Kleebi link",
    text: "Kopeeri video aadress KokkuGuru konverterisse. Platvorm tuvastatakse automaatselt — lisa soovi korral roa nimi.",
  },
  {
    n: "03",
    icon: Sparkles,
    title: "Saa retsept",
    text: "AI eraldab heliraja, transkribeerib sisu ja vormindab puhtad koostisosad, mõõdud ja samm-sammulised juhised.",
  },
];

export default function HowItWorks() {
  return (
    <section id="kuidas" className="relative scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="text-[12px] font-bold uppercase tracking-[0.2em] text-flame"
        >
          Lihtne protsess
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.08 }}
          className="mt-3 max-w-2xl font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.02] tracking-tight"
        >
          Kolm sammu <span className="italic text-flame">retseptini</span>
        </motion.h2>

        <div className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {/* katkendlik ühendusjoon */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-10 hidden border-t-2 border-dashed border-ink/15 md:block"
          />
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="relative inline-flex">
                <span className="absolute -top-3 -right-5 font-display text-5xl font-black italic text-sand select-none">
                  {step.n}
                </span>
                <span className="grid h-20 w-20 place-items-center rounded-3xl bg-ink text-paper shadow-xl shadow-ink/20">
                  <step.icon className="h-8 w-8" strokeWidth={1.8} />
                </span>
              </div>
              <h3 className="mt-6 font-display text-2xl font-black">{step.title}</h3>
              <p className="mt-2.5 max-w-sm text-[15px] leading-relaxed text-smoke">
                {step.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

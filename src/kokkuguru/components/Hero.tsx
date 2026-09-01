import { motion } from "framer-motion";
import { ChefHat, MousePointerClick, Star } from "lucide-react";
import Converter from "./Converter";
import type { Recipe } from "../lib/api";

/* Pöörlev ringtekst tempel */
function RotatingStamp() {
  return (
    <div className="relative h-28 w-28 sm:h-36 sm:w-36">
      <svg viewBox="0 0 100 100" className="h-full w-full animate-spin-slower">
        <defs>
          <path id="ring" d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" />
        </defs>
        <text className="fill-ink text-[8.6px] font-black uppercase tracking-[2.6px]">
          <textPath href="#ring">
            Video sisse • Retsept välja • Video sisse •
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="grid h-12 w-12 sm:h-16 sm:w-16 place-items-center rounded-full bg-flame text-paper shadow-lg shadow-flame/40">
          <ChefHat className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={2.2} />
        </span>
      </div>
    </div>
  );
}

const STATS = [
  { value: "50 000+", label: "retsepti andmebaasis" },
  { value: "6", label: "toetatud platvormi" },
  { value: "3", label: "sammu retseptini" },
  { value: "~10s", label: "keskmine konversioon" },
];

export default function Hero({
  onOpenRecipe,
}: {
  onOpenRecipe: (r: Recipe) => void;
}) {
  return (
    <section id="algus" className="relative overflow-hidden pt-32 sm:pt-36 pb-16 sm:pb-20">
      {/* taustakiirgus */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 480px at 15% -5%, rgba(231,180,74,0.28), transparent 60%), radial-gradient(800px 500px at 90% 10%, rgba(232,72,15,0.14), transparent 60%)",
        }}
      />

      {/* hõljuv foto-aktsent vasakul */}
      <motion.div
        initial={{ opacity: 0, x: -40, rotate: -8 }}
        animate={{ opacity: 1, x: 0, rotate: -8 }}
        transition={{ duration: 1, delay: 0.9 }}
        className="absolute left-[2%] top-[24%] hidden xl:block w-52 animate-float"
        style={{ "--float-rot": "-8deg" } as React.CSSProperties}
      >
        <div className="rounded-2xl border-4 border-white bg-white p-2 shadow-2xl shadow-ink/20">
          <img
            src="https://images.pexels.com/photos/6275112/pexels-photo-6275112.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
            alt="Shakshuka"
            className="aspect-[4/3] rounded-xl object-cover"
          />
          <p className="py-1.5 text-center font-display text-sm font-bold italic">shakshuka • 30 min</p>
        </div>
      </motion.div>

      {/* hõljuv foto-aktsent paremal */}
      <motion.div
        initial={{ opacity: 0, x: 40, rotate: 7 }}
        animate={{ opacity: 1, x: 0, rotate: 7 }}
        transition={{ duration: 1, delay: 1.05 }}
        className="absolute right-[2.5%] top-[52%] hidden xl:block w-48 animate-float"
        style={{ "--float-rot": "7deg", animationDelay: "-3s" } as React.CSSProperties}
      >
        <div className="rounded-2xl border-4 border-white bg-white p-2 shadow-2xl shadow-ink/20">
          <img
            src="https://images.pexels.com/photos/718739/pexels-photo-718739.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
            alt="Pannkoogid"
            className="aspect-[4/3] rounded-xl object-cover"
          />
          <p className="py-1.5 text-center font-display text-sm font-bold italic">pannkoogid • 25 min</p>
        </div>
      </motion.div>

      <div className="relative mx-auto max-w-4xl px-5 sm:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mb-7 flex w-fit items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-4 py-2 backdrop-blur"
        >
          <Star className="h-4 w-4 fill-gold text-gold" />
          <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-smoke">
            Tasuta AI-retseptikonverter
          </span>
        </motion.div>

        <h1 className="font-display font-black leading-[0.98] tracking-tight text-[clamp(3rem,9vw,6.5rem)]">
          <motion.span
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="block"
          >
            Video sisse.
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="block italic text-flame"
          >
            Retsept välja.
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mx-auto mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-smoke"
        >
          Kleebi TikToki, Instagrami, YouTube'i või Facebooki toiduvideo link — meie AI
          muudab selle sekunditega selgeks retseptiks koos koostisosade, mõõtude ja
          toitumisinfoga.
        </motion.p>

        {/* pöörlev tempel konverteri kõrval */}
        <div className="pointer-events-none absolute -right-4 top-2 hidden lg:block xl:-right-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.8, type: "spring" }}
          >
            <RotatingStamp />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-10 text-left"
        >
          <Converter onOpenRecipe={onOpenRecipe} />
        </motion.div>

        {/* statistika */}
        <motion.dl
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85 }}
          className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4"
        >
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-3xl sm:text-4xl font-black text-ink">
                {s.value}
              </dd>
              <dd className="text-[11px] font-bold uppercase tracking-[0.14em] text-smoke">
                {s.label}
              </dd>
            </div>
          ))}
        </motion.dl>

        <motion.a
          href="#kuidas"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mx-auto mt-10 flex w-fit items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-smoke transition-colors hover:text-flame"
        >
          <MousePointerClick className="h-4 w-4" />
          Vaata, kuidas töötab
        </motion.a>
      </div>
    </section>
  );
}

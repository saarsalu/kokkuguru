import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

const QA = [
  {
    q: "Kas KokkuGuru on tasuta?",
    a: "Jah — konverteri põhikasutus on tasuta ega nõua kontot. Retseptiandmed tulevad recipeapi.io-st, millel on omakorda tasuta astmes 500 päringut kuus, nii et saad kohe pihta hakata.",
  },
  {
    q: "Kas pean konto looma?",
    a: "Ei. Kleebi link konverterisse ja saad kohe terve retsepti — koostisosad, mõõdud ja sammud. Konto pole vajalik isegi retseptide salvestamiseks, sest lemmikud hoitakse sinu brauseris.",
  },
  {
    q: "Milliseid platvorme toetate?",
    a: "Konverter tunneb ära TikToki, Instagrami (Reels, postitused, karusellid), YouTube'i (Shorts ja tavalised videod), Facebooki, Pinteresti ja Rednote'i (Xiaohongshu) lingid.",
  },
  {
    q: "Kuidas konverter täpselt töötab?",
    a: "Lingi vool: backend laeb video alla, eraldab heliraja ja transkribeerib kõne, seejärel vormindab AI sisu struktureeritud retseptiks (etapid on reaalajas näha). Lisaks saad avada Videofaili vahelehe — seal jookseb terve toru sinu brauseris: tasuta Groq Whisper transkribeerib video heli ja Llama-mudel koostab sellest retsepti. Retseptiandmed ja toitumisinfo päritakse recipeapi.io API kaudu.",
  },
  {
    q: "Kust retseptiandmed pärinevad?",
    a: "Kõik retseptid, koostisosad ja toitumisväärtused päritakse recipeapi.io andmebaasist (50 000+ retsepti). Oma sk_live_ API võtme saad seadistada päise hammasrattaikooni kaudu — võti salvestub ainult sinu brauserisse.",
  },
  {
    q: "Miks ma näen demo-režiimi märgist?",
    a: "Kui recipeapi.io võtit pole sisestatud või API pole brauserist kättesaadav (nt CORS-piirang), näitab leht sisseehitatud demo-retseptivalikut, et kogu kogemus toimiks. Ava seaded ja lisa oma võti live-andmete jaoks.",
  },
];

function Item({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.06, duration: 0.5 }}
      className={`overflow-hidden rounded-3xl border transition-colors ${
        open ? "border-flame/30 bg-white shadow-lg shadow-flame/5" : "border-ink/10 bg-white/60"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-6 sm:px-7 py-5 text-left"
      >
        <span className="font-display text-lg sm:text-xl font-black">{q}</span>
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all duration-300 ${
            open ? "rotate-45 bg-flame text-paper" : "bg-cream text-ink"
          }`}
        >
          <Plus className="h-4.5 w-4.5" strokeWidth={2.5} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="px-6 sm:px-7 pb-6 max-w-2xl text-[15px] leading-relaxed text-smoke">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Faq() {
  return (
    <section id="kkk" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="text-[12px] font-bold uppercase tracking-[0.2em] text-flame"
          >
            Korduma kippuvad küsimused
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.08 }}
            className="mt-3 font-display text-4xl sm:text-5xl font-black leading-[1.02] tracking-tight"
          >
            Enne esimest <span className="italic text-flame">kleebist</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.15 }}
            className="mt-5 max-w-sm text-[15px] leading-relaxed text-smoke"
          >
            Kõik, mida inimesed enne oma esimese video lingi konverterisse kleepimist
            küsima kipuvad.
          </motion.p>
        </div>
        <div className="space-y-3.5">
          {QA.map((item, i) => (
            <Item key={item.q} q={item.q} a={item.a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

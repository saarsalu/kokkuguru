import { motion } from "framer-motion";
import {
  Bookmark,
  FolderOpen,
  Salad,
  ScanText,
  Smartphone,
  Timer,
} from "lucide-react";

const FEATURES = [
  {
    icon: ScanText,
    title: "Täpne retseptituvastus",
    text: "AI eristab koostisosad, mõõdud ja ajastuse ka siis, kui video on vaikne või kirjeldus puudub täielikult.",
  },
  {
    icon: Timer,
    title: "Sekunditega valmis",
    text: "Konversioon võtab keskmiselt kümme sekundit — kleebi link ja retsept on laual enne, kui ahju eelkuumutad.",
  },
  {
    icon: Smartphone,
    title: "Mobiilis nagu äpp",
    text: "Kogu kogemus töötab sujuvalt telefonis — konverteeri videoid samal ajal, kui sotsiaalmeedias sirvid.",
  },
  {
    icon: Salad,
    title: "Toitumisinfo kaasas",
    text: "Iga retsepti juures kalorid ja põhimakrod (valgud, süsivesikud, rasvad) recipeapi.io andmete põhjal.",
  },
  {
    icon: Bookmark,
    title: "Salvesta ja jaga",
    text: "Märgi lemmikud südamega — salvestatud retseptid jäävad sinu brauserisse alles ja jagamine on ühe klikiga.",
  },
  {
    icon: FolderOpen,
    title: "Isiklik kogumik",
    text: "Sinna koguneb ajaloo jooksul isiklik digitaalne kokaraamat — kategooriate, köökide ja rogatüüpide kaupa.",
  },
];

export default function Features() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="text-center text-[12px] font-bold uppercase tracking-[0.2em] text-flame"
        >
          Miks KokkuGuru
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.08 }}
          className="mx-auto mt-3 max-w-2xl text-center font-display text-4xl sm:text-5xl font-black leading-[1.02] tracking-tight"
        >
          Rohkem kui lihtsalt <span className="italic text-flame">video alla laadija</span>
        </motion.h2>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: (i % 3) * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="group rounded-3xl border border-ink/8 bg-white/80 p-7 transition-all hover:-translate-y-1.5 hover:border-flame/30 hover:shadow-xl hover:shadow-flame/8"
            >
              <span className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-flame/10 text-flame transition-colors group-hover:bg-flame group-hover:text-paper">
                <f.icon className="h-6 w-6" strokeWidth={2} />
              </span>
              <h3 className="mt-5 font-display text-xl font-black">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-smoke">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

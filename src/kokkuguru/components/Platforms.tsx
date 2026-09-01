import { motion } from "framer-motion";
import {
  BookOpen,
  Camera,
  Music2,
  Pin,
  Play,
  ThumbsUp,
} from "lucide-react";

const PLATFORMS = [
  {
    icon: Music2,
    name: "TikTok",
    desc: "Videod ja fotopostitused",
    accent: "from-zinc-800 to-zinc-950",
  },
  {
    icon: Camera,
    name: "Instagram",
    desc: "Reelsid, postitused ja karusellid",
    accent: "from-fuchsia-500 to-orange-500",
  },
  {
    icon: Play,
    name: "YouTube",
    desc: "Shortsid ja pikemad toiduvideod",
    accent: "from-red-500 to-red-700",
  },
  {
    icon: ThumbsUp,
    name: "Facebook",
    desc: "Reelsid ja jagatud klipid",
    accent: "from-blue-500 to-blue-700",
  },
  {
    icon: Pin,
    name: "Pinterest",
    desc: "Pinnid ja ideevideod",
    accent: "from-rose-500 to-rose-700",
  },
  {
    icon: BookOpen,
    name: "Rednote",
    desc: "Xiaohongshu toidupostitused",
    accent: "from-orange-500 to-amber-600",
  },
];

export default function Platforms() {
  return (
    <section id="platvormid" className="scroll-mt-24 bg-cream/60 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              className="text-[12px] font-bold uppercase tracking-[0.2em] text-flame"
            >
              Toetatud platvormid
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: 0.08 }}
              className="mt-3 font-display text-4xl sm:text-5xl font-black leading-[1.02] tracking-tight"
            >
              Üks konverter,
              <br />
              <span className="italic text-flame">kõik platvormid</span>
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.15 }}
            className="max-w-sm text-[15px] leading-relaxed text-smoke"
          >
            Pole vahet, kus video üles laeti — kui link käib brauseris lahti,
            saab sellest retsepti teha.
          </motion.p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
          {PLATFORMS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, rotate: i % 2 === 0 ? -0.6 : 0.6 }}
              className="group relative overflow-hidden rounded-3xl border border-ink/8 bg-white p-6 sm:p-7 shadow-sm transition-shadow hover:shadow-2xl hover:shadow-ink/12"
            >
              <span
                className={`inline-grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${p.accent} text-white shadow-lg`}
              >
                <p.icon className="h-6 w-6" strokeWidth={2} />
              </span>
              <h3 className="mt-5 font-display text-xl sm:text-2xl font-black">{p.name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-smoke">{p.desc}</p>
              <span className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-cream transition-transform duration-500 group-hover:scale-[2.4]" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

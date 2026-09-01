import { Asterisk } from "lucide-react";

const ITEMS = [
  "TIKTOK",
  "INSTAGRAM REELSID",
  "YOUTUBE SHORTS",
  "FACEBOOK REELS",
  "PINTEREST",
  "REDNOTE",
];

export default function Marquee() {
  const row = (
    <div className="flex shrink-0 items-center">
      {ITEMS.map((item) => (
        <span key={item} className="flex items-center">
          <span className="px-6 font-display text-2xl sm:text-3xl font-black italic tracking-tight text-paper/90">
            {item}
          </span>
          <Asterisk className="h-6 w-6 text-gold" strokeWidth={2.5} />
        </span>
      ))}
    </div>
  );

  return (
    <section className="relative z-10 -rotate-1 overflow-hidden bg-flame py-4 shadow-xl shadow-flame/20">
      <div className="marquee-mask flex w-max animate-marquee">
        {row}
        {row}
      </div>
    </section>
  );
}

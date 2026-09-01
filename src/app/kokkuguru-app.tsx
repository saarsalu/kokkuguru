"use client";

import dynamic from "next/dynamic";

/* KokkuGuru originaalrakendus (saarsalu/kokkuguru) — renderdatakse ainult
   brauseris, sest store loeb moduleerimisel localStorage'i. */
const App = dynamic(() => import("@/kokkuguru/App"), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-screen place-items-center bg-paper">
      <div className="flex flex-col items-center gap-3">
        <span className="font-display text-4xl font-black tracking-tight text-ink">
          Kokku<span className="text-flame">Guru</span>
        </span>
        <span className="h-2 w-2 animate-pulse-soft rounded-full bg-flame" />
      </div>
    </div>
  ),
});

export default function KokkuguruApp() {
  return <App />;
}

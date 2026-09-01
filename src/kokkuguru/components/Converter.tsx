import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  AudioLines,
  BadgeCheck,
  CheckCircle2,
  ClipboardPaste,
  Download,
  FileVideo,
  Heart,
  Link2,
  LoaderCircle,
  Mic,
  RotateCcw,
  Search,
  Sparkles,
  TriangleAlert,
  Upload,
  Wifi,
  ListChecks,
} from "lucide-react";
import { useConverter, fileSizeLabel } from "../hooks/useConverter";
import type { Recipe } from "../lib/api";
import { useAppState, openKeyModal, toggleSaved } from "../lib/store";
import { AI_PROVIDERS } from "../lib/ai";
import { audioApiAvailable, isFacebookUrl } from "../lib/download";

const STAGE_ICONS = [Link2, Download, AudioLines, Mic, Sparkles, ListChecks];
const DISH_SUGGESTIONS = ["pelmeenid", "pasta", "pannkoogid", "poke"];

const SOURCE_LABEL: Record<Recipe["source"], string> = {
  api: "recipeapi.io",
  demo: "Demo-andmed",
  ai: "AI genereeritud",
};

/* ------------------------- töötlemise vaade ------------------------ */

function Processing({ state }: { state: ReturnType<typeof useConverter>["state"] }) {
  return (
    <motion.div
      key="processing"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="px-6 sm:px-10 py-9"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 rounded-full bg-cream px-3.5 py-1.5">
          <Wifi className="h-3.5 w-3.5 text-leaf" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-leaf">
            {state.platform?.name ?? "Platvorm"}
          </span>
        </div>
        <span className="font-display text-4xl font-black tabular-nums text-ink">
          {state.progress}
          <span className="text-flame">%</span>
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-sand/70">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-gold via-flame to-flame-deep"
          animate={{ width: `${state.progress}%` }}
          transition={{ ease: "easeOut", duration: 0.25 }}
        />
      </div>

      <ul className="mt-6 space-y-2.5">
        {state.stages.map((stage, i) => {
          const Icon = STAGE_ICONS[i % STAGE_ICONS.length];
          const done = i < state.stageIndex || state.progress >= 100;
          const active = i === state.stageIndex && state.progress < 100;
          return (
            <li
              key={stage.label}
              className={`flex items-center gap-3 text-[15px] transition-opacity duration-300 ${
                done ? "opacity-100" : active ? "opacity-100" : "opacity-35"
              }`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                  done
                    ? "bg-leaf text-paper"
                    : active
                      ? "bg-flame text-paper shadow-md shadow-flame/30"
                      : "bg-cream text-smoke"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : active ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </span>
              <span className={done || active ? "font-semibold text-ink" : "text-smoke"}>
                {stage.label}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 truncate rounded-xl bg-cream/70 px-3.5 py-2 font-mono text-[11px] text-smoke">
        {state.url}
      </p>
    </motion.div>
  );
}

/* ------------------------ roa nime küsimine ------------------------ */

function NeedDish({
  state,
  onSubmit,
  onReset,
}: {
  state: ReturnType<typeof useConverter>["state"];
  onSubmit: (dish: string) => void;
  onReset?: () => void;
}) {
  return (
    <motion.div
      key="needDish"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="px-6 sm:px-10 py-9"
    >
      <div className="flex items-center gap-2.5">
        <BadgeCheck className="h-5 w-5 text-leaf" />
        <p className="text-sm font-bold uppercase tracking-wider text-leaf">
          {state.platform?.name}-link tuvastatud
        </p>
      </div>
      <h3 className="mt-3 font-display text-2xl sm:text-[28px] font-black leading-tight">
        Millist rooga videos valmistati?
      </h3>
      <p className="mt-2 text-[15px] leading-relaxed text-smoke">
        Video lingist pole roa nime näha — kirjuta paar sõna (nt „pelmeenid" või
        „kreemine pasta"), siis leiame sellele sobivaima retsepti.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem("dish") as HTMLInputElement;
          onSubmit(input.value);
        }}
        className="mt-5 flex flex-col sm:flex-row gap-3"
      >
        <input
          name="dish"
          autoFocus
          placeholder="nt pelmeenid hapukoorega…"
          className="flex-1 rounded-2xl border border-ink/12 bg-white px-5 py-3.5 text-[15px] font-medium placeholder:text-smoke/60 focus:border-flame"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-flame px-6 py-3.5 font-bold text-paper shadow-lg shadow-flame/25 transition-all hover:bg-flame-deep"
        >
          <Search className="h-4.5 w-4.5" />
          Leia retsept
        </button>
      </form>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-smoke">Populaarsed:</span>
        {DISH_SUGGESTIONS.map((d) => (
          <button
            key={d}
            onClick={() => onSubmit(d)}
            className="rounded-full border border-ink/12 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-ink transition-colors hover:border-flame hover:bg-flame hover:text-paper"
          >
            {d}
          </button>
        ))}
      </div>
      {onReset && (
        <button
          onClick={onReset}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-ink/12 px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-smoke transition-colors hover:border-flame hover:text-ink"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Tagasi — kleebin video kirjelduse
        </button>
      )}
    </motion.div>
  );
}

/* --------------------------- tulemuste vaade ------------------------ */

function Results({
  state,
  onOpenRecipe,
  onReset,
}: {
  state: ReturnType<typeof useConverter>["state"];
  onOpenRecipe: (r: Recipe) => void;
  onReset: () => void;
}) {
  const featured = state.results[0];
  const others = state.results.slice(1, 4);
  const { savedRecipes } = useAppState();
  const isSaved = featured ? savedRecipes.some((r) => r.id === featured.id) : false;

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="px-6 sm:px-10 py-9"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-leaf text-paper">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <p className="font-display text-xl font-black">
            Retsept valmis!
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
            featured?.source === "ai" ? "bg-gold/20 text-ink" : "bg-cream text-smoke"
          }`}
        >
          {featured ? SOURCE_LABEL[featured.source] : ""}
        </span>
        {featured && (
          <button
            onClick={() => toggleSaved(featured)}
            aria-label={isSaved ? "Eemalda salvestatust" : "Salvesta retsept"}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
              isSaved
                ? "bg-flame text-paper"
                : "border border-ink/12 text-smoke hover:border-flame hover:text-flame"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}`} />
            {isSaved ? "Salvestatud" : "Salvesta"}
          </button>
        )}
      </div>

      {state.notice && (
        <p className="mt-3 rounded-xl border border-gold/40 bg-gold/10 px-3.5 py-2 text-[13px] font-medium text-ink/70">
          {state.notice}
        </p>
      )}

      {/* Whisperi transkript (faili flow) */}
      {state.transcript && (
        <details className="group mt-4 rounded-xl border border-ink/10 bg-cream/50">
          <summary className="cursor-pointer px-3.5 py-2.5 text-[12px] font-bold uppercase tracking-wider text-smoke">
            Whisperi transkript — klõpsa vaatamiseks
          </summary>
          <p className="max-h-36 overflow-y-auto px-3.5 pb-3 text-[13px] leading-relaxed text-ink/70 italic">
            „{state.transcript}
            {state.transcript.length >= 600 ? "…" : ""}"
          </p>
        </details>
      )}

      {featured && (
        <button
          onClick={() => onOpenRecipe(featured)}
          className="group mt-5 flex w-full items-stretch gap-4 overflow-hidden rounded-2xl border border-ink/10 bg-white text-left transition-all hover:border-flame/50 hover:shadow-xl hover:shadow-flame/10"
        >
          {featured.image && (
            <div className="hidden sm:block w-40 shrink-0 overflow-hidden">
              <img
                src={featured.image}
                alt={featured.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          )}
          <div className="flex-1 py-4.5 pr-4 pl-4 sm:pl-0 sm:pr-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-flame">
              {featured.source === "ai" ? "AI koostas selle sulle" : `Parim vaste · ${state.dish}`}
            </p>
            <h4 className="mt-1 font-display text-[20px] font-black leading-snug group-hover:text-flame transition-colors">
              {featured.name}
            </h4>
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-smoke">
              {featured.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-semibold text-smoke">
              {featured.totalMinutes !== null && <span>{featured.totalMinutes} min</span>}
              {featured.servings !== null && <span>{featured.servings} portsjonit</span>}
              {featured.difficulty && <span>{featured.difficulty}</span>}
              {featured.calories !== null && <span>{Math.round(featured.calories)} kcal</span>}
            </div>
          </div>
          <span className="self-center mr-4 sm:mr-5 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-paper transition-all group-hover:bg-flame group-hover:translate-x-1">
            <ArrowRight className="h-5 w-5" />
          </span>
        </button>
      )}

      {others.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-smoke">
            {featured?.source === "ai" ? "Andmebaasist sobisid ka:" : "Sobivad ka:"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {others.map((r) => (
              <button
                key={r.id}
                onClick={() => onOpenRecipe(r)}
                className="rounded-full border border-ink/12 bg-white px-4 py-2 text-[13px] font-semibold transition-colors hover:border-flame hover:bg-flame hover:text-paper"
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onReset}
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-ink/12 px-5 py-2.5 text-[13px] font-bold uppercase tracking-wider text-smoke transition-colors hover:border-flame hover:text-ink"
      >
        <RotateCcw className="h-4 w-4" />
        Konverteeri uuesti
      </button>
    </motion.div>
  );
}

/* ------------------------------ põhiosa ---------------------------- */

export default function Converter({
  onOpenRecipe,
}: {
  onOpenRecipe: (r: Recipe) => void;
}) {
  const { state, start, submitDish, startFile, reset, setUrl, setDish, setNotes } = useConverter();
  const { mode, aiKey, aiProvider } = useAppState();
  const [tab, setTab] = useState<"link" | "file">("link");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const providerName = AI_PROVIDERS[aiProvider].name;
  // Facebooki / fb.watch linkidel töötab auto-tõmme vaid serveriga versioonis.
  const autoEnabled =
    Boolean(aiKey) && audioApiAvailable() && isFacebookUrl(state.url || "");

  return (
    <div id="konverter" className="relative scroll-mt-28">
      <motion.div
        initial={{ opacity: 0, y: 26, rotate: -0.5 }}
        animate={{ opacity: 1, y: 0, rotate: -0.5 }}
        transition={{ duration: 0.8, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <div className="absolute inset-0 translate-y-3 rotate-[1.2deg] rounded-[30px] bg-ink/8" aria-hidden />
        <div className="relative overflow-hidden rounded-[30px] border border-ink/10 bg-white/95 shadow-2xl shadow-ink/15 backdrop-blur">
          <AnimatePresence mode="wait">
            {state.phase === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-6 sm:px-10 py-8"
              >
                {/* vahelehed */}
                <div className="mb-5 flex rounded-full bg-cream p-1">
                  {(
                    [
                      { id: "link", label: "Video link", icon: Link2 },
                      { id: "file", label: "Videofail", icon: FileVideo },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold transition-all ${
                        tab === t.id
                          ? "bg-ink text-paper shadow-md"
                          : "text-smoke hover:text-ink"
                      }`}
                    >
                      <t.icon className="h-4 w-4" />
                      {t.label}
                    </button>
                  ))}
                </div>

                {tab === "link" ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      start(state.url, state.dish, state.notes);
                    }}
                  >
                    <motion.div
                      animate={state.error ? { x: [0, -7, 7, -4, 4, 0] } : {}}
                      transition={{ duration: 0.4 }}
                      className={`flex items-center gap-3 rounded-2xl border bg-paper/60 px-5 py-4 transition-colors ${
                        state.error ? "border-flame" : "border-ink/12 focus-within:border-flame"
                      }`}
                    >
                      <Link2 className="h-5 w-5 shrink-0 text-smoke" />
                      <input
                        type="text"
                        inputMode="url"
                        value={state.url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Kleebi toiduvideo link siia…"
                        className="w-full bg-transparent text-[15px] sm:text-base font-medium placeholder:text-smoke/60 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const text = await navigator.clipboard.readText();
                            if (text) setUrl(text);
                          } catch {
                            /* brauser keelas */
                          }
                        }}
                        className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-[12px] font-bold text-smoke transition-colors hover:border-flame hover:text-ink"
                      >
                        <ClipboardPaste className="h-3.5 w-3.5" />
                        Kleebi
                      </button>
                    </motion.div>

                    <ErrorNote error={state.error} />

                    <input
                      type="text"
                      value={state.dish}
                      onChange={(e) => setDish(e.target.value)}
                      placeholder="Roa nimi (valikuline — kiirendab tulemust)"
                      className="mt-3 w-full rounded-2xl border border-dashed border-ink/15 bg-transparent px-5 py-3 text-sm font-medium placeholder:text-smoke/50 focus:border-flame focus:outline-none"
                    />

                    <textarea
                      value={state.notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Video kirjeldus või koostisosad (valikuline — kopeeri postituse tekst siia, AI loeb seda)"
                      className="mt-3 w-full resize-none rounded-2xl border border-dashed border-ink/15 bg-transparent px-5 py-3 text-sm font-medium placeholder:text-smoke/50 focus:border-flame focus:outline-none"
                    />
                    <p className="mt-2 px-1 text-[11.5px] leading-relaxed text-smoke">
                      Vihje: FB/TT/IG link ise video infot ei avalda — kopeeri postituse
                      kirjeldus siia või kasuta Videofaili vahelehte tõeliseks konversiooniks.
                    </p>

                    <button
                      type="submit"
                      className="group mt-4 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-flame px-6 py-4.5 font-display text-lg font-black text-paper shadow-xl shadow-flame/30 transition-all hover:bg-flame-deep hover:shadow-flame/45 active:scale-[0.99]"
                    >
                      <Sparkles className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                      Valmista retsepti!
                    </button>
                  </form>
                ) : (
                  <div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="video/*,audio/*"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                    {/* faili valimise ala */}
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className={`flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
                        state.error
                          ? "border-flame bg-flame/5"
                          : file
                            ? "border-leaf/50 bg-leaf/5"
                            : "border-ink/15 bg-paper/60 hover:border-flame/50"
                      }`}
                    >
                      {file ? (
                        <>
                          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-leaf text-paper">
                            <FileVideo className="h-6 w-6" />
                          </span>
                          <span className="text-sm font-bold text-ink">{file.name}</span>
                          <span className="text-[12px] font-semibold text-smoke">
                            {fileSizeLabel(file)} · klõpsa vahetamiseks
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-paper">
                            <Upload className="h-6 w-6" />
                          </span>
                          <span className="text-sm font-bold">
                            Vali video- või audiofail (kuni 25 MB)
                          </span>
                          <span className="max-w-sm text-[12px] leading-relaxed text-smoke">
                            Whisper transkribeerib video heli ja AI koostab sellest
                            retsepti — tasuta Groq võtmega.
                          </span>
                        </>
                      )}
                    </button>

                    <ErrorNote error={state.error} />

                    {!aiKey && (
                      <button
                        type="button"
                        onClick={openKeyModal}
                        className="mt-3 w-full rounded-xl border border-gold/50 bg-gold/10 px-4 py-2.5 text-[13px] font-semibold text-ink/75 transition-colors hover:border-gold"
                      >
                        Faili konverteerimiseks lisa tasuta Groq API võti —{" "}
                        <span className="font-bold underline underline-offset-2">ava seaded</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={!file}
                      onClick={() => file && startFile(file)}
                      className="group mt-4 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-flame px-6 py-4.5 font-display text-lg font-black text-paper shadow-xl shadow-flame/30 transition-all hover:bg-flame-deep hover:shadow-flame/45 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                    >
                      <AudioLines className="h-5 w-5" />
                      Transkribeeri ja tee retseptiks
                    </button>
                  </div>
                )}

                {tab === "link" && !autoEnabled && (
                  <button
                    type="button"
                    onClick={openKeyModal}
                    className="mt-3 w-full rounded-xl bg-cream/70 px-4 py-2.5 text-[12.5px] font-semibold text-smoke transition-colors hover:text-ink"
                  >
                    Tahad, et link konvertuks <strong>täisautomaatselt</strong> (heli → Whisper → tõlge → retsept)?{" "}
                    {audioApiAvailable() ? (
                      <>
                        <strong>Facebooki linkidel töötab see kohe</strong> —{" "}
                        {aiKey ? "kleebi link ja valmista." : "lisa vaid tasuta Groq võti."}{" "}
                        <span className="font-bold underline underline-offset-2">
                          Ava seaded
                        </span>
                      </>
                    ) : (
                      <>
                        Kasuta <strong>Videofaili vahelehte</strong> (lae alla ja tõsta siia) või{" "}
                        <strong>kleebi video kirjeldus</strong> ülal — need töötavad täielikult ka
                        ilma serverita.
                      </>
                    )}
                  </button>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11.5px] font-bold uppercase tracking-wider text-smoke">
                  <span>Registreerimata</span>
                  <span className="h-1 w-1 rounded-full bg-sand" />
                  <span>{mode === "live" ? "recipeapi.io aktiivne" : "Demo-andmed"}</span>
                  <span className="h-1 w-1 rounded-full bg-sand" />
                  <span>{aiKey ? `AI: ${providerName}` : "AI: seadistamata"}</span>
                  <span className="h-1 w-1 rounded-full bg-sand" />
                  <span className={autoEnabled ? "text-leaf" : undefined}>
                    Auto-tõmme: {autoEnabled ? "sees" : "väljas"}
                  </span>
                </div>
              </motion.div>
            )}

            {state.phase === "processing" && <Processing state={state} />}
            {state.phase === "needDish" && (
              <NeedDish state={state} onSubmit={submitDish} onReset={reset} />
            )}
            {state.phase === "results" && (
              <Results state={state} onOpenRecipe={onOpenRecipe} onReset={reset} />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function ErrorNote({ error }: { error: string | null }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2.5 flex items-start gap-2 text-[13px] font-semibold text-flame"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

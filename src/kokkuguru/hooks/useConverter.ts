import { useCallback, useEffect, useRef, useState } from "react";
import { searchRecipes, type Recipe } from "../lib/api";
import {
  generateRecipe,
  transcribeWithWhisper,
  toEnglishQuery,
  AI_PROVIDERS,
  AiError,
} from "../lib/ai";
import {
  audioApiAvailable,
  downloadAudioFile,
  DownloadError,
  isFacebookUrl,
} from "../lib/download";
import { getAppState } from "../lib/store";

/* ------------------------------------------------------------------ */
/* Platvormi tuvastus URL-ist                                          */
/* ------------------------------------------------------------------ */

export interface Platform {
  id: string;
  name: string;
  hosts: string[];
}

export const PLATFORMS: Platform[] = [
  { id: "tiktok", name: "TikTok", hosts: ["tiktok.com", "vm.tiktok"] },
  { id: "instagram", name: "Instagram", hosts: ["instagram.com", "instagr.am"] },
  { id: "youtube", name: "YouTube", hosts: ["youtube.com", "youtu.be"] },
  { id: "facebook", name: "Facebook", hosts: ["facebook.com", "fb.watch", "fb.com"] },
  { id: "pinterest", name: "Pinterest", hosts: ["pinterest.", "pin.it"] },
  { id: "rednote", name: "Rednote", hosts: ["xiaohongshu", "xhslink"] },
];

export function detectPlatform(urlStr: string): Platform | null {
  try {
    const withProto = /^https?:\/\//i.test(urlStr) ? urlStr : `https://${urlStr}`;
    const host = new URL(withProto).hostname.toLowerCase();
    const found = PLATFORMS.find((p) => p.hosts.some((h) => host.includes(h)));
    return found ?? null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Töötlusetapid                                                       */
/* ------------------------------------------------------------------ */

export interface Stage {
  label: string;
}

export const CONVERT_STAGES: Stage[] = [
  { label: "Ühendan videoplatvormiga…" },
  { label: "Laen videoklipi alla…" },
  { label: "Eraldan heliraja…" },
  { label: "Transkribeerin kõne tekstiks…" },
  { label: "AI koostab retsepti struktuuri…" },
  { label: "Kalibreerin mõõdud ja toitumisinfo…" },
];

export const SEARCH_STAGES: Stage[] = [
  { label: "Täpsustan roa tunnuseid…" },
  { label: "AI koostab retsepti / otsin andmebaasist…" },
];

export const FILE_STAGES: Stage[] = [
  { label: "Loen videofaili…" },
  { label: "Saadan heliraja Whisperile…" },
  { label: "Kõne → tekst transkriptsioon…" },
  { label: "AI koostab retsepti struktuuri…" },
];

export const AUTO_STAGES: Stage[] = [
  { label: "Leian video heliraja allika…" },
  { label: "Laen puhta heliraja alla…" },
  { label: "Whisper transkribeerib kõne…" },
  { label: "AI koostab retsepti struktuuri…" },
  { label: "Otsin sobivaid variante andmebaasist…" },
];

/* ------------------------------------------------------------------ */
/* Olekumasin                                                          */
/* ------------------------------------------------------------------ */

export type Phase = "idle" | "processing" | "needDish" | "results";
export type ResultSource = "api" | "demo" | "ai";

export interface ConverterState {
  phase: Phase;
  url: string;
  platform: Platform | null;
  stages: Stage[];
  stageIndex: number;
  progress: number;
  dish: string;
  /** Kasutaja kopeeritud video kirjeldus / koostisosade tekst */
  notes: string;
  results: Recipe[];
  resultSource: ResultSource;
  transcript: string | null;
  notice: string | null;
  error: string | null;
}

const INITIAL: ConverterState = {
  phase: "idle",
  url: "",
  platform: null,
  stages: CONVERT_STAGES,
  stageIndex: 0,
  progress: 0,
  dish: "",
  notes: "",
  results: [],
  resultSource: "demo",
  transcript: null,
  notice: null,
  error: null,
};

const FULL_DURATION = 5200;
const SEARCH_DURATION = 2400;
const FILE_DURATION = 11000;
const MAX_FILE_MB = 25;

/** Mitu MB failil on, ühe komakohaga. */
export function fileSizeLabel(file: File): string {
  return `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
}

export function useConverter() {
  const [state, setState] = useState<ConverterState>(INITIAL);
  const timerRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => clearTimer, []);

  const animateProgress = useCallback(
    (limit: number, duration: number) =>
      new Promise<void>((resolve) => {
        clearTimer();
        const started = performance.now();
        timerRef.current = window.setInterval(() => {
          if (cancelledRef.current) {
            clearTimer();
            resolve();
            return;
          }
          const t = Math.min((performance.now() - started) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 2.2);
          const pct = Math.round(eased * limit);
          setState((s) => {
            const idx = Math.min(
              Math.floor((pct / 100) * s.stages.length),
              s.stages.length - 1,
            );
            return { ...s, progress: pct, stageIndex: Math.max(0, idx) };
          });
          if (t >= 1) {
            clearTimer();
            resolve();
          }
        }, 50);
      }),
    [],
  );

  /**
   * Põhitöö: AI-generatsioon (kui võti olemas) + andmebaasiotsing paralleelselt.
   * Lõpptulemus: AI-retsept esimesel kohal, allpool recipeapi.io variandid.
   */
  const produceResults = useCallback(
    async (
      dish: string,
      context?: { url?: string; platform?: string; dishFull?: string; notes?: string },
    ) => {
      const { aiKey } = getAppState();
      // recipeapi.io on ingliskeelne — tõlgi eestikeelne päring enne otsingut
      const dbPromise = (async () => {
        const en = await toEnglishQuery(dish);
        return searchRecipes(en, 5);
      })();
      const aiPromise = aiKey
        ? generateRecipe({
            dish: context?.dishFull || dish,
            notes: context?.notes,
            url: context?.url,
            platform: context?.platform,
          })
        : null;

      const [dbRes, aiRes] = await Promise.allSettled([dbPromise, aiPromise ?? Promise.resolve(null)]);
      if (cancelledRef.current) return;

      const db = dbRes.status === "fulfilled" ? dbRes.value : { recipes: [], source: "demo" as const, notice: undefined };
      const aiRecipe = aiRes.status === "fulfilled" ? (aiRes.value as Recipe | null) : null;
      const aiFailed = aiPromise !== null && aiRes.status === "rejected";

      const notices: string[] = [];
      if (aiFailed) {
        const reason = (aiRes as PromiseRejectedResult).reason;
        notices.push(
          `AI-generaator ebaõnnestus (${reason instanceof Error ? reason.message : "tundmatu viga"}) — näitan andmebaasi tulemusi.`,
        );
      }
      if (db.notice && !aiRecipe) notices.push(db.notice);

      setState((s) => ({
        ...s,
        dish,
        results: aiRecipe ? [aiRecipe, ...db.recipes.slice(0, 4)] : db.recipes,
        resultSource: aiRecipe ? "ai" : db.source,
        notice: notices.length ? notices.join(" ") : null,
      }));
    },
    [],
  );

  /** Lingi flow: URL (+ roa nimi ja/või video kirjeldus) → töötlus → tulemused. */
  const start = useCallback(
    async (url: string, dish: string, notes: string) => {
      const trimmed = url.trim();
      const platform = detectPlatform(trimmed);
      const dishT = dish.trim();
      const notesT = notes.trim();
      cancelledRef.current = false;

      if (!platform) {
        setState((s) => ({
          ...s,
          url: trimmed,
          error:
            "See link tundub toetamatult — kasuta TikToki, Instagrami, YouTube'i, Facebooki, Pinteresti või Rednote'i linki.",
        }));
        return;
      }

      // Facebook / fb.watch → sisseehitatud helitoru (aiKey on vajalik Whisperi
      // jaoks; staatilisel hostil helitoru puudub — jääme tavavoolu juurde).
      const autoAttempt =
        isFacebookUrl(trimmed) && audioApiAvailable() && Boolean(getAppState().aiKey);

      setState({
        ...INITIAL,
        phase: "processing",
        url: trimmed,
        platform,
        dish: dishT,
        notes: notesT,
        stages: autoAttempt ? AUTO_STAGES : CONVERT_STAGES,
      });

      /* ----- Haru A: automaatne video-tõmme (helitoru → Whisper → AI) ----- */
      if (autoAttempt) {
        const autoWork = (async () => {
          const audio = await downloadAudioFile(trimmed);
          if (cancelledRef.current) return null;
          const text = await transcribeWithWhisper(audio);
          if (!cancelledRef.current) {
            setState((s) => ({ ...s, transcript: text.slice(0, 600) }));
          }
          const recipe = await generateRecipe({
            dish: dishT,
            notes: notesT,
            transcript: text,
            platform: platform.name,
            url: trimmed,
          });
          // Lisa andmebaasi variandid retsepti nime järgi
          let others: Recipe[] = [];
          try {
            const en = await toEnglishQuery(recipe.name);
            const res = await searchRecipes(en, 4);
            others = res.recipes;
          } catch {
            /* andmebaas pole hädavajalik */
          }
          return { recipe, others };
        })();

        const anim = animateProgress(94, 14000);
        const [autoRes] = await Promise.allSettled([autoWork, anim]);
        if (cancelledRef.current) return;

        if (autoRes.status === "fulfilled" && autoRes.value) {
          const { recipe, others } = autoRes.value;
          setState((s) => ({
            ...s,
            progress: 100,
            phase: "results",
            results: [recipe, ...others],
            resultSource: "ai",
            dish: recipe.name,
            notice: null,
          }));
          return;
        }

        // Auto-tõmme ebaõnnestus — jätkame tavavooluga ja teavitame
        const reason =
          (autoRes as PromiseRejectedResult).reason instanceof DownloadError ||
          (autoRes as PromiseRejectedResult).reason instanceof AiError
            ? ((autoRes as PromiseRejectedResult).reason as Error).message
            : "tundmatu viga";
        setState((s) => ({
          ...s,
          notice: `Automaatne video-tõmme ebaõnnestus (${reason}) — jätkan käsitsi vooluga.`,
          stages: CONVERT_STAGES,
          stageIndex: 0,
          progress: 0,
        }));
      }

      /* ----- Haru B: tavavool (roa nimi / kirjeldus → AI + andmebaas) ----- */

      // Kirjeldust saab kasutada ka ilma roa nimeta — võta sealt esimene fraas otsinguks
      const searchQuery = dishT || notesT.split(/\s+/).slice(0, 4).join(" ");
      const hasContent = Boolean(dishT || notesT);
      const work = hasContent
        ? produceResults(searchQuery, {
            url: trimmed,
            platform: platform.name,
            dishFull: dishT,
            notes: notesT,
          })
        : null;
      await animateProgress(hasContent ? 96 : 92, FULL_DURATION);
      if (cancelledRef.current) return;

      if (work) {
        await work;
        if (cancelledRef.current) return;
        setState((s) => ({ ...s, progress: 100, phase: "results" }));
      } else {
        setState((s) => ({ ...s, phase: "needDish" }));
      }
    },
    [animateProgress, produceResults],
  );

  /** Kui link ei sisalda roa nime, küsime seda ja jookseb lühike faasis. */
  const submitDish = useCallback(
    async (dish: string) => {
      if (!dish.trim()) return;
      cancelledRef.current = false;
      setState((s) => ({
        ...s,
        phase: "processing",
        stages: SEARCH_STAGES,
        stageIndex: 0,
        progress: 0,
      }));
      const work = produceResults(dish.trim(), {
        url: state.url,
        platform: state.platform?.name,
        notes: state.notes,
      });
      await animateProgress(96, SEARCH_DURATION);
      await work;
      if (cancelledRef.current) return;
      setState((s) => ({ ...s, progress: 100, phase: "results" }));
    },
    [animateProgress, produceResults, state.url, state.platform],
  );

  /** Videofaili flow: fail → Whisper transkript → AI retsept. Töötab Groq võtmega. */
  const startFile = useCallback(
    async (file: File) => {
      cancelledRef.current = false;
      const { aiKey, aiProvider } = getAppState();

      if (!aiKey) {
        setState((s) => ({
          ...s,
          error:
            "Videofaili konverteerimiseks lisa kõigepealt tasuta Groq API võti — ava päisest hammasratas (API seaded).",
        }));
        return;
      }
      if (!AI_PROVIDERS[aiProvider].whisperModel) {
        setState((s) => ({
          ...s,
          error: "Faili transkriptsioon töötab Groq pakkujaga — vaheta AI pakkuja seadetest Groq peale.",
        }));
        return;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setState((s) => ({
          ...s,
          error: `Fail on liiga suur (${fileSizeLabel(file)}) — tasuta Whisper aktsepteerib kuni ${MAX_FILE_MB} MB.`,
        }));
        return;
      }

      setState({
        ...INITIAL,
        phase: "processing",
        url: file.name,
        platform: { id: "file", name: "Videofail", hosts: [] },
        stages: FILE_STAGES,
      });

      const work = (async () => {
        const text = await transcribeWithWhisper(file);
        if (!cancelledRef.current) {
          setState((s) => ({ ...s, transcript: text.slice(0, 600) }));
        }
        return generateRecipe({
          dish: "",
          transcript: text,
          platform: "videofail",
          url: file.name,
        });
      })();

      const anim = animateProgress(94, FILE_DURATION);
      const [workRes] = await Promise.allSettled([work, anim]);
      if (cancelledRef.current) return;

      if (workRes.status === "rejected") {
        const reason = workRes.reason;
        setState((s) => ({
          ...s,
          phase: "idle",
          progress: 0,
          error:
            reason instanceof AiError
              ? reason.message
              : "Konverteerimine ebaõnnestus — proovi lühema videoga.",
        }));
        return;
      }

      const recipe = workRes.value as Recipe;
      setState((s) => ({
        ...s,
        progress: 100,
        phase: "results",
        results: [recipe],
        resultSource: "ai",
        dish: recipe.name,
        notice: null,
      }));
    },
    [animateProgress],
  );

  const reset = useCallback(() => {
    cancelledRef.current = true;
    clearTimer();
    setState(INITIAL);
  }, []);

  const setUrl = useCallback(
    (url: string) => setState((s) => ({ ...s, url, error: null })),
    [],
  );
  const setDish = useCallback(
    (dish: string) => setState((s) => ({ ...s, dish })),
    [],
  );
  const setNotes = useCallback(
    (notes: string) => setState((s) => ({ ...s, notes })),
    [],
  );

  return { state, start, submitDish, startFile, reset, setUrl, setDish, setNotes };
}

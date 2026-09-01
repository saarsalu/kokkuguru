import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChefHat,
  Clock,
  Flame,
  Heart,
  Search,
  TriangleAlert,
  Users,
} from "lucide-react";
import {
  loadFeaturedRecipes,
  searchRecipes,
  type Recipe,
} from "../lib/api";
import { toEnglishQuery } from "../lib/ai";
import { DEMO_RECIPES } from "../lib/demoRecipes";
import { toggleSaved, useAppState } from "../lib/store";

const CHIPS = [
  { id: "koik", label: "Kõik", query: "" },
  { id: "pannkoogid", label: "Hommikusöök", query: "pannkoogid" },
  { id: "pasta", label: "Pasta", query: "pasta" },
  { id: "kiire", label: "Kiired road", query: "kiire" },
  { id: "magus", label: "Magus", query: "magus" },
  { id: "kala", label: "Kala", query: "kala" },
  { id: "salvestatud", label: "Salvestatud", query: "__saved__" },
];

function RecipeImage({ recipe }: { recipe: Recipe }) {
  if (recipe.image) {
    return (
      <img
        src={recipe.image}
        alt={recipe.name}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
      />
    );
  }
  // API retseptidel pole (veel) pilte — elegante monogramm-paik
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-cream via-sand/60 to-gold/30">
      <ChefHat className="h-10 w-10 text-ink/25" strokeWidth={1.6} />
      <span className="px-4 text-center font-display text-lg font-black italic text-ink/50">
        {recipe.name.slice(0, 2).toUpperCase()}
      </span>
    </div>
  );
}

function RecipeCard({
  recipe,
  onOpen,
}: {
  recipe: Recipe;
  onOpen: (r: Recipe) => void;
}) {
  const { savedRecipes } = useAppState();
  const isSaved = savedRecipes.some((r) => r.id === recipe.id);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-ink/8 bg-white shadow-sm transition-shadow hover:shadow-2xl hover:shadow-ink/15"
    >
      <button
        onClick={() => onOpen(recipe)}
        className="relative block aspect-[4/3] w-full overflow-hidden text-left"
        aria-label={`Ava retsept: ${recipe.name}`}
      >
        <RecipeImage recipe={recipe} />
        <span className="absolute left-3.5 top-3.5 rounded-full bg-ink/75 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-paper backdrop-blur">
          {recipe.source === "api" ? "recipeapi.io" : recipe.source === "ai" ? "AI" : "demo"}
        </span>
        {recipe.difficulty && (
          <span className="absolute right-3.5 top-3.5 rounded-full bg-paper/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink backdrop-blur">
            {recipe.difficulty}
          </span>
        )}
      </button>

      <button
        onClick={() => toggleSaved(recipe)}
        aria-label={isSaved ? "Eemalda salvestatust" : "Salvesta retsept"}
        className={`absolute right-3 top-[calc(75%-6px)] z-10 grid h-10 w-10 place-items-center rounded-full shadow-lg backdrop-blur transition-all active:scale-90 ${
          isSaved ? "bg-flame text-paper" : "bg-white/90 text-ink hover:text-flame"
        }`}
      >
        <Heart className={`h-4.5 w-4.5 ${isSaved ? "fill-current" : ""}`} />
      </button>

      <div className="flex flex-1 flex-col p-5">
        <button onClick={() => onOpen(recipe)} className="text-left">
          <h3 className="font-display text-lg font-black leading-snug transition-colors group-hover:text-flame line-clamp-2">
            {recipe.name}
          </h3>
        </button>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-smoke">
          {recipe.description}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-4 text-[12px] font-bold text-smoke">
          {recipe.totalMinutes !== null && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {recipe.totalMinutes} min
            </span>
          )}
          {recipe.servings !== null && (
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {recipe.servings}
            </span>
          )}
          {recipe.calories !== null && (
            <span className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-flame" />
              {Math.round(recipe.calories)} kcal
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-ink/8 bg-white">
      <div className="aspect-[4/3] animate-pulse-soft bg-cream" />
      <div className="space-y-2.5 p-5">
        <div className="h-5 w-3/4 animate-pulse-soft rounded-lg bg-cream" />
        <div className="h-4 w-full animate-pulse-soft rounded-lg bg-cream/80" />
        <div className="h-4 w-1/2 animate-pulse-soft rounded-lg bg-cream/60" />
      </div>
    </div>
  );
}

export default function RecipeExplorer({
  onOpen,
}: {
  onOpen: (r: Recipe) => void;
}) {
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState("koik");
  const [results, setResults] = useState<Recipe[]>(DEMO_RECIPES);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { savedRecipes } = useAppState();
  const debounceRef = useRef<number | null>(null);

  const runSearch = (q: string) => {
    setLoading(true);
    // recipeapi.io sisu on ingliskeelne — tõlgi ette kui vaja
    toEnglishQuery(q)
      .then((en) => searchRecipes(en, 8))
      .then((res) => {
        setResults(res.recipes);
        setNotice(res.notice ?? null);
      })
      .finally(() => setLoading(false));
  };

  // esmane laadimine: kui võti on, tõmba päris retseptid
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadFeaturedRecipes(8)
      .then((res) => {
        if (!cancelled) {
          setResults(res.recipes);
          setNotice(res.notice ?? null);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // debounce otsing
  useEffect(() => {
    if (chip === "salvestatud") return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const activeQuery = query.trim() || CHIPS.find((c) => c.id === chip)?.query || "";
    debounceRef.current = window.setTimeout(() => runSearch(activeQuery), 420);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, chip]);

  const shown = useMemo(() => {
    // "Salvestatud" vaade kuvab otse salvestatud retseptide hulga (sh AI-retseptid),
    // mitte ainult hetkel laetud otsingutulemusi.
    if (chip === "salvestatud") {
      return savedRecipes;
    }
    return results;
  }, [results, chip, savedRecipes]);

  return (
    <section id="retseptid" className="scroll-mt-24 bg-leaf-deep py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-gold">
              Retseptiraamat
            </p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-black leading-[1.02] tracking-tight text-paper">
              Avasta <span className="italic text-gold">50 000+</span> retsepti
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-paper/60">
              Otsing käib otse recipeapi.io andmebaasist — kui API võtit pole seadistatud,
              näitame sujuvat demo-valikut.
            </p>
          </div>

          {/* otsinguväli */}
          <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-paper/15 bg-paper/8 px-5 py-3.5 backdrop-blur focus-within:border-gold/60">
            <Search className="h-5 w-5 shrink-0 text-paper/50" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (chip === "salvestatud") setChip("koik");
              }}
              placeholder="Otsi rooga, koostisosa või kööki…"
              className="w-full bg-transparent text-[15px] font-medium text-paper placeholder:text-paper/40 focus:outline-none"
            />
          </div>
        </div>

        {/* kiibid */}
        <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-1">
          {CHIPS.map((c) => (
            <button
              key={c.id}
              onClick={() => setChip(c.id)}
              className={`shrink-0 rounded-full px-4.5 py-2 text-[13px] font-bold transition-all ${
                chip === c.id
                  ? "bg-gold text-ink shadow-lg shadow-gold/25"
                  : "border border-paper/15 text-paper/70 hover:border-gold/50 hover:text-paper"
              }`}
            >
              {c.id === "salvestatud" && (
                <Heart className="mr-1.5 inline h-3.5 w-3.5 -mt-0.5 fill-current" />
              )}
              {c.label}
            </button>
          ))}
        </div>

        {notice && (
          <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-medium text-gold">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {notice}
          </div>
        )}

        {/* tulemuste ruudustik */}
        <motion.div layout className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {loading && chip !== "salvestatud"
              ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
              : shown.map((r) => <RecipeCard key={r.id} recipe={r} onOpen={onOpen} />)}
          </AnimatePresence>
        </motion.div>

        {!loading && shown.length === 0 && (
          <div className="mt-8 rounded-3xl border border-dashed border-paper/20 py-16 text-center">
            <ChefHat className="mx-auto h-10 w-10 text-paper/30" />
            <p className="mt-4 font-display text-xl font-bold text-paper/80">
              {chip === "salvestatud"
                ? "Sa pole veel ühtegi retsepti salvestanud"
                : "Sobivaid retsepte ei leitud"}
            </p>
            <p className="mt-1.5 text-sm text-paper/50">
              {chip === "salvestatud"
                ? "Klõpsa retsepti kaardil südant ja see ilmub siia."
                : "Proovi teist märksõna või eemalda filter."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

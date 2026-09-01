import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  ChefHat,
  Clock,
  Copy,
  Flame,
  Heart,
  Minus,
  Plus,
  Users,
  X,
} from "lucide-react";
import { formatAmount, type Recipe } from "../lib/api";
import { toggleSaved, useAppState } from "../lib/store";

function NutritionBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number | null;
  max: number;
  color: string;
}) {
  if (value === null) return null;
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex items-baseline justify-between text-[13px] font-bold">
        <span className="text-smoke">{label}</span>
        <span>{Math.round(value)} g</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

export default function RecipeModal({
  recipe,
  onClose,
}: {
  recipe: Recipe;
  onClose: () => void;
}) {
  const baseServings = recipe.servings ?? 4;
  const [servings, setServings] = useState(baseServings);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const { savedRecipes } = useAppState();
  const isSaved = savedRecipes.some((r) => r.id === recipe.id);
  const factor = servings / baseServings;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const scaledIngredients = useMemo(
    () =>
      recipe.ingredients.map((ing) => {
        if (ing.amount === undefined) return ing.raw;
        const scaled = ing.amount * factor;
        const n = Math.max(0, Math.round(scaled * 10) / 10);
        return `${formatAmount(n)}${ing.unit ? " " + ing.unit : ""} ${ing.name ?? ""}`.trim();
      }),
    [recipe, factor],
  );

  const copyRecipe = async () => {
    const text = [
      recipe.name.toUpperCase(),
      recipe.description,
      "",
      `KOOSTISOSAD (${servings} portsjonit):`,
      ...scaledIngredients.map((i) => `• ${i}`),
      "",
      "VALMISTAMINE:",
      ...recipe.instructions.map((s, i) => `${i + 1}. ${s}`),
      "",
      "— KokkuGuru · recipeapi.io",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-ink/60 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <motion.article
        initial={{ y: 60, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] sm:rounded-[28px] bg-paper shadow-2xl"
      >
        {/* päis */}
        <div className="relative h-56 sm:h-64 shrink-0 overflow-hidden">
          {recipe.image ? (
            <img src={recipe.image} alt={recipe.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cream to-gold/40">
              <ChefHat className="h-16 w-16 text-ink/20" strokeWidth={1.4} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
          <button
            onClick={onClose}
            aria-label="Sule"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-paper/90 text-ink shadow-lg transition-transform hover:scale-105"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex flex-wrap gap-2">
              {recipe.cuisine && (
                <span className="rounded-full bg-paper/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">
                  {recipe.cuisine}
                </span>
              )}
              <span className="rounded-full bg-flame px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-paper">
                {recipe.source === "api" ? "recipeapi.io" : recipe.source === "ai" ? "AI genereeritud" : "demo"}
              </span>
            </div>
            <h2 className="mt-2.5 font-display text-2xl sm:text-4xl font-black leading-tight text-paper">
              {recipe.name}
            </h2>
          </div>
        </div>

        {/* sisu */}
        <div className="overflow-y-auto">
          {/* meta + tegevused */}
          <div className="flex flex-wrap items-center gap-3 border-b border-ink/8 px-6 sm:px-8 py-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-bold text-smoke">
              {recipe.totalMinutes !== null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {recipe.totalMinutes} min
                </span>
              )}
              {recipe.difficulty && (
                <span className="flex items-center gap-1.5">
                  <ChefHat className="h-4 w-4" /> {recipe.difficulty}
                </span>
              )}
              {recipe.calories !== null && (
                <span className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-flame" /> {Math.round(recipe.calories)} kcal / portsjon
                </span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={copyRecipe}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 px-3.5 py-2 text-[12px] font-bold text-smoke transition-colors hover:border-flame hover:text-ink"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-leaf" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Kopeeritud!" : "Kopeeri"}
              </button>
              <button
                onClick={() => toggleSaved(recipe)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-bold transition-colors ${
                  isSaved
                    ? "bg-flame text-paper"
                    : "border border-ink/12 text-smoke hover:border-flame hover:text-ink"
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}`} />
                {isSaved ? "Salvestatud" : "Salvesta"}
              </button>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-6">
            {recipe.description && (
              <p className="max-w-2xl text-[15px] leading-relaxed text-smoke">
                {recipe.description}
              </p>
            )}

            <div className="mt-7 grid gap-10 lg:grid-cols-[1fr_1.3fr]">
              {/* koostisosad */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-black">Koostisosad</h3>
                  <div className="flex items-center gap-1 rounded-full border border-ink/12 p-1">
                    <button
                      onClick={() => setServings(Math.max(1, servings - 1))}
                      aria-label="Vähem portsjoneid"
                      className="grid h-7 w-7 place-items-center rounded-full hover:bg-cream"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="flex min-w-[72px] items-center justify-center gap-1 text-[12px] font-bold">
                      <Users className="h-3.5 w-3.5" /> {servings} ports.
                    </span>
                    <button
                      onClick={() => setServings(Math.min(24, servings + 1))}
                      aria-label="Rohkem portsjoneid"
                      className="grid h-7 w-7 place-items-center rounded-full hover:bg-cream"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <ul className="mt-4 space-y-1">
                  {scaledIngredients.map((ing, i) => {
                    const isChecked = checked.has(i);
                    return (
                      <li key={i}>
                        <button
                          onClick={() =>
                            setChecked((prev) => {
                              const next = new Set(prev);
                              if (next.has(i)) next.delete(i);
                              else next.add(i);
                              return next;
                            })
                          }
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] transition-colors hover:bg-cream/70 ${
                            isChecked ? "text-smoke/50 line-through" : "text-ink"
                          }`}
                        >
                          <span
                            className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-all ${
                              isChecked
                                ? "border-leaf bg-leaf text-paper"
                                : "border-ink/25"
                            }`}
                          >
                            {isChecked && <Check className="h-3.5 w-3.5" />}
                          </span>
                          <span className="font-medium">{ing}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {/* toitumisinfo */}
                {(recipe.protein !== null || recipe.carbs !== null || recipe.fat !== null) && (
                  <div className="mt-8 rounded-2xl border border-ink/8 bg-white/70 p-5">
                    <h4 className="font-display text-base font-black">Toitumisinfo</h4>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-smoke">
                      hinnang portsjoni kohta
                    </p>
                    <div className="mt-4 space-y-3.5">
                      <NutritionBar label="Valgud" value={recipe.protein} max={60} color="bg-leaf" />
                      <NutritionBar label="Süsivesikud" value={recipe.carbs} max={90} color="bg-gold" />
                      <NutritionBar label="Rasvad" value={recipe.fat} max={70} color="bg-flame" />
                    </div>
                  </div>
                )}
              </div>

              {/* juhised */}
              <div>
                <h3 className="font-display text-xl font-black">Valmistamine</h3>
                <ol className="mt-4 space-y-1">
                  {recipe.instructions.map((step, i) => (
                    <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
                      {i < recipe.instructions.length - 1 && (
                        <span className="absolute left-[15px] top-9 bottom-0 w-px bg-ink/10" />
                      )}
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-display text-sm font-black text-paper">
                        {i + 1}
                      </span>
                      <p className="pt-1 text-[15px] leading-relaxed text-ink/85">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <p className="mt-10 border-t border-ink/8 pt-5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-smoke">
              Konverteeritud KokkuGuru abil · andmed recipeapi.io
            </p>
          </div>
        </div>
      </motion.article>
    </motion.div>
  );
}

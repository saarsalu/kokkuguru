import { getAppState, setApiMode } from "./store";
import { demoSearch, DEMO_RECIPES } from "./demoRecipes";

/* ------------------------------------------------------------------ */
/* Tüübid                                                              */
/* ------------------------------------------------------------------ */

export interface Ingredient {
  /** Algne kujutatav tekst, nt "300 g nisujahu" */
  raw: string;
  name?: string;
  amount?: number;
  unit?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  image: string | null;
  totalMinutes: number | null;
  prepMinutes: number | null;
  servings: number | null;
  difficulty: string | null;
  cuisine: string | null;
  tags: string[];
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  ingredients: Ingredient[];
  instructions: string[];
  source: "api" | "demo" | "ai";
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 0, code = "UNKNOWN") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/* ------------------------------------------------------------------ */
/* recipeapi.io klient                                                 */
/* Dokumentatsioon: https://recipeapi.io/docs/api-reference/           */
/* ------------------------------------------------------------------ */

// Kahe build-režiimi tugi: Next.js (process.env) ja Vite/GitHub Pages (import.meta.env).
// Brauseris `process` ei eksisteeri — kontrollime enne.
const API_BASE =
  (typeof globalThis !== "undefined" &&
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
      ?.NEXT_PUBLIC_RECIPE_API_BASE) ||
  (import.meta.env.VITE_RECIPE_API_BASE as string | undefined) ||
  "https://recipeapi.io/api/v1";

async function apiFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const { apiKey } = getAppState();
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  });

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}`, "X-API-Key": apiKey } : {}),
      },
    });
  } catch {
    // Võrgu- või CORS-viga — brauser ei jõua API-ni
    throw new ApiError(
      "Brauser ei saanud API-ga ühendust (võrk või CORS).",
      0,
      "NETWORK",
    );
  }

  if (!res.ok) {
    let code = "HTTP_" + res.status;
    let message = `API vastas veaga ${res.status}.`;
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
      if (body?.error?.code) code = body.error.code;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status, code);
  }

  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ */
/* Vastuste normaliseerimine -> Recipe                                 */
/* ------------------------------------------------------------------ */

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const m = v.replace(",", ".").match(/-?\d+(\.\d+)?/);
    if (m) return Number(m[0]);
  }
  if (v && typeof v === "object") {
    const obj = v as Record<string, unknown>;
    for (const key of ["amount", "value", "total", "count"]) {
      const n = toNumber(obj[key]);
      if (n !== null) return n;
    }
  }
  return null;
}

function toMinutes(v: unknown): number | null {
  if (typeof v === "string") {
    const lower = v.toLowerCase();
    const n = toNumber(v);
    if (n === null) return null;
    if (lower.includes("h") || lower.includes("tund")) return n * 60;
    return n;
  }
  const n = toNumber(v);
  return n;
}

const DIFFICULTY_ET: Record<string, string> = {
  easy: "Lihtne",
  medium: "Keskmine",
  hard: "Raske",
  beginner: "Lihtne",
  advanced: "Raske",
};

function toText(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

function toDifficulty(v: unknown): string | null {
  const t = toText(v);
  if (!t) return null;
  return DIFFICULTY_ET[t.toLowerCase()] ?? t;
}

function normalizeIngredient(raw: unknown): Ingredient | null {
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return null;
    return { raw: s };
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const name =
      toText(o.name) ?? toText(o.ingredient) ?? toText(o.item) ?? "";
    const amount = toNumber(o.amount ?? o.quantity ?? o.qty);
    const unit = toText(o.unit) ?? toText(o.measure) ?? undefined;
    if (!name && o.raw) return { raw: String(o.raw) };
    if (!name) return null;
    const display =
      amount !== null
        ? `${formatAmount(amount)}${unit ? " " + unit : ""} ${name}`
        : `${unit ? unit + " " : ""}${name}`;
    return { raw: display.trim(), name, amount: amount ?? undefined, unit };
  }
  return null;
}

function normalizeInstructions(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v
      .map((s) => {
        if (typeof s === "string") return s.trim();
        if (s && typeof s === "object") {
          return (
            toText((s as Record<string, unknown>).instruction) ??
            toText((s as Record<string, unknown>).text) ??
            toText((s as Record<string, unknown>).step_text) ??
            ""
          );
        }
        return "";
      })
      .filter(Boolean);
  }
  if (typeof v === "string") {
    return v
      .split(/\n+/)
      .map((s) => s.replace(/^\s*\d+[.)]\s*/, "").trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeTags(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v
      .map((t) => (typeof t === "string" ? t : toText((t as Record<string, unknown>)?.name)))
      .filter((t): t is string => Boolean(t));
  }
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeRecipe(raw: any, source: "api" | "demo" = "api"): Recipe {
  const nutrition = raw?.nutrition && typeof raw.nutrition === "object" ? raw.nutrition : {};
  const prep = toMinutes(raw?.prep_time ?? raw?.prepTime ?? raw?.preparation_time);
  const cook = toMinutes(raw?.cook_time ?? raw?.cookTime ?? raw?.cooking_time);
  const total =
    toMinutes(raw?.total_time ?? raw?.totalTime ?? raw?.time ?? raw?.ready_in) ??
    (prep !== null || cook !== null ? (prep ?? 0) + (cook ?? 0) : null);

  const ingredientsRaw = Array.isArray(raw?.ingredients) ? raw.ingredients : [];

  return {
    id: String(raw?.id ?? raw?.slug ?? crypto.randomUUID()),
    name: toText(raw?.name) ?? toText(raw?.title) ?? "Retsept",
    description: toText(raw?.description) ?? toText(raw?.summary) ?? "",
    image:
      toText(raw?.image) ??
      toText(raw?.image_url) ??
      toText(raw?.imageUrl) ??
      toText(raw?.thumbnail) ??
      null,
    totalMinutes: total,
    prepMinutes: prep,
    servings: toNumber(raw?.servings ?? raw?.yield ?? raw?.portions),
    difficulty: toDifficulty(raw?.difficulty ?? raw?.level),
    cuisine: toText(raw?.cuisine ?? raw?.cuisine_type),
    tags: normalizeTags(raw?.tags ?? raw?.dietary_tags ?? raw?.diets),
    calories: toNumber(raw?.calories ?? nutrition.calories ?? nutrition.kcal),
    protein: toNumber(raw?.protein ?? nutrition.protein),
    carbs: toNumber(raw?.carbs ?? raw?.carbohydrates ?? nutrition.carbs ?? nutrition.carbohydrates),
    fat: toNumber(raw?.fat ?? nutrition.fat),
    ingredients: ingredientsRaw
      .map(normalizeIngredient)
      .filter((i: Ingredient | null): i is Ingredient => i !== null),
    instructions: normalizeInstructions(raw?.instructions ?? raw?.steps ?? raw?.directions),
    source,
  };
}

/* ------------------------------------------------------------------ */
/* Avalikud päringufunktsioonid (API + demo varuvariant)              */
/* ------------------------------------------------------------------ */

export interface SearchResult {
  recipes: Recipe[];
  source: "api" | "demo";
  notice?: string;
}

async function apiList(params: Record<string, string | number | undefined>): Promise<Recipe[]> {
  const res = await apiFetch<{ data?: unknown[] }>("/recipes", params);
  const list = Array.isArray(res?.data) ? res.data : [];
  return list.map((r) => normalizeRecipe(r, "api"));
}

/**
 * Otsib retsepte. Kui API võti on seadistatud, kasutab recipeapi.io pärisandmeid,
 * vastasel juhul (või vea korral) lülitub sujuvalt demo-andmetele.
 */
export async function searchRecipes(query: string, perPage = 8): Promise<SearchResult> {
  const { apiKey } = getAppState();
  if (apiKey) {
    try {
      // Esimene katse: kogu päring. Varuvariant: eraldi märksõnad (API võib AND-matchida).
      const candidates = [query, ...query.split(/\s+/).filter((t) => t.length > 2)].slice(0, 4);
      for (const cand of candidates) {
        const recipes = await apiList({ search: cand || undefined, per_page: perPage });
        setApiMode("live");
        if (recipes.length > 0) return { recipes, source: "api" };
      }
      return {
        recipes: [],
        source: "api",
        notice: `API-st ei leitud vastet (${candidates.join(" / ")}) — proovi teist märksõna.`,
      };
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 401 || err.status === 403) {
        setApiMode("auth-error", "API võti on vigane või puudub — näitan demo-andmeid.");
      } else if (err.status === 429) {
        setApiMode("demo", "API piirang on täis — näitan ajutiselt demo-andmeid.");
      } else {
        setApiMode("demo", err.message || "API viga — näitan demo-andmeid.");
      }
      return { recipes: demoSearch(query).slice(0, perPage), source: "demo", notice: err.message };
    }
  }
  return { recipes: demoSearch(query).slice(0, perPage), source: "demo" };
}

/** Tagastab esilehe retseptid (API-st kui võimalik, muidu demo). */
export async function loadFeaturedRecipes(perPage = 8): Promise<SearchResult> {
  const { apiKey } = getAppState();
  if (apiKey) {
    try {
      const recipes = await apiList({ per_page: perPage, page: 1 });
      setApiMode("live");
      if (recipes.length > 0) return { recipes, source: "api" };
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 401 || err.status === 403) {
        setApiMode("auth-error", "API võti on vigane või puudub — näitan demo-andmeid.");
      } else {
        setApiMode("demo", err.message);
      }
    }
  }
  return { recipes: DEMO_RECIPES.slice(0, perPage), source: "demo" };
}

/** Vorminda kogus portsjoni arvutamise jaoks. */
export function formatAmount(n: number): string {
  if (Number.isInteger(n)) return String(n);
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", ",");
}

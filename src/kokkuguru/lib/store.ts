import { useSyncExternalStore } from "react";
import type { Recipe } from "./api";

export type ApiMode = "demo" | "live" | "auth-error";

export type AiProvider = "groq" | "openrouter";

export interface AppState {
  mode: ApiMode;
  modeMessage?: string;
  apiKey: string | null;
  aiKey: string | null;
  aiProvider: AiProvider;
  /** Tühi = pakkujal on vaikimudel */
  aiModel: string;
  /** Salvestatud (südametega) retseptid — täis objekdid, nii et need püsivad üle sessiooni */
  savedRecipes: Recipe[];
}

const KEY_STORAGE = "kokkuguru_api_key";
const AI_KEY_STORAGE = "kokkuguru_ai_key";
const AI_PROVIDER_STORAGE = "kokkuguru_ai_provider";
const AI_MODEL_STORAGE = "kokkuguru_ai_model";
const SAVED_STORAGE = "kokkuguru_saved";

function readSaved(): Recipe[] {
  try {
    const raw = localStorage.getItem(SAVED_STORAGE);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let state: AppState = {
  mode: localStorage.getItem(KEY_STORAGE) ? "live" : "demo",
  apiKey: localStorage.getItem(KEY_STORAGE),
  aiKey: localStorage.getItem(AI_KEY_STORAGE),
  aiProvider: (localStorage.getItem(AI_PROVIDER_STORAGE) as AiProvider) || "groq",
  aiModel: localStorage.getItem(AI_MODEL_STORAGE) || "",
  savedRecipes: readSaved(),
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot() {
  return state;
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function getAppState(): AppState {
  return state;
}

function patch(next: Partial<AppState>) {
  state = { ...state, ...next };
  emit();
}

/** Salvestab (või eemaldab) recipeapi.io API võtme brauseri localStorage'isse. */
export function setApiKey(key: string | null) {
  const clean = key?.trim() || null;
  if (clean) localStorage.setItem(KEY_STORAGE, clean);
  else localStorage.removeItem(KEY_STORAGE);
  patch({ apiKey: clean, mode: clean ? "live" : "demo", modeMessage: undefined });
}

/** Salvestab tasuta AI-pakkujaga (Groq / OpenRouter) seotud võtme. */
export function setAiCredentials(key: string | null, provider?: AiProvider, model?: string) {
  const clean = key?.trim() || null;
  if (clean) localStorage.setItem(AI_KEY_STORAGE, clean);
  else localStorage.removeItem(AI_KEY_STORAGE);
  const nextProvider = provider ?? state.aiProvider;
  localStorage.setItem(AI_PROVIDER_STORAGE, nextProvider);
  const nextModel = model ?? state.aiModel;
  if (nextModel) localStorage.setItem(AI_MODEL_STORAGE, nextModel);
  else localStorage.removeItem(AI_MODEL_STORAGE);
  patch({ aiKey: clean, aiProvider: nextProvider, aiModel: nextModel });
}

/** Salvestab valitud AI-mudeli (tühi string = pakkujal vaikimudel). */
export function setAiModel(model: string) {
  const clean = model.trim();
  if (clean) localStorage.setItem(AI_MODEL_STORAGE, clean);
  else localStorage.removeItem(AI_MODEL_STORAGE);
  patch({ aiModel: clean });
}

export function setApiMode(mode: ApiMode, message?: string) {
  // Ära läita kasutajat "demo" režiimi tagasi, kui tal on võti sees ja viga polnud autentimine
  patch({ mode, modeMessage: message });
}

/** Ümberlülitab retsepti salvestamise — lisab/eemaldab selle südamega salvestatud hulgast. */
export function toggleSaved(recipe: Recipe) {
  const exists = state.savedRecipes.some((r) => r.id === recipe.id);
  const savedRecipes = exists
    ? state.savedRecipes.filter((r) => r.id !== recipe.id)
    : [recipe, ...state.savedRecipes];
  try {
    localStorage.setItem(SAVED_STORAGE, JSON.stringify(savedRecipes));
  } catch {
    /* ignore */
  }
  patch({ savedRecipes });
}

/** Väike üleilaaniline sündmus: ava API-võtme seadete aken. */
export function openKeyModal() {
  window.dispatchEvent(new CustomEvent("kokkuguru:open-key-modal"));
}

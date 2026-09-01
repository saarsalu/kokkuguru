import { getAppState, type AiProvider } from "./store";
import { formatAmount, type Ingredient, type Recipe } from "./api";

/* ------------------------------------------------------------------ */
/* Tasuta AI-pakkujad (nimekirjast github.com/OuterSpacee/free-ai-apis) */
/*                                                                     */
/* MÄRKUS (2026): Groq on pensionile saatnud llama-3.3-70b-versatile  */
/* — soovitatav asendus on openai/gpt-oss-120b. Mudelinimekiri saab    */
/* alati seadetest live-kujul uuendada.                                */
/* ------------------------------------------------------------------ */

export interface AiProviderConfig {
  id: AiProvider;
  name: string;
  baseUrl: string;
  chatModel: string;
  whisperModel: string | null;
  keyUrl: string;
  keyPrefix: string;
  note: string;
}

export const AI_PROVIDERS: Record<AiProvider, AiProviderConfig> = {
  groq: {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    chatModel: "openai/gpt-oss-120b",
    whisperModel: "whisper-large-v3",
    keyUrl: "https://console.groq.com/keys",
    keyPrefix: "gsk_",
    note: "Tasuta päevane limiit — toetab ka videofailide Whisper-transkriptsiooni.",
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    chatModel: "meta-llama/llama-3.3-70b-instruct:free",
    whisperModel: null,
    keyUrl: "https://openrouter.ai/keys",
    keyPrefix: "sk-or-",
    note: "Tasuta :free mudelid ainult retsepti genereerimiseks (audiot ei toeta).",
  },
};

export class AiError extends Error {}

/** Kasutaja valitud mudel või pakkujal vaikimudel. */
function resolveModel(): string {
  const { aiModel, aiProvider } = getAppState();
  return aiModel || AI_PROVIDERS[aiProvider].chatModel;
}

/* ------------------------------------------------------------------ */
/* Universaalne chat-päring (OpenAI-ühilduv)                            */
/* ------------------------------------------------------------------ */

interface ChatOpts {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  json?: boolean;
}

async function chatComplete(opts: ChatOpts): Promise<string> {
  const { aiKey, aiProvider } = getAppState();
  const cfg = AI_PROVIDERS[aiProvider];
  if (!aiKey) throw new AiError("AI võti pole seadistatud — ava seaded ja lisa tasuta võti.");

  const model = resolveModel();
  const baseBody: Record<string, unknown> = {
    model,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 2200,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  };
  // Groq gpt-oss reasoning-mudelitele: medium annab parema eesti keele
  if (model.includes("gpt-oss")) baseBody.reasoning_effort = "medium";

  const doFetch = (withJson: boolean) =>
    fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiKey}`,
      },
      body: JSON.stringify({
        ...baseBody,
        ...(withJson ? { response_format: { type: "json_object" } } : {}),
      }),
    });

  let res: Response;
  try {
    res = await doFetch(Boolean(opts.json));
    // Mõned (tasuta) mudelid ei toeta response_format-i — proovi ilma
    if (!res.ok && res.status === 400 && opts.json) {
      res = await doFetch(false);
    }
  } catch {
    throw new AiError("Brauser ei saanud AI-API-ga ühendust (võrk või CORS).");
  }

  if (!res.ok) {
    let msg = `AI API vastas veaga ${res.status}.`;
    try {
      const body = await res.json();
      if (body?.error?.message) msg = body.error.message;
    } catch {
      /* ignore */
    }
    if (/model|decommission|not found|does not exist|no endpoints/i.test(msg)) {
      msg += " — ava Seaded ja klõpsa „Tõmba mudelite nimekiri“, seejärel vali uus mudel.";
    }
    throw new AiError(msg);
  }

  const json = await res.json();
  const choice = json?.choices?.[0]?.message;
  const content =
    typeof choice?.content === "string"
      ? choice.content
      : Array.isArray(choice?.content)
        ? choice.content
            .map((c: { type?: string; text?: string }) => c?.text ?? "")
            .join("")
        : "";
  if (!content.trim()) throw new AiError("AI ei tagastanud sisu — proovi seadetest teist mudelit.");
  return content;
}

/* ------------------------------------------------------------------ */
/* Retsepti genereerimise prompt                                        */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `Oled tunnustatud peakokk ja toitumisnõustaja. Sinu ülesanne on koostada sotsiaalmeedia toiduvideo info põhjal realistlik, täpne ja maitsvalt kõlav retsept EESTI KEELES.

Vasta AINULT kehtiva JSON-objektiga (ilma markdowni, koodiplokkide või selgitusteta) täpselt selle skeemiga:
{
  "name": string,
  "description": string,
  "totalMinutes": number,
  "prepMinutes": number,
  "servings": number,
  "difficulty": "Lihtne" | "Keskmine" | "Raske",
  "cuisine": string,
  "tags": string[],
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "ingredients": [{ "name": string, "amount": number | null, "unit": string }],
  "instructions": string[]
}

Karmid nõuded:
- Kõik tekst eesti keeles. Juhised imperatiivis, loogilises järjekorras, 4–8 sammu.
- "amount" on ALATI arv (mitte sõna), meetrilised ühikud: g, kg, ml, dl, l, tl, spl, tk, küüsnt.
- Kui kogust pole ("maitse järgi"), pane amount:null ja lisa see "name" väljale, nt "soola maitse järgi".
- "calories" on kcal portsjoni kohta; protein/carbs/fat grammides portsjoni kohta — realistlikud hinnangud.
- "description" 1–2 lauset, isuäratav ja konktreetne.

KEELEKVALITEET (kriitiliselt tähtis!):
- Kirjuta laitmatu, emakeelse tasemega eesti keeles — nagu kokaraamatu professionaalne toimetaja.
- Ära KUNAGI leiuta sõnu ega tõlgi sõna-sõnalt. Ära kasuta mittensönaid (nt vale on: lihavõle, sibemed, taiga, võts).
- Kasuta tavapäraseid eesti toidutermineid: hakkliha, hapukoor, sibul, küüslauk, võid, tainas, täidis, küpseta, pruunista, hauduta, kurna, maitsesta.
- Kui mõne termini pärast kahtled, kasuta lihtsat igapäevast sõna.`;

/** Teine pääs — keelekorrektor, mis parandab JSON-i eesti keele muutmata struktuuri. */
const PROOFREAD_PROMPT = `Sa oled professionaalne eesti keele toimetaja ja kokaraamatute korrektor. Saad rida-arvuga retsepti-JSON-i.

SINU ÜLESANNE: paranda AINULT tekstiväljade eesti keel laitmatuks ja loomulikuks (name, description, cuisine, tags, ingredients[].name, instructions). Mõned mudelid toodavad vigaseid sõnaid — asenda need päris eesti sõnadega, nt:
lihavõle→hakkliha, sibemed→sibul, hapukaste→hapukoor, võts→või/d, taiga→tainas, kuivdada→jaga taigna, kastuks→tõmbub kastmesse.

RANGE REEGEL: ära muuda struktuuri, väljanimesid, numbreid, koguseid, ühikuid ega järjekorda. Vasta AINULT parandatud JSON-iga, ilma selgitusteta.`;

export interface GenerateOptions {
  dish: string;
  url?: string;
  platform?: string;
  transcript?: string;
  /** Kasutaja kopeeritud video kirjeldus / koostisosade tekst */
  notes?: string;
}

function buildUserPrompt({ dish, url, platform, transcript, notes }: GenerateOptions): string {
  const lines: string[] = [];
  lines.push("Koosta retsept järgmise sotsiaalmeedia toiduvideo põhjal.");
  if (platform) lines.push(`Platvorm: ${platform}`);
  if (url) lines.push(`Video link: ${url}`);
  if (dish) lines.push(`Roa nimi / kirjeldus: ${dish}`);
  if (notes) {
    lines.push("", "Kasutaja kopeeritud video kirjeldus / lisainfo:", `"""${notes.slice(0, 1800)}"""`);
  }
  if (transcript) {
    lines.push("", "Video heli transkriptsioon (Whisper):", `"""${transcript.slice(0, 3500)}"""`);
  }
  lines.push(
    "",
    "Lähtesta retsept eelkõige kirjeldusest/transkribist — kui seal on koostisosad või sammud kirjas, kasuta neid täpselt. Kui info on napikas, koosta selle roa jaoks kõige tavalisem, kvaliteetne kodune versioon.",
  );
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* JSON-i parsimine -> Recipe                                           */
/* ------------------------------------------------------------------ */

/** Valib retsepti nime/siltide põhjal sobiva demo-ilustratsiooni. */
function pickImage(text: string): string | null {
  const t = text.toLowerCase();
  const MAP: Array<[string[], string]> = [
    [["pelmeen", "dumpling"], "https://images.pexels.com/photos/6680788/pexels-photo-6680788.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"],
    [["pasta", "spaget", "carbonara", "fettucc", "makaron"], "https://images.pexels.com/photos/14930758/pexels-photo-14930758.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"],
    [["pannkoo", "pancake"], "https://images.pexels.com/photos/718739/pexels-photo-718739.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"],
    [["shaksh", "munapuder", "omlett"], "https://images.pexels.com/photos/6275112/pexels-photo-6275112.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"],
    [["poke", "buddha", "kauss"], "https://images.pexels.com/photos/15913453/pexels-photo-15913453.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"],
    [["šokolaad", "chocolate", "brownie", "kook", "koogi"], "https://images.pexels.com/photos/3740193/pexels-photo-3740193.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"],
    [["ramen", "nuudel", "noodle", "supp"], "https://images.pexels.com/photos/31393431/pexels-photo-31393431.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"],
    [["taco", "tortilla", "burrito", "quesadilla"], "https://images.pexels.com/photos/8448325/pexels-photo-8448325.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"],
  ];
  for (const [keys, url] of MAP) {
    if (keys.some((k) => t.includes(k))) return url;
  }
  return null;
}

/** Kerib lahti mudeli ümbrikobjektid ja normaliseerib alternatiivsed väljanimed. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrapRecipe(raw: any): any {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalize = (o: any) => {
    if (!o.name && typeof o.title === "string") o.name = o.title;
    if (!Array.isArray(o.ingredients)) {
      o.ingredients = o.koostisosad ?? o.items ?? (Array.isArray(o.ingredients) ? o.ingredients : []);
    }
    if (!Array.isArray(o.instructions)) {
      o.instructions = o.steps ?? o.directions ?? o.juhised ?? o.valmistamine ?? [];
    }
    return o;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const looksLikeRecipe = (o: any) =>
    o &&
    typeof o === "object" &&
    !Array.isArray(o) &&
    (typeof o.name === "string" || typeof o.title === "string") &&
    (Array.isArray(o.ingredients) || Array.isArray(o.koostisosad) || Array.isArray(o.items));

  if (looksLikeRecipe(raw)) return normalize(raw);

  // Üks sügavus tase alla: {"retsept": {...}} või {"data": {"recipe": {...}}}
  for (const v of Object.values(raw)) {
    if (looksLikeRecipe(v)) return normalize(v);
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const v2 of Object.values(v as Record<string, unknown>)) {
        if (looksLikeRecipe(v2)) return normalize(v2);
      }
    }
  }
  return normalize(raw);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseGeneratedRecipe(content: string): any {
  let text = content.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new AiError("AI ei tagastanud kehtivat JSON-it.");
  try {
    const parsed = unwrapRecipe(JSON.parse(text.slice(start, end + 1)));
    if (!parsed?.name || !Array.isArray(parsed?.ingredients) || !Array.isArray(parsed?.instructions)) {
      throw new AiError("AI vastus puudus nõutavaid välju.");
    }
    if (parsed.ingredients.length === 0 || parsed.instructions.length === 0) {
      throw new AiError("AI vastus oli tühi — proovi uuesti või vaheta seadetest mudelit.");
    }
    return parsed;
  } catch (e) {
    if (e instanceof AiError) throw e;
    throw new AiError("AI JSON-vastuse parsimine ebaõnnestus.");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generatedToRecipe(parsed: any, seedText: string): Recipe {
  const num = (v: unknown): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null;

  const ingredients: Ingredient[] = (parsed.ingredients as unknown[])
    .map((raw): Ingredient | null => {
      // Koostisosa võib tulla ka sõnena: "250 g hakkliha"
      if (typeof raw === "string") {
        const s = raw.trim();
        return s ? { raw: s } : null;
      }
      if (!raw || typeof raw !== "object") return null;
      const o = raw as { name?: unknown; amount?: unknown; unit?: unknown };
      const name = typeof o.name === "string" ? o.name.trim() : "";
      if (!name) return null;
      const amount = num(o.amount);
      const unit = typeof o.unit === "string" ? o.unit.trim() : "";
      const display = amount !== null
        ? `${formatAmount(amount)}${unit ? " " + unit : ""} ${name}`
        : name;
      return {
        raw: display.trim(),
        name,
        amount: amount ?? undefined,
        unit: unit || undefined,
      };
    })
    .filter((i): i is Ingredient => i !== null);

  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.filter((t: unknown): t is string => typeof t === "string")
    : [];

  return {
    id: `ai-${Date.now()}`,
    name: String(parsed.name),
    description: typeof parsed.description === "string" ? parsed.description : "",
    image: pickImage(`${parsed.name} ${tags.join(" ")} ${seedText}`),
    totalMinutes: num(parsed.totalMinutes),
    prepMinutes: num(parsed.prepMinutes),
    servings: num(parsed.servings) ?? 4,
    difficulty: typeof parsed.difficulty === "string" ? parsed.difficulty : null,
    cuisine: typeof parsed.cuisine === "string" ? parsed.cuisine : null,
    tags,
    calories: num(parsed.calories),
    protein: num(parsed.protein),
    carbs: num(parsed.carbs),
    fat: num(parsed.fat),
    ingredients,
    instructions: (parsed.instructions as unknown[]).filter(
      (s): s is string => typeof s === "string" && s.trim().length > 0,
    ),
    source: "ai",
  };
}

/* ------------------------------------------------------------------ */
/* Avalikud AI-funktsioonid                                             */
/* ------------------------------------------------------------------ */

/** Genereerib retsepti LLM-iga (kaks pääsu: koostus + eesti keele korrektuur). */
export async function generateRecipe(opts: GenerateOptions): Promise<Recipe> {
  const content = await chatComplete({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(opts),
    maxTokens: 4096,
    json: true,
  });
  let parsed = parseGeneratedRecipe(content);

  // 2. pääs: keelekorrektor lihvib eesti keele (vigade sõnade vastane kindlustus)
  try {
    const polishSource = {
      name: parsed.name,
      description: parsed.description,
      cuisine: parsed.cuisine,
      tags: parsed.tags,
      ingredients: parsed.ingredients,
      instructions: parsed.instructions,
    };
    const polished = await chatComplete({
      system: PROOFREAD_PROMPT,
      user: JSON.stringify(polishSource),
      maxTokens: 3000,
      temperature: 0.2,
      json: true,
    });
    const fixed = parseGeneratedRecipe(polished);
    parsed = { ...parsed, ...fixed };
  } catch {
    /* korrektuur ebaõnnestus — jätame esimese versiooni */
  }

  return generatedToRecipe(parsed, opts.dish);
}

/** Transkribeerib video-/audiofaili Groq Whisperiga (kuni 25 MB). */
export async function transcribeWithWhisper(file: File): Promise<string> {
  const { aiKey, aiProvider } = getAppState();
  const cfg = AI_PROVIDERS[aiProvider];
  if (!aiKey) throw new AiError("AI võti pole seadistatud — ava seaded ja lisa tasuta Groq võti.");
  if (!cfg.whisperModel) {
    throw new AiError(
      "Videofaili transkriptsioon töötab Groq pakkujaga — OpenRouter ei toeta audiot. Vaheta pakkuja seadetest.",
    );
  }

  const fd = new FormData();
  fd.append("file", file, file.name || "video.mp4");
  fd.append("model", cfg.whisperModel);
  fd.append("response_format", "json");

  let res: Response;
  try {
    res = await fetch(`${cfg.baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${aiKey}` },
      body: fd,
    });
  } catch {
    throw new AiError("Brauser ei saanud Whisper-API-ga ühendust (võrk või CORS).");
  }

  if (!res.ok) {
    let msg = `Whisper API vastas veaga ${res.status}.`;
    try {
      const body = await res.json();
      if (body?.error?.message) msg = body.error.message;
    } catch {
      /* ignore */
    }
    throw new AiError(msg);
  }

  const json = await res.json();
  const text = typeof json?.text === "string" ? json.text.trim() : "";
  if (text.length < 10) {
    throw new AiError("Video helist ei õnnestunud arusaadavat kõnet eraldada — proovi rääkimist sisaldava videoga.");
  }
  return text;
}

/* ------------------------------------------------------------------ */
/* Mudelite live-nimekiri                                               */
/* ------------------------------------------------------------------ */

const GROQ_NON_CHAT = /whisper|tts|guard|distil|playai|prompt-guard|safeguard/i;

/** Tõmbab pakkujalt kättesaadavate chat-mudelite ID-de nimekirja. */
export async function listModels(provider: AiProvider, key: string): Promise<string[]> {
  const cfg = AI_PROVIDERS[provider];
  let res: Response;
  try {
    res = await fetch(`${cfg.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${key}` },
    });
  } catch {
    throw new AiError("Brauser ei saanud API-ga ühendust (võrk või CORS).");
  }
  if (!res.ok) throw new AiError(`${cfg.name} vastas veaga ${res.status}.`);

  const json = await res.json();
  const data: unknown[] = Array.isArray(json?.data) ? json.data : [];

  if (provider === "groq") {
    return data
      .map((m) => (m as { id?: string }).id)
      .filter((id): id is string => typeof id === "string" && !GROQ_NON_CHAT.test(id))
      .sort();
  }

  // OpenRouter: filtreeri tasuta mudelid (pricing 0/0) või :free järelliitega
  const free = data
    .map((m) => {
      const mod = m as { id?: string; pricing?: { prompt?: string; completion?: string } };
      const id = mod.id;
      if (!id) return null;
      const isFree =
        id.endsWith(":free") ||
        (mod.pricing?.prompt === "0" && mod.pricing?.completion === "0");
      return isFree ? id : null;
    })
    .filter((id): id is string => typeof id === "string")
    .sort();
  return free.slice(0, 60);
}

/* ------------------------------------------------------------------ */
/* ET -> EN otsingutõlge (recipeapi.io on ingliskeelne!)              */
/* ------------------------------------------------------------------ */

const FOOD_DICT: Array<[RegExp, string]> = [
  [/\bpelmeen\w*/gi, "pelmeni dumplings"],
  [/\bpannkoo\w*/gi, "pancakes"],
  [/\bsalat\w*/gi, "salad"],
  [/\bsup\w*/gi, "soup"],
  [/\bkana(liha)?\w*/gi, "chicken"],
  [/\bsealih\w*/gi, "pork"],
  [/\b(loomaliha|veiselih\w*)/gi, "beef"],
  [/\bkala(liha)?\b\w*/gi, "fish"],
  [/\blõhe\w*/gi, "salmon"],
  [/\bforell\w*/gi, "trout"],
  [/\bkrevet\w*/gi, "shrimp"],
  [/\bkoo(gi)?\w*/gi, "cake"],
  [/\bšokolaad\w*/gi, "chocolate"],
  [/\bmagustoi\w*/gi, "dessert"],
  [/\bmagusa?\b/gi, "dessert"],
  [/\bhommikusö\w*/gi, "breakfast"],
  [/\bõhtusö\w*/gi, "dinner"],
  [/\blõuna(söök)?\w*/gi, "lunch"],
  [/\bnuudl\w*/gi, "noodles"],
  [/\briis\w*/gi, "rice"],
  [/\bkartul\w*/gi, "potato"],
  [/\bseen\w*/gi, "mushroom"],
  [/\bpitsa\w*/gi, "pizza"],
  [/\btako\w*/gi, "tacos"],
  [/\bvõileib\w*|võileiva\w*/gi, "sandwich"],
  [/\bleib\w*/gi, "bread"],
  [/\bpiruk\w*/gi, "pie"],
  [/\bsmuuti\w*/gi, "smoothie"],
  [/\bkarri\w*/gi, "curry"],
  [/\bwok\w*/gi, "stir fry"],
  [/\btomat\w*/gi, "tomato"],
  [/\bjuust\w*/gi, "cheese"],
];

/**
 * Tõlgib eestikeelse roapäringu ingliskeelseteks otsingusõnadeks.
 * Kui AI võti on olemas, kasutab LLM-i; muidu sisseehitatud sõnaraamatut.
 */
export async function toEnglishQuery(query: string): Promise<string> {
  const q = query.trim();
  if (!q) return q;

  const { aiKey } = getAppState();
  if (aiKey) {
    try {
      const out = await chatComplete({
        system:
          "You convert food/dish search phrases into concise English recipe-search keywords. Reply with ONLY 1-4 lowercase English keywords — no punctuation, no quotes, no explanations.",
        user: q,
        maxTokens: 40,
        temperature: 0,
      });
      const cleaned = out.replace(/["'*.]/g, "").replace(/\s+/g, " ").trim();
      if (cleaned.length > 1 && cleaned.length < 80) return cleaned;
    } catch {
      /* jätkame sõnaraamatuga */
    }
  }

  let out = ` ${q.toLowerCase()} `;
  for (const [re, en] of FOOD_DICT) out = out.replace(re, ` ${en} `);
  out = out.replace(/\s+/g, " ").trim();
  return out || q;
}

/** Testib AI võtme kehtivust vastava pakkujaga. */
export async function testAiCredentials(
  provider: AiProvider,
  key: string,
): Promise<{ ok: boolean; message: string }> {
  const cfg = AI_PROVIDERS[provider];
  try {
    const res = await fetch(`${cfg.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (res.ok) return { ok: true, message: `${cfg.name} võti töötab.` };
    return { ok: false, message: `${cfg.name} vastas veaga ${res.status} — kontrolli võtit.` };
  } catch {
    return { ok: false, message: "Brauser ei saanud API-ga ühendust (võrk või CORS)." };
  }
}

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  ListPlus,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  setApiKey,
  setApiMode,
  setAiCredentials,
  setAiModel,
  useAppState,
  type AiProvider,
} from "../lib/store";
import { AI_PROVIDERS, listModels, testAiCredentials } from "../lib/ai";

type TestState = "idle" | "testing" | "ok" | "fail";

function StatusLine({ test, msg }: { test: TestState; msg: string }) {
  if (test === "idle") return null;
  return (
    <p
      className={`mt-3 flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold ${
        test === "ok"
          ? "bg-leaf/10 text-leaf"
          : test === "fail"
            ? "bg-flame/10 text-flame"
            : "bg-gold/15 text-ink/70"
      }`}
    >
      {test === "testing" && <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />}
      {test === "ok" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
      {test === "fail" && <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />}
      {test === "testing" ? "Testin ühendust…" : msg}
    </p>
  );
}

function KeyInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <>
      <label className="mt-4 block text-[11px] font-bold uppercase tracking-wider text-smoke">
        {label}
      </label>
      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-ink/12 bg-white px-4 py-3 focus-within:border-flame">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent font-mono text-sm placeholder:text-smoke/40 focus:outline-none"
        />
        <button
          onClick={() => setShow(!show)}
          aria-label={show ? "Peida võti" : "Näita võtit"}
          className="text-smoke hover:text-ink"
        >
          {show ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
        </button>
      </div>
    </>
  );
}

export default function ApiKeyModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { apiKey, aiKey, aiProvider, aiModel, mode, modeMessage } = useAppState();
  const [recipeValue, setRecipeValue] = useState("");
  const [recipeTest, setRecipeTest] = useState<TestState>("idle");
  const [recipeMsg, setRecipeMsg] = useState("");

  const [provider, setProvider] = useState<AiProvider>(aiProvider);
  const [aiValue, setAiValue] = useState("");
  const [aiTest, setAiTest] = useState<TestState>("idle");
  const [aiMsg, setAiMsg] = useState("");

  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsMsg, setModelsMsg] = useState<string | null>(null);
  const [customMode, setCustomMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRecipeValue(apiKey ?? "");
      setAiValue(aiKey ?? "");
      setProvider(aiProvider);
      setRecipeTest("idle");
      setAiTest("idle");
      setModels([]);
      setModelsMsg(null);
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, apiKey, aiKey, aiProvider, onClose]);

  const cfg = AI_PROVIDERS[provider];

  /** Tõmbab pakkujalt saadaolevad chat-mudelid ja salvestab esimese kui pole veel valitud. */
  const refreshModels = async (key: string, silent = false) => {
    if (!key) {
      setModelsMsg("Sisesta kõigepealt võti, siis tõmba nimekiri.");
      return;
    }
    setModelsLoading(true);
    setModelsMsg(null);
    try {
      const list = await listModels(provider, key);
      setModels(list);
      setCustomMode(false);
      if (list.length === 0) {
        setModelsMsg("Chat-mudeleid ei leitud — kontrolli pakkuja/võtit.");
      } else {
        const current = aiModel;
        if (!current || !list.includes(current)) {
          setAiModel(list[0]);
        }
        setModelsMsg(`${list.length} mudelit — vali sobiv rippmenüüst.`);
      }
    } catch (e) {
      if (!silent) setModelsMsg(e instanceof Error ? e.message : "Nimekirja laadimine ebaõnnestus.");
    } finally {
      setModelsLoading(false);
    }
  };

  /* ------------- recipeapi.io võti ------------- */
  const saveRecipeKey = async () => {
    const clean = recipeValue.trim();
    if (!clean) {
      setRecipeTest("fail");
      setRecipeMsg("Sisesta kõigepealt API võti.");
      return;
    }
    setRecipeTest("testing");
    try {
      const res = await fetch("https://recipeapi.io/api/v1/recipes?per_page=1", {
        headers: { Accept: "application/json", Authorization: `Bearer ${clean}` },
      });
      if (!res.ok) {
        setRecipeTest("fail");
        setRecipeMsg(`API vastas veaga ${res.status} — kontrolli võtit.`);
        return;
      }
    } catch {
      setRecipeTest("fail");
      setRecipeMsg("Brauser ei saanud API-ga ühendust (võrk või CORS).");
      return;
    }
    setApiKey(clean);
    setApiMode("live");
    setRecipeTest("ok");
    setRecipeMsg("Võti salvestatud ja töötab — retseptid tulevad nüüd päris-APIst.");
  };

  /* ------------- AI-generaatori võti ------------- */
  const saveAiKey = async () => {
    const clean = aiValue.trim();
    if (!clean) {
      setAiTest("fail");
      setAiMsg("Sisesta kõigepealt võti.");
      return;
    }
    setAiTest("testing");
    const res = await testAiCredentials(provider, clean);
    setAiTest(res.ok ? "ok" : "fail");
    setAiMsg(res.message);
    if (res.ok) {
      setAiCredentials(clean, provider);
      // kohe ka mudelinimekiri, et kasutaja saaks kohe töötava valida
      await refreshModels(clean, true);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/60 px-5 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-[26px] bg-paper shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-ink/8 px-7 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-flame/10 text-flame">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-xl font-black">API seaded</h3>
              <p className="text-[12px] font-semibold text-smoke">
                Võtmed salvestuvad ainult sinu brauserisse
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Sule"
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-7 py-5">
          {/* ===== 1. Retseptiandmed ===== */}
          <section>
            <h4 className="font-display text-lg font-black">
              1. Retseptiandmed <span className="text-smoke font-sans text-sm font-semibold">(recipeapi.io)</span>
            </h4>
            <p className="mt-1.5 text-sm leading-relaxed text-smoke">
              50 000+ retsepti ja toitumisinfo. Loo tasuta konto aadressil{" "}
              <a
                href="https://recipeapi.io/register"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-flame underline decoration-flame/40 underline-offset-2"
              >
                recipeapi.io
                <ExternalLink className="ml-1 inline h-3.5 w-3.5 -mt-0.5" />
              </a>{" "}
              ja genereeri <code className="rounded bg-cream px-1 py-0.5 font-mono text-[12px]">sk_live_</code> võti.
              Otsingud tõlgitakse automaatselt inglise keelde.
            </p>
            <KeyInput
              label="recipeapi.io võti"
              value={recipeValue}
              onChange={(v) => {
                setRecipeValue(v);
                setRecipeTest("idle");
              }}
              placeholder="sk_live_…"
            />
            <StatusLine test={recipeTest} msg={recipeMsg} />
            {mode === "auth-error" && modeMessage && recipeTest === "idle" && (
              <p className="mt-3 rounded-xl bg-flame/10 px-3.5 py-2.5 text-[13px] font-semibold text-flame">
                {modeMessage}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                onClick={saveRecipeKey}
                disabled={recipeTest === "testing"}
                className="inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-2.5 text-sm font-bold text-paper transition-colors hover:bg-flame disabled:opacity-50"
              >
                <ShieldCheck className="h-4.5 w-4.5" />
                Testi ja salvesta
              </button>
              {apiKey && (
                <button
                  onClick={() => {
                    setApiKey(null);
                    setRecipeValue("");
                    setRecipeTest("idle");
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-ink/12 px-4 py-2.5 text-sm font-bold text-smoke hover:border-flame hover:text-flame"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                  Eemalda
                </button>
              )}
            </div>
          </section>

          <hr className="my-7 border-ink/8" />

          {/* ===== 2. AI-generaator ===== */}
          <section>
            <h4 className="flex items-center gap-2 font-display text-lg font-black">
              <Sparkles className="h-5 w-5 text-gold" />
              2. AI-retseptigeneraator <span className="text-smoke font-sans text-sm font-semibold">(tasuta)</span>
            </h4>
            <p className="mt-1.5 text-sm leading-relaxed text-smoke">
              Koostab retsepte LLM-iga ja teeb <strong>videofailidest</strong> Whisper-transkriptsiooni
              (kuni 25 MB). Mõlemad pakkujad on tasuta.
            </p>

            <label className="mt-4 block text-[11px] font-bold uppercase tracking-wider text-smoke">
              Pakkuja
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(Object.keys(AI_PROVIDERS) as AiProvider[]).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setProvider(p);
                    setAiTest("idle");
                    setModels([]);
                    setModelsMsg(null);
                    setCustomMode(false);
                  }}
                  className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                    provider === p
                      ? "border-flame bg-flame/5 shadow-sm"
                      : "border-ink/12 bg-white hover:border-ink/25"
                  }`}
                >
                  <span className="block text-sm font-black">{AI_PROVIDERS[p].name}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-smoke">
                    {AI_PROVIDERS[p].note}
                  </span>
                </button>
              ))}
            </div>

            <KeyInput
              label={`${cfg.name} API võti`}
              value={aiValue}
              onChange={(v) => {
                setAiValue(v);
                setAiTest("idle");
              }}
              placeholder={`${cfg.keyPrefix}…`}
            />
            <a
              href={cfg.keyUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-flame underline decoration-flame/40 underline-offset-2"
            >
              Hangi tasuta võti — {cfg.keyUrl.replace("https://", "")}
              <ExternalLink className="h-3 w-3" />
            </a>
            <StatusLine test={aiTest} msg={aiMsg} />

            {/* mudeli valik */}
            <div className="mt-4 rounded-2xl border border-ink/10 bg-white/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-smoke">
                  Mudel
                </label>
                <button
                  onClick={() => refreshModels(aiValue.trim() || aiKey || "")}
                  disabled={modelsLoading}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 px-3 py-1.5 text-[11px] font-bold text-smoke transition-colors hover:border-flame hover:text-ink disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${modelsLoading ? "animate-spin" : ""}`} />
                  Tõmba mudelite nimekiri
                </button>
              </div>
              {models.length > 0 && !customMode ? (
                <select
                  value={aiModel && models.includes(aiModel) ? aiModel : models[0]}
                  onChange={(e) => {
                    if (e.target.value === "__custom") {
                      setCustomMode(true);
                      setAiModel("");
                    } else {
                      setAiModel(e.target.value);
                    }
                  }}
                  className="mt-2 w-full cursor-pointer rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 font-mono text-[13px] focus:border-flame focus:outline-none"
                >
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  <option value="__custom">→ Kirjutan mudeli ID käsitsi…</option>
                </select>
              ) : (
                <input
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  placeholder={cfg.chatModel}
                  className="mt-2 w-full rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 font-mono text-[13px] focus:border-flame focus:outline-none"
                />
              )}
              {customMode && models.length > 0 && (
                <button
                  onClick={() => setCustomMode(false)}
                  className="mt-2 text-[11px] font-bold text-flame underline decoration-flame/40 underline-offset-2"
                >
                  ← Tagasi nimekirja juurde
                </button>
              )}
              <p className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-smoke">
                <ListPlus className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {modelsMsg ?? `Vaikimisi: ${cfg.chatModel}. Kui mudel on aegunud, tõmba nimekiri ja vali uus — nii ei pea lehte uuesti ehitama.`}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                onClick={saveAiKey}
                disabled={aiTest === "testing"}
                className="inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-2.5 text-sm font-bold text-paper transition-colors hover:bg-flame disabled:opacity-50"
              >
                <ShieldCheck className="h-4.5 w-4.5" />
                Testi ja salvesta
              </button>
              {aiKey && (
                <button
                  onClick={() => {
                    setAiCredentials(null, undefined, "");
                    setAiValue("");
                    setAiTest("idle");
                    setModels([]);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-ink/12 px-4 py-2.5 text-sm font-bold text-smoke hover:border-flame hover:text-flame"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                  Eemalda
                </button>
              )}
            </div>
          </section>

          <p className="mt-7 rounded-xl bg-cream/70 px-3.5 py-2.5 text-[12px] leading-relaxed text-smoke">
            Võtmed ei lähe kuhugile peale vastavate API-de — need salvestuvad sinu brauseri
            localStorage'isse. GitHubi repos ei tohi kunagi võtmeid hoida.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

# KokkuGuru — Video sisse, retsept välja

**KokkuGuru** on eestikeelne kokaraamat-teenetööriist: sotsiaalmeedia toiduvideo
(Facebook, TikTok, Instagram, YouTube, Pinterest, Rednote) → selge, samm-sammuline retsept.

- **Whisper (Groq)** transkribeerib video heli (suvalises keeles)
- **3-AI toru**: retsepti generaator → eestikeelne tõlge ja keeletoimetus → ilus retsept
- **recipeapi.io** andmebaas + tasuta AI (Groq / OpenRouter) — demo-režiim toimib ka võtmeta
- **Südamega salvestamine**: salvestatud retseptid (sh AI retseptid) jäävad alles ja ilmuvad „Salvestatud" vaates
- **Cobalt on eemaldatud** — seda pole enam kusagil

---

## 🚀 Deploy — GitHub Pages (nii nagu varem töötas)

Repo kaasas on `.github/workflows/deploy.yml` — **Deploy to GitHub Pages**.
Iga `push` main harusse ehitab staatilise lehe ja deployse.

```bash
npm ci
npm run build:pages   # → ./dist/index.html (üks fail, kõik inline)
```

GitHubis: **Settings → Pages → Source: GitHub Actions** — ja asi töötab.

---

## ⚠️ Üks aus piirang (Facebooki automaat-heli)

GitHub Pages on **puhas staatiline host** — seal pole serverit.

**Facebooki link → automaatne heli-tuvastus → retsept** (taustal `fdownload.app` + Whisper)
vajab väikest serverovahendust (`/api/facebook/audio`). Staatilise buildi peale rakendus
tuvastab automaatse hosti ja suunab kuidasi järgmiste võimalustega, mis **täielikult
kliendipoolsed ja töötavad GitHub Pagesil**:

| Võimalus | Töötab GitHub Pagesil? | Kuidas |
|---|---|---|
| **Videofail** (laed video alla ja tood siia) | ✅ Täielikult | Fail → Whisper → retsept (brauserist otse Groq) |
| **Roa nimi / video kirjeldus** | ✅ Täielikult | Kleebi kirjeldus → AI teeb retsepti |
| **FB linki automaat-helivoo** | ✅ Töötab vaid serveriga versioonis | `npm run dev` / Node-host (selle repo Next-variant) |

Kiire tee seegi nii: ava [fdownload.app](https://fdownload.app/en1/facebook-to-mp3) →
paste'ede FB link → lae MP3 → tõsta fail „Videofail" vahelehele.
Whisper ja retsepti teeb KokkuGuru ise — otse brauseris, võtit välja ei lähe.

---

## 📁 Projektistruktuur

```
.github/workflows/deploy.yml   ← GitHub Pages (staatiline) — sinu originaal-workflow
index.html                     ← Vite entry (GitHub Pages)
vite.config.ts                 ← Vite: SPA ühe failiga → ./dist
src/
  main.tsx                     ← SPA entry (kokkuguru mount)
  kokkuguru/                   ← sinu ORIGINAAL rakendus (teema, 3-AI, komponendid)
    components/…
    hooks/useConverter.ts
    lib/ai.ts / api.ts / download.ts / store.ts / demoRecipes.ts
  app/                         ← Next.js versioon (serveriga heli-api FB linkidele)
    api/facebook/audio/…
  lib/fdownload.ts             ← serveripoolne fdownload.app klient
```

SKRIPTID:
- `npm run dev` — Next.js arendusserver (FB heli-API töötab)
- `npm run build` — Next.js produktsioon (Node-host)
- `npm run build:pages` — **GitHub Pages staatiline build** (näiteks sinu workflow)
- `npm run preview:pages` — testi staatilist buildi lokaalselt

---

## 🔧 API-võtmed (valikulised, brauseri seadetes)

Avad äppi hammasratta: Groq-võti (`gsk_…`) AI retseptide ja Whisperi jaoks;
OpenRouter alternatiiv; recipeapi.io võti elavateks otsinguteks.
Võtmed jäävad sinu brauseri localStorage'i — kuhugi serverisse ei lähe.

---

## 🙏 Õigused

Laadi alla vaid sisu, milleks sul on õigus (oma loomind või autori luba).
KokkuGuru ei ole seotud Facebooki, Meta, Groq ega fdownload.app'iga.

**KokkuGuru — video sisse, retsept välja.**

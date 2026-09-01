# KokkuGuru — millised failid oma GitHubi reposse uuendada

See on täpne loend parandatud/fresh failidest, mis sinu `saarsalu/kokkuguru`
repositooriumisse üle peaksid kandma. **Ära copy-paste`i kogu projekti alla —**
kui tahad püsida Vite+GitHub Pages eel, siis **vähemalt järgnevad failid** on
võib-olla minevikku muutuma pidanud.

---

## 1. Esimene valik — terviklik Next.js üleviimine (soovitan)

Kui teeme lihtsalt parandatud **koopiad** sisu oma reposse:

```
README.md                        ← uus deploy-juhend
KOKKUGURU_UPDATE.md              ← kokkuvõte ja targetid
KOKKUGURU_GIT_FILES.md           ← see fail (file list)
next.config.ts                   ← Next.js seadistus
eslint.config.mjs                ← eslint seadistus
tsconfig.json                    ← TS seadistus
postcss.config.mjs               ← Tailwind impordi plug-in
drizzle.config.json              ← drizzle seadistus (ostab tervisekontrolli)
package.json                     ← Next.js + sõltuvused (framer-motion, ws)
package-lock.json                ← lukustatud versioonid
src/app/layout.tsx               ← root layout (teema font, meta)
src/app/page.tsx                 ← juurleht
src/app/kokkuguru-app.tsx        ← kliendi poolne ssupruss
src/app/globals.css              ← teema + teravilja-tekstuur
src/app/api/health/route.ts      ← tervisekontroll
src/app/api/facebook/audio/route.ts   ← FB heli → MP3 baidid
src/app/api/facebook/search/route.ts  ← metaandmed
src/app/api/facebook/convert/route.ts ← tulemuslink (valikuline)
src/db/index.ts                  ← DB klient (tervisekontroll)
src/db/schema.ts                 ← schema
src/lib/fdownload.ts             ← serveripoolne fdownload klient
src/kokkuguru/                   ← terve ORIGINAAL rakendus + parandused
   App.tsx
   index.css
   components/…
   hooks/useConverter.ts
   lib/ai.ts
   lib/download.ts
   lib/store.ts
   lib/api.ts
   lib/demoRecipes.ts
   utils/cn.ts
```

**Oluline:** GitHubi staatilise Pages-i jaoks ei saa API kätte. Kui soovid jääda
GitHub Pages-ile, peab olema serverless taga (Vercel) ja suunata päring sinna —
lisa seejärel API-URL keskkonnamuutujana.

---

## 2. Teine valik — ainult parandatud kokku-failid (Vite/Facebook-heli ei tööta)

Kui tahad säilitada oma **Vite + GitHub Pages** buildi, laadi ainult need kohalikud:

```
src/kokkuguru/lib/store.ts
src/kokkuguru/lib/download.ts          ← cobalt eemaldatud, sisseehitatud FB heli
src/kokkuguru/hooks/useConverter.ts    ← automaatharu FB linkidel
src/kokkuguru/components/Converter.tsx        ← südame-nupp, OK-teksdid
src/kokkuguru/components/RecipeExplorer.tsx   ← „Salvestatud" kuvab savedRecipes
src/kokkuguru/components/RecipeModal.tsx      ← süda:täisretseptiga
src/kokkuguru/components/ApiKeyModal.tsx      ← cobalt jaotis eemaldatud
.src/kokkuguru/lib/ai.ts               ← tuleb ringima jääda (muudatusi pole)
```

⚠️ **Olgem ausad:** sellel teel ei saa Facebooki otselinker auto-helitöötlemist
serverisse tõmmata (staatiline host ei saa POST /api). KokkuGuru töötab, aga
füüsilise video enda allalaadimine käib käsitsi (Videofaili vaheleht), või pead
serverless helitoru ise hostima (Vercel/Cloudflare Worker) ja suunama päring sinna.

---

## 3. Sammud oma GitHubi (Variant A — Vercel)

1. Klooni oma repo:
   ```bash
   git clone git@github.com:saarsalu/kokkuguru.git
   cd kokkuguru
   ```
2. Asenda kogu sisu parandatud ZIP sisuga (välti kadunud `.env` ja `.git`).
3. **Kui su repos on veel `.github/workflows/deploy.yml` (GitHub Pages)** — **kustuta see**.
4. Kopeeri uus `vercel-deploy.yml` (see fail meie ZIP-is `.github/workflows/` alati).
5. Push:
   ```bash
   git add -A
   git commit -m "KokkuGuru: FB-heli → retsept, cobalt eemaldatud, südamenüü täisretseptidega"
   git push origin main
   ```
6. Vercelisse ühenda (Add New → Project → GitHub → `saarsalu/kokkuguru`).
7. GitHubi → Settings → Secrets and variables → Actions:
   - `VERCEL_TOKEN` — https://vercel.com/account/tokens
   - `VERCEL_ORG_ID` — `vercel whoami` või Project Settings
   - `VERCEL_PROJECT_ID` — Project Settings → General
8. Seejärel iga push buildib Next.js-i ja ajab `vercel deploy --prod` automaatilt.

---

## 4. Sammud oma GitHubi (Variant B — Netlify)

Netlify kasutab sama `package.json` buildi, aga serverless tuleb Netlify Functions
kaasata Netlify SDK-ga. Lihtsaim on Vercel.

---

## 5. Eemalda / asenda — checklist oma repos

- [ ] Eemalda `.github/workflows/deploy.yml` (GitHub Pages staatiline).
- [ ] Lisa `.github/workflows/vercel-deploy.yml` (see fail).
- [ ] Uute `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`.
- [ ] Uute `package.json` ja `package-lock.json` (vastavad mustandkodiflus).
- [ ] Kogu parandatud `src/` käsureaidi.
- [ ] Kontrolli, et **ei olnuks enam sõna cobalt** GitHubis (`grep -r cobalt src/` peaks
      andma "ein Resultat").
- [ ] Salvestatud süda — testi: klõpsa südant, mine „Salvestatud", sulge ja laadi uuesti.

---

Kui midagi hakkab tegema — pane tagasi: kirjelda, kus jääd, ja aitan lähemalt.

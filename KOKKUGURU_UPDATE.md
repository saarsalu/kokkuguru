# KokkuGuru — paranduste kokkuvõte

## Mis muutus

### ✅ „Salvestatud" (süda) töötab õigesti
- Varem salvestati ainult ID → „Salvestatud" vaatet ei leidnud retsepte (eriti AI-retsepte).
- Nüüd salvestatakse **täis retsept** brauseri localStorage'i ja „Salvestatud" vaade
  kuvab neid otse — ka konverteri genereeritud AI-retseptid (süda lisatud ka tulemuste vaatesse).

### ✅ Cobalt eemaldatud täielikult
- Seadetest on kadunud „3. Video auto-tõmme (cobalt)" jaotis.
- Koodi pole enam ühtegi cobalt-viidet.

### ✅ Facebooki heli toru (serveriga versioonis)
- FB/fb.watch link → heliriba (fdownload.app kaudu) → Groq Whisper → retsept.
- **GitHub Pages (staatiline):** serverivahendit pole, seega annab rakendus teada ja suunab
  kasutaja „Videofaili" või kirjelduse vooguga — need töötavad täielikult ka ilma serverita.

## Deploy
`./.github/workflows/deploy.yml` → GitHub Pages (`npm run build:pages` → `./dist`).
See on sama workflow, mis sul varem töötas — build-käsk on nüüd `build:pages`
(sest `npm run build` kuulub serveriga Next.js versioonile).

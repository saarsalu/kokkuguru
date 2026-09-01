import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// GitHub Pages staatiline build — toodab ühe index.html + kõik inline.
// SEDA ei kasuta Next.js (plikk ühendab projekti kahet moodust:
//  - `npm run build:pages` → Vite SPA → ./dist (GitHub Pages)
//  - `npm run build`        → Next.js → server + API marsruudid (kohalik/Node-host)
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    outDir: "dist",
  },
});

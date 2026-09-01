/* ------------------------------------------------------------------ */
/* Sisseehitatud heli-toru                                             */
/* Facebooki/fb.watch video → Next.js API → fdownload.app → MP3 baidid */
/* Whisperi jaoks. Null seadistust, null API-võtit.                    */
/* ------------------------------------------------------------------ */

export class DownloadError extends Error {}

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // Whisperi limiit

/**
 * Helitoru (`/api/facebook/audio`) eksisteerib vaid siis, kui rakendus käib
 * Node-serveriga (selle repo Next-versioon või kohalik `npm run dev`).
 * Staatilisel hostil (GitHub Pages) serverit pole — sealt jäta automaatharu
 * vahele ja suuna kasutaja Videofaili/kirjelduse vooluga edasi.
 */
export function audioApiAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  // Staatilised hostid, kus meie serverovahendust kindlasti pole
  return !(
    host.endsWith(".github.io") ||
    host.endsWith(".pages.dev") ||
    host.endsWith(".netlify.app")
  );
}

/** Kas link on Facebooki / fb.watch link — nendega töötab sisseehitatud heli-toru. */
export function isFacebookUrl(urlStr: string): boolean {
  try {
    const withProto = /^https?:\/\//i.test(urlStr) ? urlStr : `https://${urlStr}`;
    const host = new URL(withProto).hostname.toLowerCase();
    return (
      host === "facebook.com" ||
      host.endsWith(".facebook.com") ||
      host === "fb.watch" ||
      host.endsWith(".fb.watch") ||
      host === "fb.com" ||
      host.endsWith(".fb.com")
    );
  } catch {
    return false;
  }
}

/** Facebooki video helirada serveri kaudu (KokkuGuru API → fdownload.app → MP3). */
async function downloadBuiltinAudio(videoUrl: string): Promise<File> {
  let res: Response;
  try {
    res = await fetch("/api/facebook/audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: videoUrl }),
    });
  } catch {
    throw new DownloadError(
      "Helitoruga ei saanud ühendust — kontrolli võrguühendust ja proovi uuesti.",
    );
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new DownloadError(
      body.error ?? `Heliraja tõmbamine ebaõnnestus (HTTP ${res.status}).`,
    );
  }

  const blob = await res.blob();
  if (blob.size < 1000) {
    throw new DownloadError("Helirada on tühi — video võis olla helita või privaatne.");
  }
  if (blob.size > MAX_AUDIO_BYTES) {
    throw new DownloadError(
      `Audio on liiga suur (${(blob.size / 1048576).toFixed(1)} MB) — Whisperi limiit on 25 MB. Vali lühem video.`,
    );
  }

  return new File([blob], "facebook-audio.mp3", { type: blob.type || "audio/mpeg" });
}

/** Laadib video-lingi heliraja alla File'ina — valmis Whisperi jaoks. */
export async function downloadAudioFile(videoUrl: string): Promise<File> {
  // Automaatne heli-tõmme töötab sisseehitatult Facebooki ja fb.watch linkidega —
  // vaid serveriga versioonis (staatilisel hostil helitoru puudub).
  if (isFacebookUrl(videoUrl) && audioApiAvailable()) {
    return downloadBuiltinAudio(videoUrl);
  }
  throw new DownloadError(
    "Automaatne heli-tõmme töötab praegu Facebooki ja fb.watch linkidega — " +
      "teiste platvormide jaoks lae video alla (Videofail) või kleebi video kirjeldus.",
  );
}

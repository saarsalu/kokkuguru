import { FDownloadError, convertFacebookMedia } from "@/lib/fdownload";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // Whisperi limiit

function errorResponse(error: unknown) {
  if (error instanceof FDownloadError) {
    const status =
      error.code === "INVALID_URL"
        ? 400
        : error.code === "NOT_FOUND" || error.code === "NO_AUDIO"
          ? 422
          : error.code === "RATE_LIMITED"
            ? 429
            : error.code === "TIMEOUT"
              ? 504
              : 502;

    return NextResponse.json(
      { ok: false, code: error.code, error: error.message },
      { status },
    );
  }

  console.error("Facebook audio fetch failed", error);
  return NextResponse.json(
    { ok: false, code: "UNKNOWN", error: "Heliraja tõmbamine ebaõnnestus. Proovi uuesti." },
    { status: 500 },
  );
}

/**
 * KokkuGuru heli-toru: Facebooki/fb.watch video → MP3 baidid.
 * Brauser saadab baidid edasi Whisperile — kasutaja ei lae midagi käsitsi alla.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: unknown };
    // 64 kbps — väikseim kvaliteet = kiireim tõmme, Whisperile piisav
    const result = await convertFacebookMedia(body.url, 64);

    let upstream: Response;
    try {
      upstream = await fetch(result.downloadUrl, {
        cache: "no-store",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
        },
        signal: AbortSignal.timeout(120_000),
      });
    } catch {
      throw new FDownloadError("UPSTREAM", "Valmis helifaili alla laadida ei õnnestunud.");
    }

    if (!upstream.ok) {
      throw new FDownloadError(
        "UPSTREAM",
        "Helifaili server ei vastanud ootuspäraselt — proovi uuesti.",
      );
    }

    const buffer = await upstream.arrayBuffer();
    if (buffer.byteLength < 1000) {
      throw new FDownloadError("NO_AUDIO", "Helirada on tühi — video võis olla helita.");
    }
    if (buffer.byteLength > MAX_AUDIO_BYTES) {
      throw new FDownloadError(
        "UPSTREAM",
        `Helirada on liiga suur (${(buffer.byteLength / 1048576).toFixed(1)} MB) — Whisperi limiit on 25 MB. Vali lühem video.`,
      );
    }

    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'inline; filename="facebook-audio.mp3"',
        "Cache-Control": "no-store",
        "X-Audio-Title": encodeURIComponent(result.title),
        ...(result.duration ? { "X-Audio-Duration": result.duration } : {}),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

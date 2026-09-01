import WebSocket from "ws";

const SEARCH_ENDPOINT = "https://fdownload.app/api/ajaxSearch";
const FDOWNLOAD_PAGE = "https://fdownload.app/en1/facebook-to-mp3";
const REQUEST_TIMEOUT_MS = 45_000;
const CONVERSION_TIMEOUT_MS = 4 * 60_000;
const ALLOWED_BITRATES = [64, 128, 192, 256, 320] as const;

export type Bitrate = (typeof ALLOWED_BITRATES)[number];

export type FacebookMedia = {
  title: string;
  duration: string | null;
  thumbnail: string | null;
  videoId: string;
  qualities: Bitrate[];
};

type ConversionMetadata = FacebookMedia & {
  audioUrl: string;
  audioType: string;
  convertEndpoint: string;
  expires: string;
  token: string;
};

type SearchPayload = {
  status?: string;
  data?: string;
  mess?: string;
};

type ConvertPayload = {
  status?: string;
  statusCode?: number;
  result?: string;
  fileSize?: string;
  jobId?: string;
};

type SocketPayload = {
  action?: string;
  value?: number;
  url?: string;
  fileSize?: string;
};

export class FDownloadError extends Error {
  constructor(
    public readonly code:
      | "INVALID_URL"
      | "NOT_FOUND"
      | "NO_AUDIO"
      | "RATE_LIMITED"
      | "UPSTREAM"
      | "TIMEOUT",
    message: string,
  ) {
    super(message);
    this.name = "FDownloadError";
  }
}

function isFacebookHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return (
    host === "facebook.com" ||
    host.endsWith(".facebook.com") ||
    host === "fb.watch" ||
    host.endsWith(".fb.watch") ||
    host === "fb.com" ||
    host.endsWith(".fb.com")
  );
}

export function normalizeFacebookUrl(input: unknown) {
  if (typeof input !== "string") {
    throw new FDownloadError("INVALID_URL", "Sisesta Facebooki video link.");
  }

  const match = input.trim().match(/https?:\/\/[^\s]+/i);
  if (!match) {
    throw new FDownloadError("INVALID_URL", "Sisesta täielik Facebooki video link.");
  }

  try {
    const url = new URL(match[0]);
    if (
      url.protocol !== "https:" ||
      !isFacebookHostname(url.hostname) ||
      url.username ||
      url.password
    ) {
      throw new Error("Unsupported URL");
    }

    url.hash = "";
    return url.toString();
  } catch {
    throw new FDownloadError(
      "INVALID_URL",
      "See ei paista olevat kehtiv Facebooki või fb.watch video link.",
    );
  }
}

export function parseBitrate(input: unknown): Bitrate {
  const bitrate = typeof input === "number" ? input : Number(input);
  if (!ALLOWED_BITRATES.includes(bitrate as Bitrate)) {
    throw new FDownloadError("INVALID_URL", "Vali toetatud helikvaliteet.");
  }
  return bitrate as Bitrate;
}

function decodeHtml(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    nbsp: " ",
  };

  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (entity, key: string) => {
    if (key.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(key.slice(2), 16));
    }
    if (key.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(key.slice(1), 10));
    }
    return named[key.toLowerCase()] ?? entity;
  });
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getInputValue(html: string, id: string) {
  const input = html.match(new RegExp(`<input\\b[^>]*\\bid=["']${escapeRegExp(id)}["'][^>]*>`, "i"))?.[0];
  if (!input) return null;
  return input.match(/\bvalue=["']([^"']*)["']/i)?.[1] ?? null;
}

function getScriptValue(html: string, name: string) {
  return html.match(new RegExp(`\\b${escapeRegExp(name)}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1] ?? null;
}

function isAllowedConvertEndpoint(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      (host === "api.z-cdn.xyz" || host === "vidcdn.app" || host.endsWith(".vidcdn.app"))
    );
  } catch {
    return false;
  }
}

function safeMediaUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(decodeHtml(value));
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

async function readSearchMetadata(sourceUrl: string): Promise<ConversionMetadata> {
  const body = new URLSearchParams({
    p: "mp3",
    q: sourceUrl,
    html: "",
    lang: "en",
    w: "",
  });

  let response: Response;
  try {
    response = await fetch(SEARCH_ENDPOINT, {
      method: "POST",
      body,
      cache: "no-store",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Origin: "https://fdownload.app",
        Referer: FDOWNLOAD_PAGE,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new FDownloadError("TIMEOUT", "Facebooki video otsimine võttis liiga kaua aega.");
    }
    throw new FDownloadError("UPSTREAM", "FDownloadiga ei saadud praegu ühendust.");
  }

  if (response.status === 429) {
    throw new FDownloadError("RATE_LIMITED", "Liiga palju päringuid. Oota hetk ja proovi uuesti.");
  }
  if (!response.ok) {
    throw new FDownloadError("UPSTREAM", "FDownload ei vastanud ootuspäraselt.");
  }

  let payload: SearchPayload;
  try {
    payload = (await response.json()) as SearchPayload;
  } catch {
    throw new FDownloadError("UPSTREAM", "FDownload tagastas vigase vastuse.");
  }

  if (payload.status !== "ok" || typeof payload.data !== "string") {
    const message = payload.mess ? stripTags(payload.mess) : "Videot ei leitud.";
    throw new FDownloadError("NOT_FOUND", message);
  }

  const html = decodeHtml(payload.data);
  const audioUrl = safeMediaUrl(getInputValue(html, "audioUrl"));
  const audioType = getInputValue(html, "audioType") ?? "";
  const videoId = getInputValue(html, "FbId") ?? "";
  const convertEndpoint = decodeHtml(getScriptValue(html, "k_url_convert") ?? "");
  const expires = getScriptValue(html, "k_exp") ?? "";
  const token = getScriptValue(html, "k_token") ?? "";

  const qualityMatches = [...html.matchAll(/data-fquality=["'](64|128|192|256|320)["']/gi)];
  const qualities = [...new Set(qualityMatches.map((match) => Number(match[1]) as Bitrate))].sort(
    (a, b) => b - a,
  );

  if (!audioUrl || !audioType || qualities.length === 0) {
    throw new FDownloadError(
      "NO_AUDIO",
      "Sellel videol ei paista olevat allalaaditavat helirada.",
    );
  }

  if (!videoId || !expires || !token || !isAllowedConvertEndpoint(convertEndpoint)) {
    throw new FDownloadError("UPSTREAM", "FDownloadi vastuse formaat on muutunud.");
  }

  const detail = html.match(/<div class=["']content["'][^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
  const thumbnailMatch = html.match(/<div class=["'][^"']*image-fb[^"']*["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
  const parsedTitle = detail?.[1] ? stripTags(detail[1]) : "";
  const parsedDuration = detail?.[2] ? stripTags(detail[2]) : "";

  return {
    title: parsedTitle && parsedTitle !== "Facebook Video" ? parsedTitle : "Facebooki video",
    duration: parsedDuration || null,
    thumbnail: safeMediaUrl(thumbnailMatch?.[1] ?? null),
    videoId,
    qualities,
    audioUrl,
    audioType: decodeHtml(audioType),
    convertEndpoint,
    expires,
    token,
  };
}

export async function findFacebookMedia(input: unknown): Promise<{ sourceUrl: string; media: FacebookMedia }> {
  const sourceUrl = normalizeFacebookUrl(input);
  const metadata = await readSearchMetadata(sourceUrl);
  const { audioUrl: _audioUrl, audioType: _audioType, convertEndpoint: _convertEndpoint, expires: _expires, token: _token, ...media } = metadata;
  return { sourceUrl, media };
}

function assertDownloadUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") throw new Error("Unsupported protocol");
    return url.toString();
  } catch {
    throw new FDownloadError("UPSTREAM", "Valmis faili link oli vigane.");
  }
}

function waitForConversion(endpoint: string, jobId: string) {
  return new Promise<{ downloadUrl: string; fileSize: string | null }>((resolve, reject) => {
    const endpointUrl = new URL(endpoint);
    const socketProtocol = endpointUrl.protocol === "https:" ? "wss:" : "ws:";
    const socketUrl = `${socketProtocol}//${endpointUrl.host}/sub/${encodeURIComponent(jobId)}?fname=${encodeURIComponent("FDownload.app")}`;
    const socket = new WebSocket(socketUrl, {
      origin: "https://fdownload.app",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
      },
    });

    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback();
      socket.close();
    };

    const timeout = setTimeout(() => {
      finish(() => reject(new FDownloadError("TIMEOUT", "MP3 tegemine võttis liiga kaua aega.")));
    }, CONVERSION_TIMEOUT_MS);

    socket.on("message", (raw) => {
      try {
        const payload = JSON.parse(raw.toString()) as SocketPayload;
        if (payload.action === "success" && payload.url) {
          finish(() =>
            resolve({
              downloadUrl: assertDownloadUrl(payload.url as string),
              fileSize: payload.fileSize ?? null,
            }),
          );
        } else if (payload.action === "error") {
          finish(() => reject(new FDownloadError("UPSTREAM", "FDownload ei suutnud MP3 faili teha.")));
        }
      } catch {
        // Progress and keep-alive messages may not contain final result data.
      }
    });

    socket.on("error", () => {
      finish(() => reject(new FDownloadError("UPSTREAM", "MP3 töötluse ühendus katkes.")));
    });

    socket.on("close", () => {
      if (!settled) {
        finish(() => reject(new FDownloadError("UPSTREAM", "MP3 töötlus katkes enne valmimist.")));
      }
    });
  });
}

export async function convertFacebookMedia(input: unknown, bitrateInput: unknown) {
  const sourceUrl = normalizeFacebookUrl(input);
  const bitrate = parseBitrate(bitrateInput);
  const metadata = await readSearchMetadata(sourceUrl);

  if (!metadata.qualities.includes(bitrate)) {
    throw new FDownloadError("INVALID_URL", "Valitud helikvaliteet pole selle video jaoks saadaval.");
  }

  const body = new URLSearchParams({
    ftype: "mp3",
    v_id: metadata.videoId,
    audioUrl: metadata.audioUrl,
    audioType: metadata.audioType,
    fquality: String(bitrate),
    fname: "FDownload.app",
    exp: metadata.expires,
    token: metadata.token,
  });

  let response: Response;
  try {
    response = await fetch(metadata.convertEndpoint, {
      method: "POST",
      body,
      cache: "no-store",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Origin: "https://fdownload.app",
        Referer: FDOWNLOAD_PAGE,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new FDownloadError("TIMEOUT", "MP3 töötluse alustamine võttis liiga kaua aega.");
    }
    throw new FDownloadError("UPSTREAM", "MP3 töötlust ei saanud käivitada.");
  }

  if (response.status === 429) {
    throw new FDownloadError("RATE_LIMITED", "Liiga palju päringuid. Oota hetk ja proovi uuesti.");
  }
  if (!response.ok) {
    throw new FDownloadError("UPSTREAM", "FDownloadi MP3 töötlus ebaõnnestus.");
  }

  let payload: ConvertPayload;
  try {
    payload = (await response.json()) as ConvertPayload;
  } catch {
    throw new FDownloadError("UPSTREAM", "FDownload tagastas vigase töötlusvastuse.");
  }

  let result: { downloadUrl: string; fileSize: string | null };
  if (payload.status === "success" && payload.statusCode === 200 && payload.result) {
    result = {
      downloadUrl: assertDownloadUrl(payload.result),
      fileSize: payload.fileSize ?? null,
    };
  } else if (payload.status === "success" && payload.statusCode === 300 && payload.jobId) {
    result = await waitForConversion(metadata.convertEndpoint, payload.jobId);
  } else {
    throw new FDownloadError("UPSTREAM", "FDownload ei suutnud sellest videost MP3 faili teha.");
  }

  return {
    ...result,
    sourceUrl,
    bitrate,
    title: metadata.title,
    duration: metadata.duration,
    thumbnail: metadata.thumbnail,
  };
}

import { FDownloadError, convertFacebookMedia } from "@/lib/fdownload";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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

  console.error("Facebook media conversion failed", error);
  return NextResponse.json(
    { ok: false, code: "UNKNOWN", error: "MP3 tegemisel läks midagi valesti. Proovi uuesti." },
    { status: 500 },
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: unknown; bitrate?: unknown };
    const result = await convertFacebookMedia(body.url, body.bitrate);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}

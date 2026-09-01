import { FDownloadError, findFacebookMedia } from "@/lib/fdownload";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

  console.error("Facebook media search failed", error);
  return NextResponse.json(
    { ok: false, code: "UNKNOWN", error: "Midagi läks valesti. Proovi uuesti." },
    { status: 500 },
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: unknown };
    const result = await findFacebookMedia(body.url);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}

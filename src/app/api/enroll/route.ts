import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { eyePatchBase64 } = await req.json();
  if (!eyePatchBase64) {
    return NextResponse.json({ ok: false, error: "missing eyePatchBase64" }, { status: 400 });
  }
  // TODO: extract features + save template (DB)
  return NextResponse.json({ ok: true });
}

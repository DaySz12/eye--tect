import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { eyePatchBase64 } = await req.json();
  if (!eyePatchBase64) {
    return NextResponse.json({ ok: false, error: "missing eyePatchBase64" }, { status: 400 });
  }
  // TODO: run real matching
  const fakeScore = 0.1234;
  return NextResponse.json({ ok: true, score: fakeScore });
}

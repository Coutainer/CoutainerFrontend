import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_IP!;
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "app_token";

export async function POST(req: NextRequest) {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "no token" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({} as any));
    const objectId: string | undefined = body?.objectId;
    if (!objectId) {
      return NextResponse.json({ error: "objectId required" }, { status: 400 });
    }

    const res = await fetch(`${BACKEND}/redemption/generate-token`, {
      method: "POST",
      headers: {
        auth: token,                         // ⬅️ 백엔드 스펙
        "content-type": "application/json",
      },
      body: JSON.stringify({ objectId }),
      cache: "no-store",
    });

    const ct = res.headers.get("content-type") ?? "application/json";
    const payload = ct.includes("application/json")
      ? await res.json().catch(() => ({}))
      : await res.text();

    return new NextResponse(
      typeof payload === "string" ? payload : JSON.stringify(payload),
      { status: res.status, headers: { "content-type": ct } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unexpected error" }, { status: 500 });
  }
}

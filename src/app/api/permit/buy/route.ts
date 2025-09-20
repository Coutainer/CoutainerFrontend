import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_IP!;
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "app_token";

export async function POST(req: NextRequest) {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "no token" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  // 바디는 반드시 { permitId: number }
  const pid = Number(body?.permitId);
  if (!Number.isFinite(pid) || pid <= 0) {
    return NextResponse.json({ error: "permitId must be a positive number" }, { status: 400 });
  }

  const res = await fetch(`${BACKEND}/permit/buy`, {
    method: "POST",
    headers: {
      auth: token,                          // ✅ 반드시 포함
      "content-type": "application/json",   // ✅ 반드시 JSON
    },
    body: JSON.stringify({ permitId: pid }),// ✅ 정확한 스키마
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  const ct = res.headers.get("content-type") ?? "application/json";
  return new NextResponse(text || "{}", { status: res.status, headers: { "content-type": ct } });
}

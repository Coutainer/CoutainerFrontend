// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_IP!;
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "app_token";

export async function POST(req: Request) {
  const jar = await cookies(); // Next 15.x: await 필요
  const token = jar.get(COOKIE_NAME)?.value;
  const body = await req.json().catch(() => ({} as any));
  const oneTimeToken = body?.oneTimeToken;

  if (!token) {
    return NextResponse.json({ error: "no token" }, { status: 401 });
  }

  const res = await fetch(`${BACKEND}/redemption/verify-token`, {
    method: "POST",
    headers: { auth: token , "content-type": "application/json" },
    body: JSON.stringify({ oneTimeToken }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "failed to verify" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

// 일부 클라이언트/프록시가 HEAD로 확인할 때 405 방지
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

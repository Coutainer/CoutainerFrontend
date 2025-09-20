// app/api/session/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "app_token";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const token: string | undefined = body?.token;
  if (!token) {
    return NextResponse.json({ error: "no token" }, { status: 400 });
  }

  const isProd = process.env.NODE_ENV === "production";

  // ✅ 동기 API
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,  // cross-site 쿠키(=SameSite 'none')이면 무조건 true 필요
    sameSite: "lax", // cross-site가 필요하면 'none'으로 바꾸고 secure:true여야 함
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7일
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}

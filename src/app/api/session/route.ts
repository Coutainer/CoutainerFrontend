// app/api/session/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "app_token"; // 백엔드에서 요구하는 이름이면 그걸로 맞추세요

export async function POST(req: Request) {
  const { token } = await req.json();
  if (!token) {
    return NextResponse.json({ error: "no token" }, { status: 400 });
  }

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
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

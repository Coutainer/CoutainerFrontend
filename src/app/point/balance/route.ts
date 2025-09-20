import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "app_token";
const BACKEND = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_IP ?? "").replace(/\/$/, "");

export async function GET() {
  if (!BACKEND) {
    return NextResponse.json({ error: "BACKEND_URL not configured" }, { status: 500 });
  }

  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "no session token" }, { status: 401 });
  }

  const res = await fetch(`${BACKEND}/point/balance`, {
    method: "GET",
    headers: {
      // 백엔드가 요구하는 형태로 보냄
      // auth: token,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

// app/api/point/charge/route.ts
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

  const { amount } = await req.json().catch(() => ({ amount: undefined as any }));
  if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: "invalid amount" }, { status: 400 });
  }

  const body = JSON.stringify({
    amount: String(Math.floor(Number(amount))),
    reason: "포인트 충전",
  });

  const res = await fetch(`${BACKEND}/point/charge`, {
    method: "POST",
    headers: {
      auth: token,                 // 백엔드 스펙: auth 헤더
      Authorization: `Bearer ${token}`, // (옵션) 양쪽 다 허용 시 안전빵
      "Content-Type": "application/json",
    },
    body,
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  const ct = res.headers.get("content-type") ?? "application/json";
  return new NextResponse(text || "{}", { status: res.status, headers: { "content-type": ct } });
}

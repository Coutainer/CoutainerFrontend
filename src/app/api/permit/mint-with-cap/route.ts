// app/api/permit/mint-with-cap/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_IP!;
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "app_token";

export async function POST(req: NextRequest) {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "no token" }, { status: 401 });

  const body = await req.text(); // 그대로 전달
  const res = await fetch(`${BACKEND}/permit/mint-with-cap`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      auth: token,                 // ⬅️ 백엔드 스펙: auth 헤더
      Authorization: `Bearer ${token}`, // (백엔드가 허용한다면 같이 전달)
    },
    body,
  });

  const text = await res.text().catch(() => "");
  const ct = res.headers.get("content-type") ?? "application/json";
  return new NextResponse(text || "{}", { status: res.status, headers: { "content-type": ct } });
}

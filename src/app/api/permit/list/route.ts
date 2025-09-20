import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_IP!;
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "app_token";

export async function POST(req: NextRequest) {
  // ✅ Next 15.x: cookies()는 await 필요
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "no token" }, { status: 401 });
  }

  // 클라이언트에서 보낸 바디 그대로 전달
  const body = await req.text();

  const res = await fetch(`${BACKEND}/permit/list`, {
    method: "POST",
    headers: {
      auth: token,                          // ⬅️ 백엔드 스펙: auth 헤더
      "content-type": "application/json",
    },
    body,
    cache: "no-store",
  });

  // 원본 응답 그대로 패스스루
  const text = await res.text().catch(() => "");
  const ct = res.headers.get("content-type") ?? "application/json";
  return new NextResponse(text || "{}", { status: res.status, headers: { "content-type": ct } });
}

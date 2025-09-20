// app/api/permit/list-permits/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_IP!;
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "app_token";

/**
 * GET /api/permit/list-permits
 * - 서버에서 쿠키의 토큰을 읽어 백엔드 /permit/list-permits 로 전달
 * - 백엔드 스펙: auth 헤더 사용
 */
export async function GET(_req: NextRequest) {
  const jar = await cookies();                           // Next 15.x: await 필요
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "no token" }, { status: 401 });
  }

  const res = await fetch(`${BACKEND}/permit/list-permits`, {
    method: "GET",
    headers: { auth: token },
    cache: "no-store",
  });

  // 백엔드 응답 그대로 패스스루
  const text = await res.text().catch(() => "");
  const ct = res.headers.get("content-type") ?? "application/json";
  return new NextResponse(text || "{}", {
    status: res.status,
    headers: { "content-type": ct },
  });
}

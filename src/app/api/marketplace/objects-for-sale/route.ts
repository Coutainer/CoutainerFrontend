// app/api/marketplace/objects-for-sale/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_IP!;
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "app_token";

// GET /api/marketplace/objects-for-sale
export async function GET(_req: NextRequest) {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;

  const res = await fetch(`${BACKEND}/marketplace/objects-for-sale`, {
    method: "GET",
    // 백엔드가 auth 헤더를 요구하지 않으면 headers 제거해도 됩니다.
    headers: token ? { auth: token } : undefined,
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  const ct = res.headers.get("content-type") ?? "application/json";
  return new NextResponse(text || "[]", {
    status: res.status,
    headers: { "content-type": ct },
  });
}

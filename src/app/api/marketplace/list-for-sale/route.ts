// app/api/marketplace/list-for-sale/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_IP!;
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "app_token";

// (선택) 내 판매목록 조회/검증 용도
export async function GET() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "no token" }, { status: 401 });

  const res = await fetch(`${BACKEND}/marketplace/list-for-sale`, {
    method: "GET",
    headers: { auth: token },
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  const ct = res.headers.get("content-type") ?? "application/json";
  return new NextResponse(text || "{}", { status: res.status, headers: { "content-type": ct } });
}

// 판매 등록
export async function POST(req: NextRequest) {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "no token" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const objectId: string | undefined = body?.objectId;
  const price: string | undefined = body?.price; // 백엔드 스펙: string

  if (!objectId) return NextResponse.json({ error: "missing objectId" }, { status: 400 });
  if (!price || Number.isNaN(Number(price))) {
    return NextResponse.json({ error: "invalid price" }, { status: 400 });
  }

  const res = await fetch(`${BACKEND}/marketplace/list-for-sale`, {
    method: "POST",
    headers: {
      auth: token,
      "content-type": "application/json",
    },
    body: JSON.stringify({ objectId, price }),
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  const ct = res.headers.get("content-type") ?? "application/json";
  return new NextResponse(text || "{}", { status: res.status, headers: { "content-type": ct } });
}

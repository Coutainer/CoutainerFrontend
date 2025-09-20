import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_IP!;
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "app_token";

export async function POST(req: NextRequest) {
  const jar = await cookies(); // Next 15.x: await 필요
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "no token" }, { status: 401 });
  }

  const { objectId, idempotencyKey } = await req.json().catch(() => ({} as any));
  if (!objectId) {
    return NextResponse.json({ error: "objectId required" }, { status: 400 });
  }

  const body = {
    objectId,
    idempotencyKey: idempotencyKey ?? crypto.randomUUID(),
  };

  const upstream = await fetch(`${BACKEND}/marketplace/buy-object`, {
    method: "POST",
    headers: {
      auth: token, // 백엔드 스펙: auth 헤더
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await upstream.text().catch(() => "");
  const ct = upstream.headers.get("content-type") ?? "application/json";

  return new NextResponse(text || "{}", {
    status: upstream.status,
    headers: { "content-type": ct },
  });
}

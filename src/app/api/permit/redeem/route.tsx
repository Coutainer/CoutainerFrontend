// app/api/permit/redeem/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_IP!;
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "app_token";

/**
 * POST /api/permit/redeem
 * body: { permitId: number, nonce: string }
 * - 서버에서 쿠키 토큰을 읽어 백엔드 /permit/redeem 로 포워딩
 */
export async function POST(req: NextRequest) {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ error: "no token" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND}/permit/redeem`, {
      method: "POST",
      headers: {
        auth: token,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text().catch(() => "");
    const ct = res.headers.get("content-type") ?? "application/json";

    return new NextResponse(text || "{}", {
      status: res.status,
      headers: { "content-type": ct },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "upstream error" },
      { status: 502 }
    );
  }
}

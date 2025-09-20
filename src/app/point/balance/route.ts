import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_IP!;

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const r = await fetch(`${BACKEND.replace(/\/$/, "")}/point/balance`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      // 필요시 credentials 등 옵션 추가
    });

    const data = await r.json();
    if (!r.ok) {
      return NextResponse.json({ error: "Backend balance error", detail: data }, { status: r.status });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}

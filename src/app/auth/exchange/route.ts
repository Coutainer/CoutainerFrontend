import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_IP!;
const REDIRECT_URI = process.env.OAUTH_REDIRECT_URI ?? "http://localhost:3000/auth/callback";

/**
 * 클라이언트가 { code, state }를 보내면 백엔드에 교환을 위임한다.
 * 백엔드가 { access_token, refresh_token, id_token, ... } 같은 응답을 준다고 가정.
 */
export async function POST(req: NextRequest) {
  try {
    const { code, state } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    // (선택) state 검사 필요 시 여기에 추가 검증 로직

    // 백엔드로 code 전송 (백엔드 스펙에 맞춰 컨텐츠 타입 조정)
    const r = await fetch(`${BACKEND}/auth/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirect_uri: REDIRECT_URI }),
    });

    const data = await r.json();
    if (!r.ok) {
      return NextResponse.json({ error: "Token exchange failed", detail: data }, { status: 400 });
    }

    const accessToken = data.access_token ?? data.token ?? data.jwt ?? null;
    if (!accessToken) {
      return NextResponse.json({ error: "No access token in response", detail: data }, { status: 400 });
    }

    // httpOnly 쿠키로 저장 (XSS 안전)
    const res = NextResponse.json({ ok: true });
    res.cookies.set("access_token", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: REDIRECT_URI.startsWith("https://"), // https면 true
      path: "/",
      maxAge: 60 * 60, // 1시간 (백엔드 만료 시간에 맞춰 조정)
    });

    // (선택) refresh_token도 있으면 httpOnly로 저장
    if (data.refresh_token) {
      res.cookies.set("refresh_token", data.refresh_token, {
        httpOnly: true,
        sameSite: "lax",
        secure: REDIRECT_URI.startsWith("https://"),
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30일 등
      });
    }

    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}

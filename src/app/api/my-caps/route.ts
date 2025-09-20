// app/api/my-caps/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_IP!;
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "app_token";

export async function GET() {
  // Next 15.x: cookies()는 await 필요
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "no token" }, { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND}/permit/my-caps`, {
      method: "GET",
      headers: { auth: token } as HeadersInit, // 백엔드 스펙: auth 헤더
      cache: "no-store",
    });
  } catch {
    // 백엔드 연결 자체가 안 될 때
    return NextResponse.json({ error: "upstream unreachable" }, { status: 502 });
  }

  // 백엔드가 "데이터 없음"을 204/404로 줄 수도 있음 → 빈 배열로 통일
  if (upstream.status === 204 || upstream.status === 404) {
    return NextResponse.json([]); // ✅ 빈 목록
  }

  // 정상 응답이 아닌데 내용상 "empty/no data" 같은 경우도 빈 목록으로 매핑
  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    if (
      upstream.status >= 500 &&
      /no\s*data|empty|not\s*found|no\s*rows/i.test(text)
    ) {
      return NextResponse.json([]); // ✅ 빈 목록
    }
    // 그 외 에러는 그대로 전달(클라이언트가 에러 배너 보여줌)
    return new NextResponse(text || "{}", {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  }

  // OK(200)인 경우: 안전하게 파싱 후 배열로 정규화해서 반환
  const rawText = await upstream.text().catch(() => "");
  let payload: any = [];
  try {
    payload = rawText ? JSON.parse(rawText) : [];
  } catch {
    payload = [];
  }

  // 서버가 다양한 키를 쓸 수 있으니 배열로 강제 변환
  const normalized =
    Array.isArray(payload) ? payload :
    Array.isArray(payload?.couponObjects) ? payload.couponObjects :
    Array.isArray(payload?.items) ? payload.items :
    Array.isArray(payload?.data) ? payload.data :
    Array.isArray(payload?.result?.couponObjects) ? payload.result.couponObjects :
    [];

  return NextResponse.json(normalized);
}

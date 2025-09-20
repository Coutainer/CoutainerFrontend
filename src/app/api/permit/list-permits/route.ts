import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_IP!;
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "app_token";

// 공용 타입 정의
type Permit = {
  id?: number | string;
  objectId?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  faceValue?: string | number;
  price?: string | number;
  expiry?: string;
  status?: string; // "LISTED", "SOLD", "EXPIRED" 등
  [key: string]: any;
};

/**
 * GET /api/permit/list-permits
 * - 쿠키에서 토큰 읽기 → 백엔드 호출
 * - status === "LISTED" 만 반환
 */
export async function GET(_req: NextRequest) {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "no token" }, { status: 401 });
  }

  const res = await fetch(`${BACKEND}/permit/list-permits`, {
    method: "GET",
    headers: { auth: token },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return new NextResponse(text || "{}", { status: res.status });
  }

  // JSON 파싱 후 status === "LISTED" 필터링
  const data = (await res.json().catch(() => ({}))) as { permits?: Permit[] };
  let permits: Permit[] = [];

  if (Array.isArray(data.permits)) {
    permits = data.permits.filter((p: Permit) => p.status === "LISTED");
  }

  return NextResponse.json({ permits });
}

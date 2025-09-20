"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type RawCoupon = {
  id: number;
  objectId: string;
  title: string;
  description: string;
  imageUrl: string;
  faceValue: string;
  remaining: string;
  tradeCount: number;
  state: string;
  expiresAt: string;
  issuedAt: string;
  usedAt: string | null;
  supplierId: number;
  issuerId: number;
};

function toLocalMarketPath(raw?: string | null, baseDir = "/market") {
  if (!raw) return null;

  let last = String(raw).trim();

  // URL이면 경로만 뽑기
  try {
    const u = new URL(last);
    last = u.pathname;
  } catch {
    // URL 아니면 그대로 사용
  }

  // 파일명 추출 (쿼리/해시 제거)
  const file = last.split("/").pop()?.split("?")[0].split("#")[0] ?? "";

  // 파일명 화이트리스트 (보안/오타 방지)
  const safe = /^[a-zA-Z0-9._-]+$/.test(file) ? file : "";
  if (!safe) return null;

  // 이미지 확장자만 허용
  if (!/\.(png|jpe?g|webp|gif|svg)$/i.test(safe)) return null;

  return `${baseDir}/${safe}`; // 예: /market/daiso3.jpg
}

export default function CouponsPage() {
  const router = useRouter();
  const shellBg = "#0B4661";

  const [data, setData] = useState<RawCoupon[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        setPending(true);
        setError(null);

        const res = await fetch("/api/my-caps", { method: "GET", cache: "no-store" });

        // 401 => 로그인 필요
        if (res.status === 401) {
          setError("require Login.");
          // 필요시 이동
          // router.push("/login");
          setPending(false);
          return;
        }

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          throw new Error(detail || `HTTP ${res.status}`);
        }

        // 응답을 유연하게 배열로 변환
        const json = await res.json().catch(() => ({}));
        const rows = coerceToCoupons(json);

        if (!Array.isArray(rows)) {
          throw new Error("Invalid response shape");
        }
        setData(rows);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load coupons");
      } finally {
        setPending(false);
      }
    })();
  }, []);

  const content = useMemo(() => {
    if (pending) {
      return (
        <>
          {Array.from({ length: 4 }).map((_, i) => (
            <article key={i} className="relative flex gap-4 bg-white rounded-2xl p-4 shadow animate-pulse">
              <div className="w-11 h-11 rounded bg-slate-200" />
              <div className="mx-2 w-px bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-slate-200 rounded w-1/3" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-3 bg-slate-200 rounded w-1/3" />
              </div>
            </article>
          ))}
        </>
      );
    }

    if (error) {
      return (
        <div className="text-center text-slate-200 py-10">
          Failed to retrieve the coupon.
          <div className="text-slate-300 text-sm mt-2">{error}</div>
          <button
            onClick={() => location.reload()}
            className="mt-4 rounded-full bg-white/90 px-4 py-2 text-[#0B4661] font-semibold"
          >
            Try again
          </button>
        </div>
      );
    }

    if (data.length === 0) {
      return <div className="text-center text-slate-200 py-10">you don't have any registered coupons yet.</div>;
    }

    return data.map((c) => (
      <article
        key={`${c.objectId}-${c.id}`}
        onClick={() =>
          router.push(`/mycoupon/coupon?oid=${encodeURIComponent(c.objectId)}&cid=${c.id}`)
        }
        className={[
          "cursor-pointer transition hover:shadow-lg",
          "relative flex gap-4 bg-white rounded-2xl p-4 shadow",
          "before:content-[''] before:absolute before:left-[-14px] before:top-1/2 before:-translate-y-1/2 before:w-7 before:h-7 before:rounded-full before:bg-[--notch]",
          "after:content-['']  after:absolute  after:right-[-14px] after:top-1/2  after:-translate-y-1/2  after:w-7 after:h-7 after:rounded-full  after:bg-[--notch]",
        ].join(" ")}
        style={{ ["--notch" as any]: shellBg } as React.CSSProperties}
      >
        {/* left: 썸네일 */}
        <div className="flex items-center">
          <SmartImage src={c.imageUrl || "/logos/default.png"} alt={c.title} size={100} />
        </div>

        {/* 가운데 절취선 */}
        <div className="mx-2 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent relative">
          <div className="absolute inset-0 border-l-2 border-dashed border-gray-300 left-[-1px]" />
        </div>

        {/* right: 내용 */}
        <div className="flex-1">
          <p className="text-2xl font-semibold leading-tight">{c.title}</p>
          <p className="text-base font-medium text-slate-700">{buildInfoLine(c)}</p>
          <p className="text-xs text-slate-400 mt-2">
            {c.expiresAt ? normalizeExpiry(c.expiresAt) : "No expiry info"}
          </p>
        </div>
      </article>
    ));
  }, [pending, error, data, shellBg]);

  return (
    <div className="min-h-dvh w-full flex items-center justify-center bg-slate-200">
      <main
        className="h-dvh w-full md:h-[844px] md:w-[390px] md:rounded-[30px] md:shadow-2xl overflow-hidden"
        style={{ backgroundColor: shellBg }}
      >
        {/* 상단 헤더 */}
        <header className="flex items-center justify-between px-5 py-4 text-white">
          <button onClick={() => router.back()} className="text-2xl leading-none">←</button>
          <h1 className="text-lg font-semibold">My Coupons</h1>
          <button className="text-2xl leading-none">≡</button>
        </header>

        {/* 리스트 */}
        <section className="h-[calc(100dvh-160px)] md:h-[calc(844px-160px)] overflow-y-auto px-4 space-y-4">
          {content}
          <div className="h-2" />
        </section>

        {/* 하단 버튼 */}
        <footer className="px-6 pb-6 pt-2">
          <button className="w-full rounded-full bg-white py-4 text-base font-semibold text-[#0B4661] shadow">
            Add new coupon
          </button>
        </footer>
      </main>
    </div>
  );
}

/* ===== Helpers ===== */

// 응답을 유연하게 배열로 변환하는 헬퍼
function coerceToCoupons(payload: any): RawCoupon[] {
  if (Array.isArray(payload)) return payload as RawCoupon[];
  if (payload && Array.isArray(payload.couponObjects)) return payload.couponObjects as RawCoupon[];
  if (payload && Array.isArray(payload.items)) return payload.items as RawCoupon[];
  if (payload && Array.isArray(payload.data)) return payload.data as RawCoupon[];
  // 백엔드가 { result: {..., couponObjects:[...] } } 형태일 수도 있음
  if (payload?.result && Array.isArray(payload.result.couponObjects)) {
    return payload.result.couponObjects as RawCoupon[];
  }
  return [];
}

function SmartImage({ src, alt, size }: { src: string; alt: string; size: number }) {
  // 1) src에서 파일명 뽑아 /market/파일명 으로 매핑
  const local = toLocalMarketPath(src);

  // 2) 매핑 성공 시 로컬 파일 사용 (Next/Image 최적화 OK)
  if (local) {
    return (
      <Image
        src={local}
        alt={alt}
        width={size}
        height={size}
        className="shrink-0 rounded object-cover"
      />
    );
  }

  // 3) 실패 시 기본 이미지로 대체 (프로젝트에 존재해야 함)
  const fallback = "/logos/default.png";
  return (
    <Image
      src={fallback}
      alt={alt}
      width={size}
      height={size}
      className="shrink-0 rounded object-cover"
    />
  );
}

function normalizeExpiry(input: string) {
  const d = new Date(input);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `Valid until ${y}-${m}-${day}`;
  }
  return input;
}

function buildInfoLine(r: RawCoupon) {
  const won = formatWon(r.faceValue);
  const rem = safeInt(r.remaining);
  const state = r.state ?? "";
  return `${won} · remain ${rem} · ${state}`;
}

function safeInt(s: string | number | null | undefined) {
  const n = typeof s === "string" ? parseInt(s, 10) : typeof s === "number" ? s : 0;
  return Number.isFinite(n) ? n : 0;
}

function formatWon(v: string | number | null | undefined) {
  const n = typeof v === "string" ? parseInt(v, 10) : typeof v === "number" ? v : 0;
  return `₩${n.toLocaleString()}`;
}

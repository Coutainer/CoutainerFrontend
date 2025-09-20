// app/market/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Permit = {
  id?: number | string;
  objectId?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  faceValue?: string | number;
  price?: string | number;
  expiry?: string; // ISO
  // 그 외 필드가 있어도 안전하게 처리되도록 넉넉한 타입
  [key: string]: any;
};

type Resp = { permits?: Permit[] };

export default function MarketPage() {
  const router = useRouter();
  const [permits, setPermits] = useState<Permit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        setPending(true);
        setError(null);

        const res = await fetch("/api/permit/list-permits", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || `HTTP ${res.status}`);
        }

        const data: Resp = await res.json();
        setPermits(Array.isArray(data?.permits) ? data.permits : []);
      } catch (e: any) {
        setError(e?.message ?? "알 수 없는 오류");
        setPermits([]);
      } finally {
        setPending(false);
      }
    })();
  }, []);

  if (pending) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-slate-400">불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-rose-400">오류: {error}</p>
      </div>
    );
  }

  if (!permits || permits.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-slate-400">표시할 퍼밋이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">Market</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {permits.map((p) => {
          const id = String(p.id ?? p.objectId ?? crypto.randomUUID());
          const price =
            typeof p.price === "number"
              ? p.price.toLocaleString()
              : typeof p.price === "string" && !Number.isNaN(Number(p.price))
              ? Number(p.price).toLocaleString()
              : p.price ?? "-";

          const faceValue =
            typeof p.faceValue === "number"
              ? p.faceValue.toLocaleString()
              : typeof p.faceValue === "string" && !Number.isNaN(Number(p.faceValue))
              ? Number(p.faceValue).toLocaleString()
              : p.faceValue ?? "-";

          const expiry = p.expiry
            ? new Date(p.expiry).toLocaleString()
            : undefined;

          return (
            <div
              key={id}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-card/60 backdrop-blur hover:border-white/20 transition"
            >
              {/* 이미지 영역 */}
              <div className="relative aspect-[4/3] w-full bg-black/10">
                {/* next/image 설정 전이므로 우선 <img> 사용 */}
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.title ?? "permit"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                    No Image
                  </div>
                )}
              </div>

              {/* 텍스트 영역 */}
              <div className="p-4">
                <h3 className="line-clamp-1 font-semibold">{p.title ?? "제목 없음"}</h3>
                {p.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                    {p.description}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                    {price !== "-" ? `${price} WON` : "가격 미정"}
                  </span>
                  {faceValue && (
                    <span className="text-xs text-slate-400">
                      FV: {faceValue}
                    </span>
                  )}
                </div>

                {expiry && (
                  <div className="mt-2 text-right text-[11px] text-slate-500">
                    만료: {expiry}
                  </div>
                )}

                <button
                  onClick={() => {
                    // 상세 페이지로 이동이 필요하면 여기서 라우팅
                    // 예: router.push(`/market/${p.objectId ?? p.id}`);
                  }}
                  className="mt-4 w-full rounded-xl bg-white/10 py-2 text-sm text-white hover:bg-white/20"
                >
                  자세히 보기
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

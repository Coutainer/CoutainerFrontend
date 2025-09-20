"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Permit = {
  id?: number | string;
  objectId?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  faceValue?: string | number;
  price?: string | number;
  expiry?: string; // ISO
  [key: string]: any;
};

type Resp = { permits?: Permit[] };

function toLocalImagePath(raw?: string | null, baseDir = "/market") {
  if (!raw) return null;
  let last = raw.trim();
  try {
    const u = new URL(last);
    last = u.pathname;
  } catch {}
  const file = last.split("/").pop()?.split("?")[0].split("#")[0] ?? "";
  const safe = /^[a-zA-Z0-9._-]+$/.test(file) ? file : "";
  if (!safe) return null;
  if (!/\.(png|jpe?g|webp|gif|svg)$/i.test(safe)) return null;
  return `${baseDir}/${safe}`;
}

const PAGE_SIZE = 8;

export default function MarketPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [permits, setPermits] = useState<Permit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<boolean>(true);

  const [buyOpen, setBuyOpen] = useState(false);
  const [selected, setSelected] = useState<Permit | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [buyDone, setBuyDone] = useState<string | null>(null);

  // 페이지
  const pageFromQS = Number(search.get("page") ?? "1");
  const currentPage = Number.isFinite(pageFromQS) && pageFromQS > 0 ? pageFromQS : 1;

  useEffect(() => {
    (async () => {
      try {
        setPending(true);
        setError(null);
        const res = await fetch("/api/permit/list-permits", { method: "GET", cache: "no-store" });
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

  // 페이지네이션 계산
  const total = permits?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  const pageItems = useMemo(() => {
    if (!permits) return [];
    return permits.slice(start, end);
  }, [permits, start, end]);

  const gotoPage = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    const qs = new URLSearchParams(search.toString());
    qs.set("page", String(next));
    router.push(`?${qs.toString()}`);
  };

  async function handleBuy() {
    if (!selected) return;
    try {
      setBuying(true);
      setBuyError(null);
      setBuyDone(null);

      const raw = (selected as any).permitId ?? selected.id ?? selected.objectId;
      const permitId = Number(raw);
      if (!Number.isFinite(permitId) || permitId <= 0) {
        throw new Error("유효한 permitId가 없습니다.");
      }

      const res = await fetch("/api/permit/buy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ permitId }),
      });

      const text = await res.text().catch(() => "");
      if (!res.ok) {
        try {
          const j = JSON.parse(text || "{}");
          throw new Error(j?.message || j?.error || text || `구매 실패 (HTTP ${res.status})`);
        } catch {
          throw new Error(text || `구매 실패 (HTTP ${res.status})`);
        }
      }

      setBuyDone(text || "구매가 완료되었습니다.");
    } catch (e: any) {
      setBuyError(e?.message ?? "구매 중 오류가 발생했습니다.");
    } finally {
      setBuying(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">Market</h1>

      {/* ✅ 액션바: 항상 표시 */}
      <div className="mb-4 flex items-center">
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/qrread")}
            className="rounded-lg border bg-gray-100 border-black px-3 py-1.5 text-sm hover:bg-gray-300"
            title="Open QR Reader"
          >
            📷 QR Reader
          </button>

          <button
            type="button"
            onClick={() => router.push("/market/new")}
            className="rounded-lg border bg-red-300 border-red-600 px-3 py-1.5 text-sm hover:bg-red-400"
            title="Create a new item"
          >
            Create New Item
          </button>
        </div>
      </div>

      {/* ✅ 콘텐츠 영역: 상태별 분기만 */}
      {pending ? (
        <div className="py-10 text-slate-400">불러오는 중...</div>
      ) : error ? (
        <div className="py-10 text-rose-400">오류: {error}</div>
      ) : !permits || permits.length === 0 ? (
        <div className="py-10 text-slate-400">표시할 퍼밋이 없습니다.</div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((p) => {
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

              const expiry = p.expiry ? new Date(p.expiry).toLocaleString() : undefined;

              return (
                <div
                  key={id}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-card/60 backdrop-blur hover:border-white/20 transition"
                >
                  {/* 이미지 */}
                  <div
                    className="relative aspect-[4/3] w-full bg-black/10 cursor-pointer"
                    onClick={() => {
                      setSelected(p);
                      setQty(1);
                      setBuyError(null);
                      setBuyDone(null);
                      setBuyOpen(true);
                    }}
                    title="클릭하여 구매"
                  >
                    {(() => {
                      const localSrc = toLocalImagePath(p.imageUrl, "/market");
                      if (localSrc) {
                        return (
                          <img
                            src={localSrc}
                            alt={p.title ?? "permit"}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        );
                      }
                      return (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                          No Image
                        </div>
                      );
                    })()}
                  </div>

                  {/* 텍스트 */}
                  <div className="p-4">
                    <h3 className="line-clamp-1 font-semibold">{p.title ?? "제목 없음"}</h3>
                    {p.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-400">{p.description}</p>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs text-red-300">
                        {price !== "-" ? `${price} WON` : "가격 미정"}
                      </span>
                      {faceValue && <span className="text-xs text-slate-400">FV: {faceValue}</span>}
                    </div>

                    {expiry && (
                      <div className="mt-2 text-right text-[11px] text-slate-500">exfire: {expiry}</div>
                    )}

                    <button
                      onClick={() => {
                        setSelected(p);
                        setQty(1);
                        setBuyError(null);
                        setBuyDone(null);
                        setBuyOpen(true);
                      }}
                      className="mt-4 w-full rounded-xl bg-white/10 py-2 text-sm text-white hover:bg-white/20"
                    >
                      구매하기
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-50"
                onClick={() => gotoPage(safePage - 1)}
                disabled={safePage <= 1}
                aria-label="이전 페이지"
              >
                이전
              </button>

              {(() => {
                const windowSize = 7;
                let startP = Math.max(1, safePage - Math.floor(windowSize / 2));
                let endP = Math.min(totalPages, startP + windowSize - 1);
                if (endP - startP + 1 < windowSize) {
                  startP = Math.max(1, endP - windowSize + 1);
                }
                const arr = [];
                for (let p = startP; p <= endP; p++) arr.push(p);
                return arr.map((p) => (
                  <button
                    key={p}
                    onClick={() => gotoPage(p)}
                    className={`rounded-lg px-3 py-1.5 text-sm border ${
                      p === safePage
                        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                        : "border-white/10 hover:bg-white/10"
                    }`}
                    aria-current={p === safePage ? "page" : undefined}
                  >
                    {p}
                  </button>
                ));
              })()}

              <button
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-50"
                onClick={() => gotoPage(safePage + 1)}
                disabled={safePage >= totalPages}
                aria-label="다음 페이지"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {/* 구매 모달 */}
      {buyOpen && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => {
            if (!buying) setBuyOpen(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-neutral-900 text-white shadow-xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10">
              <h2 className="text-lg font-semibold">구매하기</h2>
              <p className="mt-1 text-sm text-slate-400 line-clamp-2">{selected.title ?? "-"}</p>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">permitId</span>
                  <span className="font-mono">{String(selected.id ?? selected.objectId ?? "-")}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-slate-400">가격</span>
                  <span>
                    {(() => {
                      const v = selected.price;
                      const n =
                        typeof v === "number"
                          ? v
                          : typeof v === "string" && !Number.isNaN(Number(v))
                          ? Number(v)
                          : undefined;
                      return n ? `${n.toLocaleString()} WON` : (v as any) ?? "-";
                    })()}
                  </span>
                </div>
              </div>

              {buyError && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                  {buyError}
                </div>
              )}
              {buyDone && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  {buyDone}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-white/10 flex gap-2">
              <button
                disabled={buying}
                onClick={() => setBuyOpen(false)}
                className="flex-1 rounded-xl bg-white/10 hover:bg-white/20 py-2 text-sm disabled:opacity-50"
              >
                닫기
              </button>
              <button
                disabled={buying}
                onClick={handleBuy}
                className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 py-2 text-sm text-black font-semibold disabled:opacity-50"
              >
                {buying ? "구매 중..." : "구매 확정"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

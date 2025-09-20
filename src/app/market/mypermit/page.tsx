// app/market/mypermit/page.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useCallback } from "react";

/* =========================
 * Types
 * ========================= */
type Permit = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  scope: string;
  limit: string;
  faceValue: string;
  totalValue: string;
  price: string;
  expiry: string;
  status: string; // LISTED | SOLD | REDEEMED | ...
  supplierAddress: string;
  buyerAddress: string;
  soldAt: string | null;
  redeemedAt: string | null;
  [k: string]: any;
};

// 최신 응답 형태
type MyPermitsAPI = {
  supplies?: Permit[];
  purchases?: Permit[];
  summary?: { totalSupplies: number; totalPurchases: number; total: number };
};

// 과거 호환 (permits 배열만 오는 경우)
type LegacyResp = { permits?: Permit[] };

/* =========================
 * Utils
 * ========================= */
function fmtDate(raw?: string): string {
  if (!raw) return "-";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function badgeColor(status: string) {
  const s = status?.toUpperCase?.() || "";
  if (s.includes("LISTED")) return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30";
  if (s.includes("SOLD")) return "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30";
  if (s.includes("REDEEM")) return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30";
  return "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/30";
}

/** next/image 호스트 미설정 대비: 외부 URL이면 <img> 사용 */
function SafeImg({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  if (!src) return <div className={`bg-slate-800/50 ${className}`} />;
  const isExternal = /^https?:\/\//i.test(src);
  if (isExternal) return <img src={src} alt={alt} className={className} />;
  return (
    <Image src={src} alt={alt} width={400} height={240} className={className} priority={false} />
  );
}

/** 랜덤 nonce/idempotencyKey 생성 */
function makeNonce() {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `nonce-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/* =========================
 * Transfer Modal (밝은 버전)
 * ========================= */
function TransferModal({
  open,
  onClose,
  permit,
}: {
  open: boolean;
  onClose: () => void;
  permit: Permit | null;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [phase, setPhase] = useState<"form" | "result">("form");

  const [recipientId, setRecipientId] = useState<string>("");
  const [count, setCount] = useState<string>("1");
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  const [result, setResult] = useState<{
    redeem?: { message?: string; capId?: number; cap?: any };
    mint?: any;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setErr(null);
      setLoading(false);
      setPhase("form");
      setRecipientId("");
      setCount("1");
      setIdempotencyKey(makeNonce());
      setResult(null);
    }
  }, [open]);

  const handleTransfer = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!permit) return;

      try {
        setLoading(true);
        setErr(null);

        // 1) cap 발급 (redeem)
        const redeemRes = await fetch("/api/permit/redeem", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ permitId: permit.id, nonce: makeNonce() }),
        });
        if (!redeemRes.ok) {
          const text = await redeemRes.text().catch(() => "");
          throw new Error(text || `redeem HTTP ${redeemRes.status}`);
        }
        const redeemData = (await redeemRes.json()) as { message?: string; capId: number; cap?: any };
        const capId = redeemData.capId;
        if (!capId) throw new Error("capId가 응답에 없습니다.");

        // 2) cap 전달 (mint-with-cap)
        const payload = {
          capId,
          recipientId: Number(recipientId),
          count: Number(count),
          idempotencyKey,
        };

        const mintRes = await fetch("/api/permit/mint-with-cap", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!mintRes.ok) {
          const text = await mintRes.text().catch(() => "");
          throw new Error(text || `mint-with-cap HTTP ${mintRes.status}`);
        }
        const mintData = await mintRes.json();

        setResult({ redeem: redeemData, mint: mintData });
        setPhase("result");
      } catch (e: any) {
        setErr(e?.message ?? "전달 과정에서 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [permit, recipientId, count, idempotencyKey]
  );

  if (!open || !permit) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* 반투명 배경 */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      {/* 밝은 모달 박스 */}
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <h3 className="text-base font-semibold text-slate-800">아이템 전달</h3>
        <p className="mt-1 text-xs text-slate-500 line-clamp-2">{permit.title}</p>

        {phase === "form" && (
          <form className="mt-4 space-y-3" onSubmit={handleTransfer}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600">recipientId</label>
                <input
                  type="number"
                  min={1}
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="상대 사용자 ID"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-600">count</label>
                <input
                  type="number"
                  min={1}
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="전달 수량"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600">idempotencyKey</label>
              <input
                type="text"
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="유니크 키"
                required
              />
              <p className="mt-1 text-[11px] text-slate-400">요청 중복 방지용 유니크 키</p>
            </div>

            {err && (
              <div className="rounded-lg border border-rose-300 bg-rose-100 px-3 py-2 text-xs text-rose-700">
                {err}
              </div>
            )}

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
              >
                {loading ? "전달 중..." : "완료"}
              </button>
            </div>
          </form>
        )}

        {phase === "result" && (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm">
              <div className="text-emerald-700 font-medium">전달 완료</div>
              <div className="mt-1 text-slate-700 text-xs">
                capId: {result?.redeem?.capId ?? "-"}
              </div>
            </div>

            <div>
              <div className="mb-1 text-xs text-slate-500">응답 상세</div>
              <pre className="max-h-60 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
{JSON.stringify(result, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================
 * Page
 * ========================= */
export default function MyPermitPage() {
  const [supplies, setSupplies] = useState<Permit[]>([]);
  const [purchases, setPurchases] = useState<Permit[]>([]);
  const [summary, setSummary] = useState<{ totalSupplies: number; totalPurchases: number; total: number }>({
    totalSupplies: 0,
    totalPurchases: 0,
    total: 0,
  });

  const [pending, setPending] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [transferOpen, setTransferOpen] = useState(false);
  const [targetPermit, setTargetPermit] = useState<Permit | null>(null);

  // 데이터 로딩
  useEffect(() => {
    (async () => {
      try {
        setPending(true);
        setError(null);

        const res = await fetch("/api/permit/my-permits", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(msg || `HTTP ${res.status}`);
        }

        const raw = (await res.json()) as MyPermitsAPI | LegacyResp;

        if ("permits" in raw && Array.isArray((raw as LegacyResp).permits)) {
          // 과거 호환
          const list = (raw as LegacyResp).permits ?? [];
          setSupplies(list);
          setPurchases([]);
          setSummary({ totalSupplies: list.length, totalPurchases: 0, total: list.length });
        } else {
          const ap = raw as MyPermitsAPI;
          const su = ap.supplies ?? [];
          const pu = ap.purchases ?? [];
          setSupplies(su);
          setPurchases(pu);
          setSummary(
            ap.summary ?? {
              totalSupplies: su.length,
              totalPurchases: pu.length,
              total: su.length + pu.length,
            }
          );
        }
      } catch (e: any) {
        setError(e?.message ?? "Failed to load");
        setSupplies([]);
        setPurchases([]);
        setSummary({ totalSupplies: 0, totalPurchases: 0, total: 0 });
      } finally {
        setPending(false);
      }
    })();
  }, []);

  const all = useMemo(() => [...supplies, ...purchases], [supplies, purchases]);
  const empty = useMemo(() => !pending && !error && all.length === 0, [pending, error, all]);

  const openTransfer = (p: Permit) => {
    setTargetPermit(p);
    setTransferOpen(true);
  };
  const closeTransfer = () => {
    setTransferOpen(false);
    setTargetPermit(null);
  };

  // 공통 섹션 (디자인: 그룹 컨테이너 + 내부 카드)
  const Section = ({
    title,
    items,
    showTransfer,
  }: {
    title: string;
    items: Permit[];
    showTransfer?: boolean;
  }) => (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
        <span className="text-xs text-slate-400">{items.length} items</span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-white/10 p-6 text-slate-400 bg-card/40">
            비어있습니다.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => {
              const isRedeemed = (p.status ?? "").toUpperCase().includes("REDEEM");
              return (
                <li
                  key={p.id}
                  className="group overflow-hidden rounded-xl border border-white/10 bg-card/60 backdrop-blur transition hover:border-white/20"
                >
                  <div className="relative">
                    <SafeImg src={p.imageUrl} alt={p.title} className="h-36 w-full object-cover" />
                    <span
                      className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeColor(
                        p.status || ""
                      )}`}
                    >
                      {p.status || "UNKNOWN"}
                    </span>
                  </div>

                  <div className="p-3">
                    <h3 className="line-clamp-1 text-sm font-semibold">{p.title}</h3>
                    <p className="mt-0.5 line-clamp-2 text-[12px] text-slate-400">{p.description}</p>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                      <div className="rounded-lg border border-white/10 p-2 bg-white/5">
                        <div className="text-[11px] text-slate-500">Face</div>
                        <div className="font-semibold">{p.faceValue || "-"}</div>
                      </div>
                      <div className="rounded-lg border border-white/10 p-2 bg-white/5">
                        <div className="text-[11px] text-slate-500">Price</div>
                        <div className="font-semibold">{p.price || "-"}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-[11px] text-slate-500">Expiry: {fmtDate(p.expiry)}</div>

                      {/* 전달 버튼: 구매 목록에서만 노출, 이미 REDEEMED면 비활성화 */}
                      {showTransfer && (
                        <button
                          type="button"
                          onClick={() => openTransfer(p)}
                          disabled={isRedeemed}
                          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
                          title={isRedeemed ? "이미 발급됨" : "전달"}
                        >
                          전달
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* 헤더 */}
      <header className="mb-4 flex flex-wrap items-center gap-3 justify-between">
        <h1 className="text-xl font-semibold">My Permits</h1>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full border border-white/10 px-2 py-1 text-slate-300">
            전체: {summary.total}
          </span>
          <span className="rounded-full border border-white/10 px-2 py-1 text-slate-300">
            올린 것: {summary.totalSupplies}
          </span>
          <span className="rounded-full border border-white/10 px-2 py-1 text-slate-300">
            산 것: {summary.totalPurchases}
          </span>
        </div>
      </header>

      {/* 상태 */}
      {pending && (
        <div className="rounded-xl border border-white/10 p-6 text-slate-400">Loading your permits…</div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">{error}</div>
      )}
      {empty && (
        <div className="rounded-xl border border-white/10 p-8 text-center text-slate-400">보유 중인 아이템이 없습니다.</div>
      )}

      {!pending && !error && !empty && (
        <>
          {/* 내가 올린(supplies): 전달 버튼 노출 X */}
          <Section title="내가 올린(supplies)" items={supplies} showTransfer={false} />
          {/* 내가 산 것(purchases): 전달 버튼 노출 O */}
          <Section title="내가 산 것(purchases)" items={purchases} showTransfer />
        </>
      )}

      {/* 전달 모달 (완료 클릭 시 redeem -> mint-with-cap 순차 실행) */}
      <TransferModal open={transferOpen} onClose={closeTransfer} permit={targetPermit} />
    </div>
  );
}

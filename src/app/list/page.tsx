"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  ShoppingCartIcon,
  ChatBubbleLeftRightIcon,
  WalletIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

type Owner = { id: number; address: string };

type MarketItem = {
  id: number;
  objectId: string;
  title: string;
  description: string;
  imageUrl: string;
  faceValue: string;
  remaining: string;
  tradeCount: number;
  expiresAt: string;
  owner: Owner;
};



export default function OrdersPage() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ 추가된 상태
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [buyDone, setBuyDone] = useState<string | null>(null); // objectId 저장

  useEffect(() => {
    (async () => {
      try {
        setPending(true);
        setError(null);
        const res = await fetch("/api/marketplace/objects-for-sale", {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(msg || `Failed: ${res.status}`);
        }
        const data = (await res.json()) as MarketItem[];
        setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e?.message || "불러오기 실패");
      } finally {
        setPending(false);
      }
    })();
  }, []);

  function formatWon(s: string | number | null | undefined) {
    if (s == null) return "";
    const n = Number(s);
    if (!Number.isFinite(n)) return String(s);
    return `${n.toLocaleString()} ₩`;
  }

  function formatExpiresAt(s: string) {
    if (!s) return "";
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString();
  }

  function stockInfo(remainingStr: string) {
    const left = Number(remainingStr);
    if (!Number.isFinite(left)) return { label: "Unknown", dot: "bg-gray-300" };
    if (left <= 0) return { label: "Out of stock", dot: "bg-gray-300" };
    return { label: "On Sale", dot: "bg-green-400" };
  }

  // ✅ 구매 요청 핸들러
  async function handleBuy(objectId: string) {
    try {
      setBuyError(null);
      setBuyDone(null);
      setBuyingId(objectId);

      // 필요시 사용자 확인/모달 로직 삽입
      // const ok = confirm("구매하시겠습니까?");
      // if (!ok) return;

      // 안전한 키 생성
      const key =
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? (crypto as any).randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

      const res = await fetch("/api/marketplace/buy-object", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ objectId, idempotencyKey: key }),
      });

      const ct = res.headers.get("content-type") || "";
      const isJson = ct.includes("application/json");
      const payload = isJson ? await res.json().catch(() => ({})) : await res.text();

      if (!res.ok) {
        const msg = isJson ? payload?.error || JSON.stringify(payload) : String(payload);
        throw new Error(msg || `Failed: ${res.status}`);
      }

      // 성공 처리
      setBuyDone(objectId);

      // 예: 구매 완료 페이지로 이동 / 영수증 보기 등
      // window.location.href = `/market/receipt/${encodeURIComponent(objectId)}`;

      // 또는 목록 갱신
      //await refreshList();

    } catch (e: any) {
      setBuyError(e?.message || "구매 실패");
    } finally {
      setBuyingId(null);
    }
  }

  return (
    <div className="min-h-dvh bg-neutral-50">
      <div className="mx-auto max-w-[480px] min-h-dvh flex flex-col">
        {/* Header */}
        <header className="px-5 pt-4 pb-3 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Coupon Market</h1>
            <div className="flex items-center gap-3">
              <MagnifyingGlassIcon className="w-6 h-6 text-neutral-800" />
              <EllipsisHorizontalIcon className="w-7 h-7 text-neutral-800" />
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex items-center gap-8">
            <button className="pb-2 text-base font-semibold text-neutral-900 relative">
              All Of Items
              <span className="absolute -bottom-[1px] left-0 h-[3px] w-full rounded-full bg-neutral-900" />
            </button>
            <button className="pb-2 text-base font-medium text-neutral-300">
              On Sale
            </button>
          </div>
          <div className="h-px w-full bg-neutral-200" />
        </header>

        {/* List */}
        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {pending && <div className="text-sm text-neutral-500">불러오는 중…</div>}

          {error && (
            <div className="text-sm text-red-500">
              목록을 불러오지 못했습니다: {error}
            </div>
          )}

          {!pending && !error && items.length === 0 && (
            <div className="text-sm text-neutral-500">판매 중인 아이템이 없습니다.</div>
          )}

          {/* ✅ 구매 상태/오류 전역 표시(옵션) */}
          {buyError && (
            <div className="text-sm text-red-600">
              구매 실패: {buyError}
            </div>
          )}
          {buyDone && (
            <div className="text-sm text-emerald-600">
              구매 완료: {buyDone}
            </div>
          )}

          {items.map((o) => {
            const st = stockInfo(o.remaining);
            const isExternal = /^https?:\/\//i.test(o.imageUrl);

            const isBusy = buyingId === o.objectId;

            return (
              <article
                key={o.id}
                className="rounded-3xl bg-white shadow-sm px-4 py-4 flex gap-4 items-center"
              >
                {/* product image */}
                <div className="shrink-0">
                  <div className="rounded-2xl bg-neutral-100 p-3">
                    {isExternal ? (
                      <img
                        src={o.imageUrl}
                        alt={o.title}
                        className="h-16 w-[90px] object-contain rounded-md"
                        width={90}
                        height={64}
                        loading="lazy"
                      />
                    ) : (
                      <Image
                        src={o.imageUrl || "/placeholder.png"}
                        alt={o.title}
                        width={90}
                        height={64}
                        className="h-16 w-[90px] object-contain"
                        priority
                        unoptimized
                      />
                    )}
                  </div>
                </div>

                {/* info */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 line-clamp-2">
                    {o.title}
                  </h3>

                  <p className="mt-1 text-sm text-neutral-500 line-clamp-2">
                    {o.description}
                  </p>

                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 text-neutral-500">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                    <span className="text-neutral-400">
                      Trades: {o.tradeCount}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-2xl font-extrabold tracking-tight">
                      {formatWon(o.faceValue)}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <span>exp:</span>
                      <span>{formatExpiresAt(o.expiresAt)}</span>
                    </div>

                    {/* ✅ Buy 버튼 */}
                    <button
                      className={`ml-auto rounded-full px-4 py-2 text-sm font-semibold transition
                        ${isBusy ? "bg-neutral-300 text-neutral-500" : "bg-neutral-900 text-white hover:bg-neutral-800"}`}
                      disabled={isBusy}
                      onClick={() => handleBuy(o.objectId)}
                      aria-busy={isBusy}
                    >
                      {isBusy ? "Buying..." : "Buy"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          <div className="h-20" />
        </main>

        {/* Bottom Tab Bar */}
        <nav className="sticky bottom-0 bg-white border-t border-neutral-200">
          <div className="mx-auto max-w-[480px]">
            <ul className="grid grid-cols-5 px-6 py-3 text-xs text-neutral-400">
              <li className="flex flex-col items-center gap-1">
                <HomeIcon className="w-6 h-6" />
                <span>Home</span>
              </li>
              <li className="flex flex-col items-center gap-1 text-neutral-900">
                <ShoppingCartIcon className="w-6 h-6" />
                <span className="font-semibold">Market</span>
              </li>
              <li className="flex flex-col items-center gap-1">
                <ChatBubbleLeftRightIcon className="w-6 h-6" />
                <span>Inbox</span>
              </li>
              <li className="flex flex-col items-center gap-1">
                <WalletIcon className="w-6 h-6" />
                <span>Wallet</span>
              </li>
              <li className="flex flex-col items-center gap-1">
                <UserIcon className="w-6 h-6" />
                <span>Profile</span>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
}

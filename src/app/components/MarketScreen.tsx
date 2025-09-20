"use client";

import { ReactNode } from "react";

type Item = {
  id: number | string;
  title?: string;
  imageUrl?: string;
  price?: number | string;
  // ...필요한 필드들
};

type MarketScreenProps = {
  title: string;                          // 페이지 상단 타이틀
  items: Item[];                          // 렌더링할 데이터
  pending?: boolean;
  error?: string | null;
  onReload?: () => void;
  /** 상단 우측에만 버튼 1개 추가하고 싶을 때 */
  extraTopButton?: ReactNode;
  /** 카드마다 버튼 1개씩 추가하고 싶을 때 */
  renderExtraItemButton?: (item: Item) => ReactNode;
};

export default function MarketScreen({
  title,
  items,
  pending,
  error,
  onReload,
  extraTopButton,
  renderExtraItemButton,
}: MarketScreenProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* 헤더 */}
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-lg font-semibold">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          {extraTopButton /* ← 필요하면 상단에 추가 버튼 표시 */}
        </div>
      </div>

      {/* 상태 */}
      {pending && <p className="text-sm text-slate-400">Bringing in…</p>}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm">
          {error}
          {onReload && (
            <button onClick={onReload} className="ml-2 underline">
              Try again
            </button>
          )}
        </div>
      )}

      {/* 그리드 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={String(item.id)}
            className="rounded-xl border border-white/10 bg-card/60 p-3"
          >
            {/* 이미지/타이틀/가격 등 기존 UI 그대로 */}
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-black/20" />
            <div className="mt-3">
              <h3 className="line-clamp-1 font-semibold">{item.title ?? "-"}</h3>
              <p className="text-xs text-slate-400">
                {item.price ? `${item.price} WON` : ""}
              </p>

              {/* 기존 액션들 옆에 추가 버튼 1개 */}
              <div className="mt-3 flex items-center gap-2">
                {/* 기존 버튼 예: 구매 */}
                <button className="rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/5">
                  Buy
                </button>

                {renderExtraItemButton?.(item)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type productType = "GiftCard" | "ElectronicDevice"


type Item = {
    id: number;
    title: string;
    productType: string;
    price: number;
    leftStock: number;
    createdAt: string;
    img: string;

}

const ITEMS: Item[] = [
    { id: 1, title: "Nintedo Switch 2", productType: "ElectronicDevice", price: 620000, leftStock: 5,  createdAt: "2025-08-12", img: "/nintendo.jpg" },
    { id: 2, title: "Starbucks Giftcard 20,000", productType: "GiftCard", price: 20000, leftStock: 10,  createdAt: "2025-08-12", img: "/starbucks2.jpg" },
    { id: 3, title: "Starbucks Giftcard 50,000", productType: "GiftCard", price: 50000, leftStock: 20,  createdAt: "2025-08-12", img: "/starbucks5.jpg" },
    { id: 4, title: "Oliveyoung Giftcard 50,000", productType: "GiftCard", price: 50000, leftStock: 10,  createdAt: "2025-08-12", img: "/oliveyoung5.jpg" },
    { id: 5, title: "Google Play Giftcard 50,000", productType: "GiftCard", price: 50000, leftStock: 18,  createdAt: "2025-08-12", img: "/googleplay.jpg" },
    { id: 6, title: "Google Play Giftcard 100,000", productType: "GiftCard", price: 100000, leftStock: 50,  createdAt: "2025-08-12", img: "/googleplay.jpg" },
    { id: 7, title: "Shinsegae Gift Certificate 50,000", productType: "GiftCard", price: 50000, leftStock: 24,  createdAt: "2025-08-12", img: "/shinsegae5.jpg" },
    { id: 8, title: "Shinsegae Gift Certificate 100,000", productType: "GiftCard", price: 100000, leftStock: 20,  createdAt: "2025-08-12", img: "/shinsegae10.jpg" },
]

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-400/10 px-2 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
      {children}
    </span>
  );
}

export default function Page() {
  const [sort, setSort] = useState<"recent" | "low">("recent");
  const [filter, setFilter] = useState<"all" | productType>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // 데모를 위해 90개처럼 보이게 만듦
  const dataset = useMemo(() => {
    const base = ITEMS;
    const repeated: Item[] = Array.from({ length: 2 })
      .flatMap((_, i) =>
        base.map((b) => ({
          ...b,
          id: i * base.length + b.id,
          title: i === 0 ? b.title : `${b.title} ${i}`,
          createdAt: new Date(new Date(b.createdAt).getTime() - i * 86400000).toISOString(),
        }))
      );
    return repeated.slice(0, 12);
  }, []);

  const filtered = useMemo(() => {
    let arr = dataset;
    if (filter !== "all") arr = arr.filter((i) => i.productType === filter);
    if (sort === "recent") arr = [...arr].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (sort === "low") arr = [...arr].sort((a, b) => a.price - b.price);
    return arr;
  }, [dataset, filter, sort]);

  const pageCount = Math.ceil(filtered.length / pageSize);
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">coupon Market Place</h1>

      {/* Filter bar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSort("recent")}
            className={`rounded-lg px-3 py-2 text-sm ring-1 transition ${
              sort === "recent"
                ? "bg-card text-white ring-emerald-400/50"
                : "text-slate-300 ring-white/10 hover:ring-white/20"
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setSort("low")}
            className={`rounded-lg px-3 py-2 text-sm ring-1 transition ${
              sort === "low"
                ? "bg-card text-white ring-emerald-400/50"
                : "text-slate-300 ring-white/10 hover:ring-white/20"
            }`}
          >
            Low to high
          </button>
        </div>

        <div className="ml-1 flex items-center gap-2">
          {(["all", "GiftCard", "ElectronicDevice"] as const).map((k) => (
            <button
              key={k}
              onClick={() => { setFilter(k); setPage(1); }}
              className={`rounded-lg px-3 py-2 text-sm ring-1 transition ${
                filter === k ? "bg-card text-white ring-emerald-400/50" : "text-slate-300 ring-white/10 hover:ring-white/20"
              }`}
            >
              {k === "all" ? "All" : k === "GiftCard" ? "GiftCard" : "ElectronicDevice"}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setView("grid")}
            aria-label="Grid view"
            className={`rounded-lg p-2 ring-1 transition ${view === "grid" ? "bg-card ring-emerald-400/50" : "ring-white/10 hover:ring-white/20"}`}
          >
            ◻︎◻︎
          </button>
          <button
            onClick={() => setView("list")}
            aria-label="List view"
            className={`rounded-lg p-2 ring-1 transition ${view === "list" ? "bg-card ring-emerald-400/50" : "ring-white/10 hover:ring-white/20"}`}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "grid" ? (
        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {current.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl bg-card shadow-soft ring-1 ring-white/10 overflow-hidden hover:ring-emerald-400/40 transition"
            >
              <div className={`h-44 grid place-items-center`}>
                <Image
                                    src={item.img}
                                    alt={item.title}
                                    width={120}
                                    height={120}
                                    className="h-40 w-[180px] object-contain"
                                    priority
                                  />
              </div>

              <div className="p-5">
                <h3 className="line-clamp-1 font-bold">{item.title}</h3>
                <p className="mt-1 text-xs text-slate-400">{item.productType}</p>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {item.productType}
                  </span>
                  <Badge>{item.price.toLocaleString("ko-KR")} WON</Badge>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="mt-6 space-y-3">
          {current.map((item) => (
            <article
              key={item.id}
              className="flex items-center gap-4 rounded-2xl bg-card p-3 ring-1 ring-white/10 hover:ring-emerald-400/40 transition"
            >
              <div className={`size-20 ${item.img} grid place-items-center rounded-xl shrink-0`}>
                <span className="text-3xl">🧩</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-1 font-semibold">{item.title}</h3>
                <p className="text-xs text-slate-400">{item.productType}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">{item.productType}</div>
                <div className="mt-1">
                  <Badge>{item.price} WON</Badge>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Footer / Pagination */}
      <div className="mt-8 flex items-center justify-between text-sm text-slate-400">
        <span>
          Results {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} out of {filtered.length}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg px-2 py-1 ring-1 ring-white/10 disabled:opacity-40"
            aria-label="Prev"
          >
            ‹
          </button>

          {Array.from({ length: pageCount }).slice(0, 5).map((_, i) => {
            const n = i + 1;
            return (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`rounded-lg px-2 py-1 ring-1 transition ${
                  page === n ? "bg-card ring-emerald-400/50" : "ring-white/10 hover:ring-white/20"
                }`}
              >
                {n}
              </button>
            );
          })}
          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
            className="rounded-lg px-2 py-1 ring-1 ring-white/10 disabled:opacity-40"
            aria-label="Next"
          >
            ›
          </button>
        </div>
      </div>
    </main>
  );
}

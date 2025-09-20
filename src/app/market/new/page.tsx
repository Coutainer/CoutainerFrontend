"use client";

import { useState } from "react";

type Scope = "COUPON_ISSUANCE" | "ETC";

export default function NewPermitPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [scope, setScope] = useState<Scope>("COUPON_ISSUANCE");
  const [limit, setLimit] = useState<string>("");
  const [faceValue, setFaceValue] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [expiryLocal, setExpiryLocal] = useState<string>(""); // datetime-local 값 (로컬)

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function toIsoZulu(local: string) {
    // "YYYY-MM-DDTHH:mm" 형태를 받아 UTC ISO(Z)로 변환
    // 예: 2024-12-31T23:59 -> 2024-12-31T14:59:00.000Z (KST 기준)
    const d = new Date(local);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!title.trim()) throw new Error("title을 입력하세요.");
      if (!description.trim()) throw new Error("description을 입력하세요.");
      if (!imageUrl.trim()) throw new Error("imageUrl을 입력하세요.");
      if (!limit.trim() || Number.isNaN(Number(limit))) throw new Error("limit는 숫자 형태여야 합니다.");
      if (!faceValue.trim() || Number.isNaN(Number(faceValue))) throw new Error("faceValue는 숫자 형태여야 합니다.");
      if (!price.trim() || Number.isNaN(Number(price))) throw new Error("price는 숫자 형태여야 합니다.");
      if (!expiryLocal) throw new Error("유효기간(expiry)을 선택하세요.");

      const expiry = toIsoZulu(expiryLocal);
      if (!expiry) throw new Error("유효한 expiry 값을 입력하세요.");

      // ✅ Next API 경유: 쿠키에서 token을 읽어 백엔드에 auth 헤더로 전달
      const res = await fetch("/api/permit/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          title,
          description,
          imageUrl,
          scope,
          limit,
          faceValue,
          price,
          expiry, // 예: "2024-12-31T23:59:59Z" 형태 (toISOString 결과)
        }),
      });

      if (!res.ok) {
        let msg = `등록 실패 (${res.status})`;
        try {
          const j = await res.json();
          if (j?.error) msg += ` ${j.error}`;
          else if (j?.message) msg += ` ${j.message}`;
        } catch {
          const t = await res.text().catch(() => "");
          if (t) msg += ` ${t}`;
        }
        throw new Error(msg);
      }

      setDone(true);
      // 필요 시 상위 창에 알림
      try {
        window.opener?.postMessage({ type: "PERMIT_CREATED" }, "*");
      } catch {}
      // 일정 시간 후 닫기 (팝업일 때)
      // setTimeout(() => window.close(), 800);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-8">
      <h1 className="mb-6 text-xl font-bold">새 아이템 등록</h1>

      {done ? (
        <div className="rounded-md bg-emerald-500/10 p-3 text-emerald-300">
          등록 완료!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-sm mb-1">Title</span>
            <input
              className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="스타벅스 아메리카노 쿠폰"
              required
            />
          </label>

          <label className="block">
            <span className="block text-sm mb-1">Description</span>
            <textarea
              className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="스타벅스 아메리카노 1잔 무료"
              rows={3}
              required
            />
          </label>

          <label className="block">
            <span className="block text-sm mb-1">Image URL</span>
            <input
              className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              required
            />
          </label>

          <label className="block">
            <span className="block text-sm mb-1">Scope</span>
            <select
              className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
              value={scope}
              onChange={(e) => setScope(e.target.value as Scope)}
            >
              <option value="COUPON_ISSUANCE">COUPON_ISSUANCE</option>
              <option value="ETC">ETC</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm mb-1">Limit</span>
              <input
                type="number"
                min={0}
                className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="1000"
                required
              />
            </label>

            <label className="block">
              <span className="block text-sm mb-1">Face Value</span>
              <input
                type="number"
                min={0}
                className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                value={faceValue}
                onChange={(e) => setFaceValue(e.target.value)}
                placeholder="1000"
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-sm mb-1">Price (원)</span>
            <input
              type="number"
              min={0}
              className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="10000"
              required
            />
          </label>

          <label className="block">
            <span className="block text-sm mb-1">Expiry (유효기간)</span>
            <input
              type="datetime-local"
              className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
              value={expiryLocal}
              onChange={(e) => setExpiryLocal(e.target.value)}
              // 예시로 기본값을 오늘 + 30일 23:59로 하고 싶다면 마운트 시 set으로 처리
              required
            />
            <p className="mt-1 text-xs text-slate-400">
              제출 시 UTC ISO(Z)로 변환됩니다.
            </p>
          </label>

          {error && (
            <div className="rounded-md bg-rose-500/10 p-3 text-rose-300">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Create Item"}
            </button>
            <button
              type="button"
              onClick={() => window.close()}
              className="rounded-lg border border-white/20 px-4 py-2 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

// app/_components/PointChargeButton.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function PointChargeButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (!pending) {
      setOpen(false);
      setAmount("");
      setError(null);
    }
  };

  async function submit() {
    setError(null);
    const n = Number(amount);
    if (!amount.trim() || !Number.isFinite(n) || n <= 0) {
      setError("올바른 금액을 입력하세요.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/point/charge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: String(Math.floor(n)) }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `HTTP ${res.status}`);
        }
        // 성공: 프로필/포인트 갱신
        close();
        router.refresh();
      } catch (e: any) {
        setError(e?.message || "요청 실패");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-indigo-500/30 hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70"
        aria-label="포인트 충전"
        title="포인트 충전"
      >
        포인트 충전
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl ring-1 ring-gray-200">
            <h3 className="text-base font-semibold text-gray-900">포인트 충전</h3>
            <p className="mt-1 text-sm text-gray-600">충전할 금액을 입력하세요.</p>

            <div className="mt-4">
              <label className="block text-sm text-gray-700 mb-1">금액 (원)</label>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="예: 10000"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-800 ring-1 ring-gray-200 hover:bg-gray-50"
                disabled={pending}
              >
                취소
              </button>
              <button
                type="button"
                onClick={submit}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-indigo-500/30 hover:bg-indigo-700 disabled:opacity-60"
                disabled={pending}
              >
                {pending ? "처리중..." : "확인"}
              </button>
            </div>

            <p className="mt-3 text-[11px] text-gray-500">
              결제 사유는 <span className="font-medium">"포인트 충전"</span> 으로 전송됩니다.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

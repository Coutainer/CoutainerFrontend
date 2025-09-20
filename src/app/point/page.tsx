"use client";
import { useState } from "react";
import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";
import { usePointBalance } from "@/lib/hooks";

async function chargeFetcher(url: string, { arg }: { arg: { amount: number } }) {
  const res = await fetch(`/api/backend/${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function PointPage() {
  const { data, mutate } = usePointBalance();
  const [amount, setAmount] = useState(1000);

  const { trigger, isMutating, error } = useSWRMutation("point/charge", chargeFetcher);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await trigger({ amount: Number(amount) });
    await mutate(); // 잔액 갱신
  };

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-xl font-semibold">포인트</h1>
      <div className="rounded-xl border p-4">
        현재 잔액: <b>{(data?.balance ?? 0).toLocaleString()} P</b>
      </div>

      <form onSubmit={onSubmit} className="rounded-xl border p-4 space-y-3">
        <label className="block text-sm">충전 금액</label>
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full rounded-lg border px-3 py-2"
        />
        <button
          type="submit"
          disabled={isMutating}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {isMutating ? "처리중..." : "충전"}
        </button>
        {error && <p className="text-sm text-red-600">에러: {String(error)}</p>}
      </form>
    </main>
  );
}

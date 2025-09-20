"use client";
import { useMyCryptoObjects, useWalletBalance } from "@/lib/hooks";

export default function WalletPage() {
  const { data: bal } = useWalletBalance();
  const { data: list } = useMyCryptoObjects();

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-xl font-semibold">지갑</h1>
      <div className="rounded-xl border p-4">
        SUI 잔액: <b>{bal?.balance ?? "0"}</b>
      </div>
      <div className="rounded-xl border p-4">
        <div className="mb-2 font-medium">내 오브젝트</div>
        <ul className="space-y-2">
          {(list?.items ?? []).map((it, i) => (
            <li key={i} className="rounded-lg border px-3 py-2 text-sm">
              {JSON.stringify(it)}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

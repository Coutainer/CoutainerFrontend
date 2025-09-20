'use client';

import { usePointBalance, useWalletBalance } from "@/lib/hooks";
//import { LogoutButton } from "@/components/logout-button";

export default function Dashboard() {
  const { data: pb, isLoading: l1, error: e1 } = usePointBalance();
  const { data: wb, isLoading: l2, error: e2 } = useWalletBalance();

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">대시보드</h1>
        {/*<LogoutButton />*/}
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="포인트 잔액" value={l1 ? "..." : e1 ? "오류" : (pb?.balance ?? 0).toLocaleString()+" P"} />
        <Card title="SUI 잔액" value={l2 ? "..." : e2 ? "오류" : (wb?.balance ?? "0")} />
      </section>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

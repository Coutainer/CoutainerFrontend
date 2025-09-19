"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_IP!;

export default function PointBalancePage() {
  const [baseUrl, setBaseUrl] = useState(API_BASE);
  const [jwt, setJwt] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<number | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 처음 진입 시 저장된 토큰/URL 복원
  useEffect(() => {
    const savedJwt = localStorage.getItem("apitest.jwt");
    const savedBase = localStorage.getItem("apitest.base");
    if (savedJwt) setJwt(savedJwt);
    if (savedBase) setBaseUrl(savedBase);
  }, []);

  // 변경 시 자동 저장
  useEffect(() => {
    localStorage.setItem("apitest.jwt", jwt ?? "");
  }, [jwt]);
  useEffect(() => {
    localStorage.setItem("apitest.base", baseUrl ?? "");
  }, [baseUrl]);

  const curl = useMemo(() => {
    const url = `${baseUrl}/point/balance`;
    return [
      "curl -i",
      `-H "Authorization: Bearer ${jwt || "<YOUR_JWT>"}"`,
      `"${url}"`
    ].join(" ");
  }, [baseUrl, jwt]);

  const onRequest = async () => {
    setLoading(true);
    setStatus(null);
    setResult(null);
    setError(null);

    try {
      const url = `${baseUrl}/point/balance`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });

      setStatus(res.status);

      // 응답이 JSON이 아닐 수도 있으니 안전 처리
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        setResult(json);
      } catch {
        setResult({ raw: text });
      }

      if (!res.ok) {
        setError(`HTTP ${res.status} - 요청이 실패했습니다.`);
      }
    } catch (e: any) {
      setError(e?.message ?? "요청 중 알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">/point/balance 테스트</h1>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <label className="text-sm text-slate-300">
          Backend Base URL
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400/50"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="예) http://localhost:1234/server-api"
          />
        </label>

        <label className="text-sm text-slate-300">
          JWT (Authorization: Bearer &lt;token&gt;)
          <textarea
            className="mt-1 h-28 w-full resize-y rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400/50"
            value={jwt}
            onChange={(e) => setJwt(e.target.value)}
            placeholder="여기에 JWT를 붙여넣으세요"
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            onClick={onRequest}
            disabled={loading || !jwt || !baseUrl}
            className="rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "요청 중..." : "잔액 조회 (GET /point.balance)"}
          </button>

          {status !== null && (
            <span className="text-xs text-slate-400">HTTP {status}</span>
          )}
        </div>
      </div>

      <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-sm font-semibold text-slate-200">cURL</div>
        <pre className="overflow-auto rounded-lg bg-black/60 p-3 text-xs leading-relaxed">
            {curl}  
        </pre>
      </div>

      <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-sm font-semibold text-slate-200">Response</div>
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}
        <pre className="overflow-auto rounded-lg bg-black/60 p-3 text-xs leading-relaxed">
            {result ? JSON.stringify(result, null, 2) : "// 아직 응답이 없습니다."}
        </pre>
      </div>
    </div>
  );
}

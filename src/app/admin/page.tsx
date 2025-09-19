"use client";
import React, { useCallback, useMemo, useState } from "react";

/**
 * Admin API Console
 * - Each API is a collapsible (accordion-like) panel
 * - Panels are implemented as small, isolated components
 * - Uses TailwindCSS only (no external UI lib)
 * - Reads backend base URL from NEXT_PUBLIC_BACKEND_IP
 *
 * Drop this file into: app/admin/page.tsx
 * Requires Tailwind to be set up in your project.
 */

export default function AdminPage() {
  const [jwt, setJwt] = useState("");
  const baseUrlFromEnv = process.env.NEXT_PUBLIC_BACKEND_IP;

  const baseUrl = useMemo(() => {
    if (!baseUrlFromEnv) return "";
    return baseUrlFromEnv.replace(/\/$/, "");
  }, [baseUrlFromEnv]);

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin API Console</h1>
          <p className="text-sm text-muted-foreground">
            Base URL: {baseUrl || <span className="text-red-500">(missing NEXT_PUBLIC_BACKEND_IP)</span>}
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-white/10 bg-card/30 p-4 shadow">
        <h2 className="mb-3 text-base font-semibold">Auth</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={jwt}
            onChange={(e) => setJwt(e.target.value)}
            placeholder="Paste your JWT (Bearer token)"
            className="w-full rounded-xl border border-white/10 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          />
          <button
            onClick={() => navigator.clipboard.readText().then((t) => setJwt(t)).catch(() => {})}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:border-white/20"
          >
            Paste
          </button>
        </div>
      </section>

      <Accordion>
        <AccordionItem title="Point · Get Balance (GET /point/balance)" defaultOpen={false}>
          <PointBalancePanel baseUrl={baseUrl} jwt={jwt} />
        </AccordionItem>

        <AccordionItem title="Point · Charge (POST /point/charge)" defaultOpen={false}>
          <PointChargePanel baseUrl={baseUrl} jwt={jwt} />
        </AccordionItem>

        <AccordionItem title="Custom · Any Endpoint" defaultOpen={false}>
          <GenericCaller baseUrl={baseUrl} jwt={jwt} />
        </AccordionItem>
      </Accordion>

      <footer className="pt-4 text-xs text-muted-foreground">
        Tip: 이 페이지는 클라이언트에서 직접 API를 호출합니다. CORS 설정이 백엔드에 필요할 수 있어요.
      </footer>
    </main>
  );
}

/**
 * Simple Accordion primitives
 */
function Accordion({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3">{children}</div>;
}

function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [height, setHeight] = useState<string | number>(defaultOpen ? "auto" : 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const toggle = () => {
    const el = contentRef.current;
    if (!el) return;

    setIsAnimating(true);
    if (open) {
      // CLOSE: set fixed height first, then animate to 0
      const current = el.scrollHeight;
      setHeight(current);
      requestAnimationFrame(() => setHeight(0));
      setOpen(false);
    } else {
      // OPEN: from 0 to scrollHeight, then to auto
      setHeight(0);
      setOpen(true);
      requestAnimationFrame(() => {
        const target = el.scrollHeight;
        setHeight(target);
      });
    }
  };

  const onTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== "height") return;
    setIsAnimating(false);
    if (open) {
      // allow content growth without reflow during open state
      setHeight("auto");
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-card/40 shadow">
      <button
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 p-4 text-left hover:bg-white/5"
      >
        <span className="font-medium">{title}</span>
        <span className={`transition-transform ${open ? "rotate-180" : "rotate-0"}`}>▼</span>
      </button>

      <div
        className="overflow-hidden transition-[height] duration-300 ease-out"
        style={{ height }}
        onTransitionEnd={onTransitionEnd}
      >
        <div ref={contentRef} className={`${open ? "border-t border-white/10" : ""}`}>
          <div className={`p-4 ${isAnimating ? "will-change-auto" : ""}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Utilities
 */
function normalizeUrl(baseUrl: string, path: string) {
  const cleanBase = (baseUrl || "").replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");
  return `${cleanBase}/${cleanPath}`;
}

async function safeFetch(url: string, init: RequestInit) {
  let status = 0;
  let body: any = null;
  let error: string | null = null;
  try {
    const res = await fetch(url, init);
    status = res.status;
    const text = await res.text();
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    if (!res.ok) {
      error = `HTTP ${res.status}`;
    }
  } catch (e: any) {
    error = e?.message || "Network error";
  }
  return { status, body, error };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm sm:grid-cols-3 sm:items-center">
      <span className="text-muted-foreground">{label}</span>
      <div className="sm:col-span-2">{children}</div>
    </label>
  );
}

function ResponseBox({ data }: { data: any }) {
  return (
    <pre className="mt-3 max-h-80 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-xs">
      {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
    </pre>
  );
}

function RequireBaseUrl({ baseUrl }: { baseUrl: string }) {
  if (!baseUrl) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
        환경 변수 <code className="px-1">NEXT_PUBLIC_BACKEND_IP</code> 가 설정되어 있지 않습니다.
      </div>
    );
  }
  return null;
}

/**
 * Panel: GET /point/balance
 */
function PointBalancePanel({ baseUrl, jwt }: { baseUrl: string; jwt: string }) {
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<any>(null);

  const onFetch = useCallback(async () => {
    if (!baseUrl) return;
    setLoading(true);
    const url = normalizeUrl(baseUrl, "/point/balance");
    const result = await safeFetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      },
    });
    setResp(result);
    setLoading(false);
  }, [baseUrl, jwt]);

  return (
    <div className="space-y-3">
      <RequireBaseUrl baseUrl={baseUrl} />
      <div className="flex items-center gap-2">
        <button
          onClick={onFetch}
          disabled={!baseUrl || loading}
          className="rounded-xl bg-emerald-500/90 px-3 py-2 text-sm font-medium text-white shadow disabled:opacity-50"
        >
          {loading ? "Loading..." : "Fetch Balance"}
        </button>
        <small className="text-muted-foreground">GET /point/balance</small>
      </div>
      {resp && <ResponseBox data={resp} />}
    </div>
  );
}

/**
 * Panel: POST /point/charge { amount }
 */
function PointChargePanel({ baseUrl, jwt }: { baseUrl: string; jwt: string }) {
  const [amount, setAmount] = useState<number | "">("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<any>(null);

  const onCharge = useCallback(async () => {
    if (!baseUrl) return;
    setLoading(true);
    const url = normalizeUrl(baseUrl, "/point/charge");
    const payload: any = { amount: Number(amount) };
    if (memo.trim()) payload.memo = memo.trim();

    const result = await safeFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    setResp(result);
    setLoading(false);
  }, [amount, baseUrl, jwt, memo]);

  return (
    <div className="space-y-3">
      <RequireBaseUrl baseUrl={baseUrl} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Amount">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="e.g. 5000"
            className="w-full rounded-xl border border-white/10 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          />
        </Field>
        <Field label="Memo (optional)">
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Reason or note"
            className="w-full rounded-xl border border-white/10 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          />
        </Field>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onCharge}
          disabled={!baseUrl || amount === "" || Number(amount) <= 0 || loading}
          className="rounded-xl bg-emerald-500/90 px-3 py-2 text-sm font-medium text-white shadow disabled:opacity-50"
        >
          {loading ? "Charging..." : "Charge Points"}
        </button>
        <small className="text-muted-foreground">POST /point/charge</small>
      </div>

      {resp && <ResponseBox data={resp} />}
    </div>
  );
}

/**
 * Generic caller for arbitrary endpoints
 */
function GenericCaller({ baseUrl, jwt }: { baseUrl: string; jwt: string }) {
  const [method, setMethod] = useState<"GET" | "POST" | "PUT" | "PATCH" | "DELETE">("GET");
  const [path, setPath] = useState("/health");
  const [bodyText, setBodyText] = useState("{\n  \"example\": true\n}");
  const [resp, setResp] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const onSend = useCallback(async () => {
    if (!baseUrl) return;
    setLoading(true);
    const url = normalizeUrl(baseUrl, path);

    const hasBody = method !== "GET";
    const result = await safeFetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      },
      ...(hasBody ? { body: bodyText } : {}),
    });

    setResp(result);
    setLoading(false);
  }, [baseUrl, bodyText, jwt, method, path]);

  return (
    <div className="space-y-3">
      <RequireBaseUrl baseUrl={baseUrl} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Method">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            className="w-full rounded-xl border border-white/10 bg-background px-3 py-2 text-sm"
          >
            {(["GET", "POST", "PUT", "PATCH", "DELETE"] as const).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Path">
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/point/balance"
            className="w-full rounded-xl border border-white/10 bg-background px-3 py-2 text-sm"
          />
        </Field>
        <div className="self-end justify-self-end">
          <button
            onClick={onSend}
            disabled={!baseUrl || loading}
            className="w-full rounded-xl bg-emerald-500/90 px-3 py-2 text-sm font-medium text-white shadow disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      {method !== "GET" && (
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Body (JSON)</label>
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            rows={8}
            className="w-full rounded-xl border border-white/10 bg-background p-3 text-xs font-mono"
          />
        </div>
      )}

      {resp && <ResponseBox data={resp} />}
    </div>
  );
}

"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// --- Types ---------------------------------------------------------------

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

type Pair = { id: string; key: string; value: string };

type SavedRequest = {
  id: string;
  name: string;
  baseUrl: string;
  path: string;
  method: HttpMethod;
  query: Pair[];
  headers: Pair[];
  body: string;
  createdAt: number;
};

type ResponseView = {
  status?: number;
  ok?: boolean;
  durationMs?: number;
  sizeBytes?: number;
  headers?: [string, string][];
  rawText?: string;
  json?: any;
  error?: string;
};

// --- Utilities -----------------------------------------------------------

const uid = () => Math.random().toString(36).slice(2, 9);

const toRecord = (pairs: Pair[]) =>
  pairs
    .filter((p) => p.key.trim().length)
    .reduce<Record<string, string>>((acc, cur) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});

const fromRecord = (rec: Record<string, string>): Pair[] =>
  Object.entries(rec).map(([key, value]) => ({ id: uid(), key, value }));

const prettyJSON = (txt: string) => {
  try {
    return JSON.stringify(JSON.parse(txt), null, 2);
  } catch {
    return txt; // not JSON
  }
};

const buildQueryString = (pairs: Pair[]) => {
  const params = new URLSearchParams();
  pairs.forEach((p) => {
    if (p.key) params.append(p.key, p.value ?? "");
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

const calcSizeBytes = (text: string | undefined) => (text ? new Blob([text]).size : 0);

const buildCurl = (
  url: string,
  method: HttpMethod,
  headers: Record<string, string>,
  body?: string
) => {
  const parts = ["curl", "-X", method, JSON.stringify(url)];
  Object.entries(headers).forEach(([k, v]) => {
    parts.push("-H", JSON.stringify(`${k}: ${v}`));
  });
  if (body && ["POST", "PUT", "PATCH"].includes(method)) {
    parts.push("--data", JSON.stringify(body));
  }
  return parts.join(" ");
};

const LOCAL_KEY = {
  HISTORY: "apiTester.history.v1",
  BASE_URL: "apiTester.baseUrl",
  TOKEN: "apiTester.token",
};

// --- Small UI bits -------------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm text-slate-400">{children}</label>;
}

function KeyValueEditor({
  title,
  items,
  onChange,
  placeholderKey = "key",
  placeholderValue = "value",
}: {
  title: string;
  items: Pair[];
  onChange: (next: Pair[]) => void;
  placeholderKey?: string;
  placeholderValue?: string;
}) {
  const add = () => onChange([...items, { id: uid(), key: "", value: "" }]);
  const del = (id: string) => onChange(items.filter((x) => x.id !== id));
  const upd = (id: string, patch: Partial<Pair>) =>
    onChange(items.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <FieldLabel>{title}</FieldLabel>
        <button onClick={add} className="text-xs text-emerald-400 hover:underline">+ Add</button>
      </div>
      <div className="rounded-xl border border-white/10 divide-y divide-white/10 overflow-hidden">
        {items.length === 0 && (
          <div className="p-3 text-sm text-slate-400">No items. Click “Add”.</div>
        )}
        {items.map((row) => (
          <div key={row.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 p-2">
            <input
              className="w-full rounded-lg bg-slate-900/60 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-emerald-400/50"
              placeholder={placeholderKey}
              value={row.key}
              onChange={(e) => upd(row.id, { key: e.target.value })}
            />
            <input
              className="w-full rounded-lg bg-slate-900/60 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-emerald-400/50"
              placeholder={placeholderValue}
              value={row.value}
              onChange={(e) => upd(row.id, { value: e.target.value })}
            />
            <button
              onClick={() => del(row.id)}
              className="text-xs rounded-md px-2 py-2 bg-red-500/10 text-red-300 hover:bg-red-500/20"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Page -----------------------------------------------------------

export default function ApiTesterPage() {
  // persisted
  const [baseUrl, setBaseUrl] = useState<string>("http://localhost:5000");
  const [token, setToken] = useState<string>("");
  const [history, setHistory] = useState<SavedRequest[]>([]);

  // request form
  const [path, setPath] = useState<string>("/server-api/health");
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [query, setQuery] = useState<Pair[]>([]);
  const [headers, setHeaders] = useState<Pair[]>([]);
  const [body, setBody] = useState<string>("{\n  \"example\": true\n}");

  // response
  const [resp, setResp] = useState<ResponseView>({});
  const [activeTab, setActiveTab] = useState<"json" | "raw" | "headers">("json");
  const [isLoading, setIsLoading] = useState(false);

  // load persisted
  useEffect(() => {
    const b = localStorage.getItem(LOCAL_KEY.BASE_URL);
    if (b) setBaseUrl(b);
    const t = localStorage.getItem(LOCAL_KEY.TOKEN);
    if (t) setToken(t);
    const h = localStorage.getItem(LOCAL_KEY.HISTORY);
    if (h) setHistory(JSON.parse(h));
  }, []);

  useEffect(() => localStorage.setItem(LOCAL_KEY.BASE_URL, baseUrl), [baseUrl]);
  useEffect(() => localStorage.setItem(LOCAL_KEY.TOKEN, token), [token]);
  useEffect(() => localStorage.setItem(LOCAL_KEY.HISTORY, JSON.stringify(history)), [history]);

  const url = useMemo(() => {
    const cleanedPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl.replace(/\/$/, "")}${cleanedPath}${buildQueryString(query)}`;
  }, [baseUrl, path, query]);

  const headerRecord = useMemo(() => {
    const rec = toRecord(headers);
    if (token) rec["Authorization"] = `Bearer ${token}`;
    if (["POST", "PUT", "PATCH"].includes(method) && !rec["Content-Type"]) {
      rec["Content-Type"] = "application/json";
    }
    return rec;
  }, [headers, method, token]);

  const curl = useMemo(() => buildCurl(url, method, headerRecord, body), [url, method, headerRecord, body]);

  const send = useCallback(async () => {
    setIsLoading(true);
    setResp({});
    const init: RequestInit = {
      method,
      headers: headerRecord,
    };
    if (["POST", "PUT", "PATCH"].includes(method)) {
      init.body = body;
    }
    const start = performance.now();
    try {
      const r = await fetch(url, init);
      const durationMs = Math.round(performance.now() - start);
      const text = await r.text();
      const sizeBytes = calcSizeBytes(text);
      let json: any | undefined;
      try {
        json = JSON.parse(text);
      } catch {}
      const headersArr: [string, string][] = [];
      r.headers.forEach((v, k) => headersArr.push([k, v]));
      setResp({
        status: r.status,
        ok: r.ok,
        durationMs,
        sizeBytes,
        headers: headersArr,
        rawText: text,
        json,
      });
      // save history
      const item: SavedRequest = {
        id: uid(),
        name: `${method} ${path}`,
        baseUrl,
        path,
        method,
        query,
        headers,
        body,
        createdAt: Date.now(),
      };
      setHistory((prev) => [item, ...prev].slice(0, 30));
    } catch (e: any) {
      const durationMs = Math.round(performance.now() - start);
      setResp({ error: e?.message || "Request failed", durationMs });
    } finally {
      setIsLoading(false);
    }
  }, [url, method, headerRecord, body, path, baseUrl, query, headers]);

  const loadFromHistory = (item: SavedRequest) => {
    setBaseUrl(item.baseUrl);
    setPath(item.path);
    setMethod(item.method);
    setQuery(item.query);
    setHeaders(item.headers);
    setBody(item.body);
  };

  const clearHistory = () => setHistory([]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">API Admin Tester</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={send}
              disabled={isLoading}
              className="rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-medium text-slate-950 shadow hover:bg-emerald-400 disabled:opacity-50"
            >
              {isLoading ? "Sending…" : "Send"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left column: global & history */}
          <aside className="space-y-6">
            <section className="space-y-2">
              <FieldLabel>Base URL</FieldLabel>
              <input
                className="w-full rounded-xl bg-slate-900/60 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-emerald-400/50"
                placeholder="http://localhost:5000"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
              <p className="text-xs text-slate-400">
                This will prefix every request. Example: <span className="text-slate-200">http://localhost:5000</span>
              </p>
            </section>

            <section className="space-y-2">
              <FieldLabel>Auth Token (optional)</FieldLabel>
              <input
                className="w-full rounded-xl bg-slate-900/60 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-emerald-400/50"
                placeholder="Paste JWT / API key"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <p className="text-xs text-slate-400">Will be sent as <code>Authorization: Bearer &lt;token&gt;</code>.</p>
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <FieldLabel>History</FieldLabel>
                <button onClick={clearHistory} className="text-xs text-slate-400 hover:underline">Clear</button>
              </div>
              <div className="max-h-[320px] overflow-auto rounded-xl border border-white/10 divide-y divide-white/10">
                {history.length === 0 && (
                  <div className="p-3 text-sm text-slate-400">No history yet. Make a request.</div>
                )}
                {history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => loadFromHistory(h)}
                    className="w-full text-left p-3 hover:bg-white/5"
                    title={new Date(h.createdAt).toLocaleString()}
                  >
                    <div className="text-[13px] font-medium text-emerald-300">{h.method}</div>
                    <div className="truncate text-sm text-slate-200">{h.path}</div>
                    <div className="text-xs text-slate-500">{h.baseUrl}</div>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          {/* Right column: request + response */}
          <main className="space-y-6">
            {/* Request builder */}
            <section className="rounded-2xl border border-white/10 p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[130px_1fr]">
                <div>
                  <FieldLabel>Method</FieldLabel>
                  <select
                    className="mt-1 w-full rounded-xl bg-slate-900/60 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-emerald-400/50"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as HttpMethod)}
                  >
                    {(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as HttpMethod[]).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Path</FieldLabel>
                  <input
                    className="mt-1 w-full rounded-xl bg-slate-900/60 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-emerald-400/50"
                    placeholder="/server-api/health"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <KeyValueEditor title="Query Params" items={query} onChange={setQuery} />
                <KeyValueEditor title="Headers" items={headers} onChange={setHeaders} />
              </div>

              {(["POST", "PUT", "PATCH"] as HttpMethod[]).includes(method) && (
                <div className="mt-4 space-y-2">
                  <FieldLabel>Body (JSON or raw)</FieldLabel>
                  <textarea
                    className="h-40 w-full rounded-xl bg-slate-900/60 px-3 py-2 text-sm font-mono outline-none ring-1 ring-white/10 focus:ring-emerald-400/50"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                  <div className="flex gap-2 text-xs text-slate-400">
                    <button
                      type="button"
                      onClick={() => setBody(prettyJSON(body))}
                      className="rounded-md bg-white/5 px-2 py-1 hover:bg-white/10"
                    >
                      Prettify JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => setBody("{}")}
                      className="rounded-md bg-white/5 px-2 py-1 hover:bg-white/10"
                    >
                      Empty JSON
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <FieldLabel>Full URL</FieldLabel>
                <div className="rounded-xl bg-slate-900/60 px-3 py-2 text-sm font-mono ring-1 ring-white/10">
                  <div className="truncate" title={url}>{url}</div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <FieldLabel>cURL</FieldLabel>
                <div className="rounded-xl bg-slate-900/60 p-3 text-xs font-mono ring-1 ring-white/10">
                  <pre className="whitespace-pre-wrap break-words text-slate-300">{curl}</pre>
                </div>
              </div>
            </section>

            {/* Response viewer */}
            <section className="rounded-2xl border border-white/10">
              <div className="flex items-center justify-between border-b border-white/10 p-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">Response</span>
                  {typeof resp.status === "number" && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        resp.ok ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {resp.status}
                    </span>
                  )}
                  {typeof resp.durationMs === "number" && (
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-300">
                      {resp.durationMs} ms
                    </span>
                  )}
                  {typeof resp.sizeBytes === "number" && (
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-300">
                      {resp.sizeBytes} bytes
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("json")}
                    className={`rounded-md px-2 py-1 text-xs ${
                      activeTab === "json" ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => setActiveTab("raw")}
                    className={`rounded-md px-2 py-1 text-xs ${
                      activeTab === "raw" ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    Raw
                  </button>
                  <button
                    onClick={() => setActiveTab("headers")}
                    className={`rounded-md px-2 py-1 text-xs ${
                      activeTab === "headers" ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    Headers
                  </button>
                </div>
              </div>

              <div className="p-3">
                {!resp.status && !resp.error && (
                  <div className="text-sm text-slate-400">Send a request to see the response here.</div>
                )}
                {resp.error && (
                  <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{resp.error}</div>
                )}

                {activeTab === "json" && resp.json && (
                  <pre className="max-h-[460px] overflow-auto whitespace-pre text-sm text-slate-200">{JSON.stringify(resp.json, null, 2)}</pre>
                )}
                {activeTab === "json" && !resp.json && resp.rawText && (
                  <div className="text-sm text-slate-400">Response is not valid JSON. Switch to Raw.</div>
                )}

                {activeTab === "raw" && resp.rawText && (
                  <pre className="max-h-[460px] overflow-auto whitespace-pre-wrap break-words text-sm text-slate-200">{resp.rawText}</pre>
                )}

                {activeTab === "headers" && resp.headers && (
                  <div className="max-h-[460px] overflow-auto text-sm">
                    <table className="w-full table-auto border-collapse">
                      <tbody>
                        {resp.headers.map(([k, v]) => (
                          <tr key={k} className="border-b border-white/10">
                            <td className="py-1 pr-3 font-medium text-slate-300">{k}</td>
                            <td className="py-1 text-slate-400">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            <p className="text-xs text-slate-500">
              Tip: If you call your backend from <span className="font-mono">http://localhost:3000</span> and it runs on
              another origin (e.g. <span className="font-mono">http://localhost:5000</span>), make sure your server sends
              <span className="font-mono"> Access-Control-Allow-Origin</span> headers for CORS.
            </p>
          </main>
        </div>
      </div>
    </div>
  );
}

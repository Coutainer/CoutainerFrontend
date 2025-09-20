"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TicketIcon, ShoppingBagIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import * as QRCode from "qrcode"; // ⬅️ 추가

type RawCoupon = {
  id: number;
  objectId: string;
  title: string;
  description: string;
  imageUrl: string;
  faceValue: string;
  remaining: string;
  tradeCount: number;
  state: string;
  expiresAt: string;
  issuedAt: string;
  usedAt: string | null;
  supplierId: number;
  issuerId: number;
};

type RedemptionResp = {
  token: string;
  expiresAt: string;
  object: { id: number; objectId: string; title: string; remaining: string };
};

function toLocalMarketPath(raw?: string | null, baseDir = "/market") {
  if (!raw) return null;

  let last = String(raw).trim();

  // URL이면 pathname만 취득
  try {
    const u = new URL(last);
    last = u.pathname;
  } catch {
    // URL이 아니면 그대로 진행
  }

  // 파일명만 추출 (쿼리/해시 제거)
  const file = last.split("/").pop()?.split("?")[0].split("#")[0] ?? "";

  // 파일명 화이트리스트 (보안/오타 방지)
  const safe = /^[a-zA-Z0-9._-]+$/.test(file) ? file : "";
  if (!safe) return null;

  // 이미지 확장자만 허용
  if (!/\.(png|jpe?g|webp|gif|svg)$/i.test(safe)) return null;

  // public/market/파일명
  return `${baseDir}/${safe}`;
}

export default function CouponPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const shellBg = "#0B4661";

  const oid = sp.get("oid") || "";
  const cid = sp.get("cid") ? Number(sp.get("cid")) : NaN;

  const [item, setItem] = useState<RawCoupon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<boolean>(true);

  // 판매 모달
  const [sellOpen, setSellOpen] = useState(false);
  const [price, setPrice] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState<string | null>(null);

  // ✅ 사용(리뎀션) 모달 & QR
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemPending, setRedeemPending] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemData, setRedeemData] = useState<RedemptionResp | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        setPending(true);
        setError(null);

        if (!oid && (!sp.get("cid") || Number.isNaN(cid))) {
          throw new Error("Invalid access, no coupon identifier.");
        }

        const res = await fetch("/api/my-caps", { method: "GET", cache: "no-store" });
        if (res.status === 401) {
          setError("require Login.");
          setPending(false);
          return;
        }
        if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);

        const payload = await res.json();
        const rows = coerceToCoupons(payload);

        const found =
          (oid && rows.find((r) => r.objectId === oid)) ||
          (!Number.isNaN(cid) && rows.find((r) => r.id === cid)) ||
          null;

        if (!found) throw new Error("The coupon was not found.");
        setItem(found);
      } catch (e: any) {
        setError(e?.message ?? "Failed to retrieve coupon information.");
      } finally {
        setPending(false);
      }
    })();
  }, [oid, cid, sp]);

  const prettyExpiry = useMemo(() => {
    if (!item?.expiresAt) return "No expiry info";
    return normalizeExpiry(item.expiresAt);
  }, [item]);

  async function handleSellSubmit() {
    if (!item) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitOk(null);

    try {
      const trimmed = price.trim();
      if (!trimmed || Number.isNaN(Number(trimmed))) {
        throw new Error("Please enter the price as a number");
      }

      const res = await fetch("/api/marketplace/list-for-sale", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ objectId: item.objectId, price: trimmed }),
      });

      const ct = res.headers.get("content-type") || "";
      const isJson = ct.includes("application/json");
      const body = isJson ? await res.json().catch(() => ({})) : await res.text();

      if (!res.ok) {
        const msg = isJson ? body?.error || JSON.stringify(body) : body || `HTTP ${res.status}`;
        throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
      }

      setSubmitOk("It's registered in the market.");
      setSellOpen(false);
    } catch (e: any) {
      setSubmitError(e?.message ?? "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  // ✅ 리뎀션(사용) 처리: 토큰 발급 → QR 생성 → 모달 오픈
  async function handleRedeem() {
    if (!item) return;
    setRedeemOpen(true);
    setRedeemPending(true);
    setRedeemError(null);
    setRedeemData(null);
    setQrDataUrl("");

    try {
      const res = await fetch("/api/redemption/generate-token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ objectId: item.objectId }),
      });

      const ct = res.headers.get("content-type") || "";
      const isJson = ct.includes("application/json");
      const body: RedemptionResp | any = isJson ? await res.json().catch(() => ({})) : await res.text();

      if (!res.ok) {
        const msg = isJson ? body?.error || JSON.stringify(body) : body || `HTTP ${res.status}`;
        throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
      }

      const data = body as RedemptionResp;
      setRedeemData(data);

      // QR 코드 payload 구성 (필요에 따라 토큰만 / JSON 전체 등)
      const payload = JSON.stringify({
        token: data.token,
        objectId: data.object?.objectId ?? item.objectId,
        expiresAt: data.expiresAt,
      });

      // ⬇️ QR 코드 이미지(DataURL) 생성
      const url = await QRCode.toDataURL(payload, { width: 320, margin: 1 });
      setQrDataUrl(url);
    } catch (e: any) {
      setRedeemError(e?.message ?? "Failed to issue token.");
    } finally {
      setRedeemPending(false);
    }
  }

  return (
    <div className="min-h-dvh w-full flex items-center justify-center bg-slate-200">
      <main
        className="h-dvh w-full md:h-[844px] md:w-[390px] md:rounded-[30px] md:shadow-2xl overflow-hidden relative flex items-center justify-center"
        style={{ backgroundColor: shellBg }}
      >
        <div className="bg-white rounded-2xl shadow-lg w-[320px] p-6 flex flex-col items-center mt-0 mx-auto mb-20">
          {pending && (
            <div className="w-full space-y-4">
              <div className="h-40 rounded-md bg-slate-200 animate-pulse" />
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="h-24 rounded-lg bg-slate-200 animate-pulse" />
                <div className="h-24 rounded-lg bg-slate-200 animate-pulse" />
              </div>
              <div className="h-4 rounded bg-slate-200 animate-pulse" />
              <div className="h-10 rounded bg-slate-200 animate-pulse" />
            </div>
          )}

          {!pending && error && (
            <div className="text-center text-red-600">
              {error}
              <div className="mt-4">
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white"
                >
                  뒤로가기
                </button>
              </div>
            </div>
          )}

          {!pending && !error && item && (
            <>
              <div className="w-full mb-6">
                <SmartImage
                  src={item.imageUrl || "/nintendo.jpg"}
                  alt={item.title}
                  width={300}
                  height={200}
                />
              </div>

              <div className="w-full text-center mb-2">
                <p className="text-xl font-bold">{item.title}</p>
                {item.description && (
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{item.description}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  {formatWon(item.faceValue)} · remain {safeInt(item.remaining)} · {item.state}
                </p>
              </div>

              {/* Sell & Send */}
              <div className="grid grid-cols-2 gap-4 w-full mb-6">
                <button
                  className="flex flex-col items-center justify-center border rounded-lg py-4 hover:bg-gray-100"
                  onClick={() => {
                    setPrice("");
                    setSubmitError(null);
                    setSubmitOk(null);
                    setSellOpen(true);
                  }}
                >
                  <ShoppingBagIcon className="h-12 w-12" />
                  <span className="text-xl font-bold mt-2">Sell</span>
                </button>
                <button
                  className="flex flex-col items-center justify-center border rounded-lg py-4 hover:bg-gray-100"
                  onClick={() => alert(`[Send] objectId=${item.objectId}`)}
                >
                  <PaperAirplaneIcon className="h-12 w-12" />
                  <span className="text-xl font-bold mt-2">Send</span>
                </button>
              </div>

              <p className="text-xs text-gray-500 mb-4 text-center">
                {prettyExpiry}
                <br />
                objectId: {item.objectId}
              </p>

              {/* ✅ Use Coupon → 토큰 발급 + QR 모달 */}
              <button
                onClick={handleRedeem}
                className="w-full bg-gray-200 hover:bg-gray-300 text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <TicketIcon className="h-10 w-10" />
                <span className="text-xl font-bold">Use Coupon</span>
              </button>
            </>
          )}
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={() => router.push("/mycoupon")}
          className="absolute bottom-8 bg-white text-black rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        >
          ✕
        </button>

        {/* === 판매 모달 === */}
        {sellOpen && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-6">
            <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl">
              <h2 className="text-lg font-semibold">Enter Sales Price</h2>
              <p className="text-xs text-slate-500 mt-1">Enter the desired selling price.</p>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Price (₩)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="예: 1000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={submitting}
                />
              </div>

              {submitError && <p className="text-sm text-red-600 mt-2">{submitError}</p>}
              {submitOk && <p className="text-sm text-emerald-600 mt-2">{submitOk}</p>}

              <div className="mt-5 flex gap-2">
                <button
                  className="flex-1 rounded-lg border px-4 py-2"
                  onClick={() => setSellOpen(false)}
                  disabled={submitting}
                >
                  Cancle
                </button>
                <button
                  className="flex-1 rounded-lg bg-slate-900 text-white px-4 py-2 disabled:opacity-60"
                  onClick={handleSellSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Registering...." : "Register Sales"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === ✅ 리뎀션(사용) 모달 === */}
        {redeemOpen && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-6">
            <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Use Coupon (QR)</h2>
                <button
                  className="rounded-full w-8 h-8 bg-slate-100 hover:bg-slate-200"
                  onClick={() => setRedeemOpen(false)}
                >
                  ✕
                </button>
              </div>

              {redeemPending && (
                <div className="mt-6 space-y-3">
                  <div className="h-48 bg-slate-200 animate-pulse rounded-xl" />
                  <p className="text-sm text-slate-600">Generating token...</p>
                </div>
              )}

              {!redeemPending && redeemError && (
                <p className="mt-4 text-sm text-red-600">{redeemError}</p>
              )}

              {!redeemPending && !redeemError && redeemData && (
                <div className="mt-4">
                  <div className="flex flex-col items-center">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QR Code"
                        className="w-[280px] h-[280px] rounded-xl border"
                      />
                    ) : (
                      <div className="w-[280px] h-[280px] rounded-xl bg-slate-200" />
                    )}
                    <p className="mt-3 text-xs text-slate-500">
                      exfire: {normalizeExpiry(redeemData.expiresAt)}
                    </p>

                    <div className="mt-3 w-full">
                      <label className="text-xs font-medium text-slate-600">Tocken</label>
                      <div className="mt-1 p-2 rounded-lg bg-slate-100 text-[11px] break-all">
                        {redeemData.token}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2 w-full">
                      <button
                        className="flex-1 rounded-lg border px-3 py-2 text-sm"
                        onClick={() => {
                          navigator.clipboard.writeText(redeemData.token).catch(() => {});
                        }}
                      >
                        토큰 복사
                      </button>
                      {qrDataUrl && (
                        <a
                          href={qrDataUrl}
                          download={`coupon-token-${redeemData.object?.objectId || "qr"}.png`}
                          className="flex-1 rounded-lg bg-slate-900 text-white px-3 py-2 text-center text-sm"
                        >
                          QR 저장
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ===== Helpers ===== */
function coerceToCoupons(payload: any): RawCoupon[] {
  if (Array.isArray(payload)) return payload as RawCoupon[];
  if (payload?.couponObjects && Array.isArray(payload.couponObjects)) return payload.couponObjects;
  if (payload?.items && Array.isArray(payload.items)) return payload.items;
  if (payload?.data && Array.isArray(payload.data)) return payload.data;
  if (payload?.result?.couponObjects && Array.isArray(payload.result.couponObjects)) {
    return payload.result.couponObjects;
  }
  return [];
}

function SmartImage({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  // 1) src에서 파일명만 추출해 /market/파일명 으로 매핑
  const local = toLocalMarketPath(src);

  // 2) 매핑 성공 시 로컬 이미지 사용 (Next/Image 최적화 OK)
  if (local) {
    return (
      <Image
        src={local}
        alt={alt}
        width={width}
        height={height}
        className="rounded-md object-contain mx-auto"
      />
    );
  }

  // 3) 실패 시 기본 이미지로 대체 (프로젝트에 존재해야 함)
  const fallback = "/market/default.png"; // 없으면 /logos/default.png 등으로 교체
  return (
    <Image
      src={fallback}
      alt={alt}
      width={width}
      height={height}
      className="rounded-md object-contain mx-auto"
    />
  );
}


function normalizeExpiry(input: string) {
  const d = new Date(input);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `Valid until ${y}-${m}-${day}`;
  }
  return input;
}
function safeInt(s: string | number | null | undefined) {
  const n = typeof s === "string" ? parseInt(s, 10) : typeof s === "number" ? s : 0;
  return Number.isFinite(n) ? n : 0;
}
function formatWon(v: string | number | null | undefined) {
  const n = typeof v === "string" ? parseInt(v, 10) : typeof v === "number" ? v : 0;
  return `₩${n.toLocaleString()}`;
}

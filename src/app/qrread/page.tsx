'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BrowserMultiFormatReader,
  IScannerControls,
} from '@zxing/browser';
import {
  BinaryBitmap,
  HybridBinarizer,
  RGBLuminanceSource,
  QRCodeReader,
  NotFoundException,
  Result,
} from '@zxing/library';

type VerifyResponse =
  | { exists: true; data: any }
  | { exists: false; message?: string };

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_IP;

/**
 * ZXing 전용 진단 페이지 (타입/시그니처 정리 버전)
 * - BarcodeDetector 사용 안 함
 * - decodeFromVideoDevice로 실시간 스트림 디코딩
 * - 수동 스냅샷 디코드 버튼 제공
 */
export default function QrReadPageZXingOnly() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null); // ← 반환 컨트롤 저장

  const canvasRef = useRef<HTMLCanvasElement | null>(null); // 수동 스냅샷용
  const qrReaderRef = useRef<QRCodeReader | null>(null); // 수동 스냅샷 디코더

  const [status, setStatus] = useState<'idle' | 'camera' | 'scanning' | 'verifying' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [frame, setFrame] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [hitBlink, setHitBlink] = useState(false);
  const hitBlinkTimer = useRef<number | undefined>(undefined);

  const flashHit = () => {
    setHitBlink(true);
    if (hitBlinkTimer.current) window.clearTimeout(hitBlinkTimer.current);
    hitBlinkTimer.current = window.setTimeout(() => setHitBlink(false), 300);
  };

  const stopAll = useCallback(() => {
    try {
      controlsRef.current?.stop(); // ← IScannerControls 사용
      controlsRef.current = null;
    } catch {}
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (hitBlinkTimer.current) window.clearTimeout(hitBlinkTimer.current);
  }, []);

  // 검증 API
  const verifyCode = useCallback(async (code: any) => {
    if (!API_BASE) {
      setStatus('error');
      setError('API_BASE(NEXT_PUBLIC_BACKEND_IP)is not set up.');
      return;
    }
    try {
      setStatus('verifying');
      setResult(null);
      const oneTimeToken = JSON.parse(code).token || ''
      const res = await fetch("/api/verify-token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ oneTimeToken }),
      });
      
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`서버 오류 (${res.status}) ${text}`);
      }
      const json = (await res.json()) as VerifyResponse;
      setResult(json);
      setStatus('done');
    } catch (e: any) {
      setStatus('error');
      setError(e?.message || 'Error occurred during verification.');
    }
  }, []);

  // 카메라 열기 + decodeFromVideoDevice 시작(사용자 제스처에서 호출)
  const startScan = useCallback(async () => {
    try {
      setError(null);
      setResult(null);
      setLastCode(null);
      setStatus('camera');

      if (!zxingReaderRef.current) {
        zxingReaderRef.current = new BrowserMultiFormatReader();
      }
      const reader = zxingReaderRef.current;

      // deviceId는 undefined로 전달(자동 선택). null 금지.
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        (res?: Result, err?: unknown) => {
          try {
            const v = videoRef.current;
            if (v && v.videoWidth && v.videoHeight) {
              setFrame((f) =>
                f.w === v.videoWidth && f.h === v.videoHeight
                  ? f
                  : { w: v.videoWidth, h: v.videoHeight }
              );
            }
            if (res) {
              const code = res.getText();
              if (code && code !== lastCode) {
                flashHit();
                setLastCode(code);
                setStatus('scanning'); // UI색 유지
                verifyCode(code);
              }
            }
            if (err && !(err instanceof NotFoundException)) {
              // NotFound는 "이번 프레임에 못 찾음"이라 정상 흐름
              // 그 외 에러만 콘솔에 표시
              console.debug('[ZXing error]', err);
            }
          } catch (e) {
            console.debug('[callback error]', e);
          }
        }
      );

      controlsRef.current = controls;

      // 스트림 핸들 보관(정리용)
      const v = videoRef.current;
      if (v && v.srcObject instanceof MediaStream) {
        streamRef.current = v.srcObject as MediaStream;
      }

      setStatus('scanning');
    } catch (e: any) {
      setStatus('error');
      setError(e?.message || 'Camera/decoder initialization failed (HTTPS/Authorization Check)');
    }
  }, [lastCode, verifyCode]);

  // 수동 스냅샷 디코드(디버그)
  const snapshotDecode = useCallback(() => {
    try {
      const v = videoRef.current;
      if (!v || !v.videoWidth || !v.videoHeight) {
        alert('Video frame not ready.');
        return;
      }
      if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
      if (!qrReaderRef.current) qrReaderRef.current = new QRCodeReader();

      // 다운스케일(예: 최대 960px 폭) → 속도/안정성 향상
      const maxW = 960;
      const scale = Math.min(1, maxW / v.videoWidth);
      const w = Math.max(1, Math.floor(v.videoWidth * scale));
      const h = Math.max(1, Math.floor(v.videoHeight * scale));

      const c = canvasRef.current;
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(v, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const luminance = new RGBLuminanceSource(imageData.data, w, h);
      const binarizer = new HybridBinarizer(luminance);
      const bitmap = new BinaryBitmap(binarizer);

      try {
        const res = qrReaderRef.current.decode(bitmap);
        const code = res.getText();
        if (code) {
          flashHit();
          setLastCode(code);
          verifyCode(code);
        } else {
          alert('QR not found (snapshot). Look closer/bright.');
        }
      } catch (err) {
        console.debug('[snapshot decode fail]', err);
        alert('Failed to decode snapshot. Try adjusting angle/distance/brightness.');
      }
    } catch (e) {
      console.debug('[snapshot error]', e);
    }
  }, [verifyCode]);

  useEffect(() => {
    return () => {
      stopAll();
    };
  }, [stopAll]);

  const resetScan = () => {
    setResult(null);
    setLastCode(null);
    setStatus('scanning');
    setHitBlink(false);
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">QR code scan</h1>

      <div className={`rounded-2xl overflow-hidden bg-black aspect-video relative ${hitBlink ? 'ring-4 ring-emerald-400' : ''}`}>
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <div className="absolute inset-0 pointer-events-none border-2 border-white/30 rounded-xl m-8" />
        <div className="absolute left-2 bottom-2 text-[10px] px-2 py-1 rounded bg-black/60 text-white space-y-0.5">
          <div>engine: ZXing (decodeFromVideoDevice)</div>
          <div>frame: {frame.w}×{frame.h}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span
          className="inline-flex h-2 w-2 rounded-full"
          style={{
            background:
              status === 'scanning'
                ? '#22c55e'
                : status === 'verifying'
                ? '#f59e0b'
                : status === 'done'
                ? '#3b82f6'
                : status === 'error'
                ? '#ef4444'
                : '#94a3b8',
          }}
        />
        <span>
          {status === 'idle' && 'waiting'}
          {status === 'camera' && 'preparing for camera... (Start with a button)'}
          {status === 'scanning' &&  'scanning... Please center the QR in the middle of the frame'}
          {status === 'verifying' && 'server validation...'}
          {status === 'done' && 'verified'}
          {status === 'error' && 'error'}
        </span>
      </div>

      {lastCode && (
        <div className="text-xs break-all text-slate-400">
          Last detection code: <span className="font-mono">{lastCode}</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
          <div className="font-semibold">
            {result.exists ? 'It is a valid QR.' : 'This is a QR that does not exit.'}
          </div>
          <pre className="overflow-auto text-xs leading-relaxed">
            {JSON.stringify(result, null, 2)}
          </pre>
          <div className="flex gap-2">
            <button onClick={resetScan} className="rounded-xl px-4 py-2 text-sm bg-black text-white">
              다시 스캔
            </button>
          </div>
        </div>
      )}

      {!result && (
        <div className="flex flex-wrap gap-2">
          <button onClick={startScan} className="rounded-xl px-4 py-2 text-sm bg-emerald-600 text-white">
            Camera start (required)
          </button>
          <button onClick={snapshotDecode} className="rounded-xl px-4 py-2 text-sm bg-slate-800 text-white">
            Snapshot Decode (Debug)
          </button>
          <button onClick={resetScan} className="rounded-xl px-4 py-2 text-sm border border-slate-300">
            Initialization
          </button>
        </div>
      )}

      <p className="text-xs text-slate-400">
        * HTTPS or localhost required. If the rear camera is not selected for the mobile, try swiveling the screen/camera.
      </p>
    </main>
  );
}

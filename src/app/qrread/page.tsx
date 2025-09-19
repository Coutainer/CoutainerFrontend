'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BinaryBitmap,
  HybridBinarizer,
  RGBLuminanceSource,
  QRCodeReader
} from '@zxing/library';

type VerifyResponse =
  | { exists: true; data: any }   // 서버가 찾은 경우 (원하는 스키마로 바꿔도 됨)
  | { exists: false; message?: string }; // 없는 경우

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_IP;

export default function QrReadPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<any>(null); // BarcodeDetector 또는 ZXing Reader
  const isBarcodeDetectorSupported = useMemo(
    () => typeof window !== 'undefined' && 'BarcodeDetector' in window,
    []
  );

  const [status, setStatus] = useState<'idle' | 'camera' | 'scanning' | 'verifying' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [paused, setPaused] = useState(false); // 스캔 잠깐 멈추기

  // 카메라 열기
  const openCamera = useCallback(async () => {
    try {
      setError(null);
      setResult(null);
      setLastCode(null);
      setStatus('camera');

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' }, // 모바일 후면 카메라 우선
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // 준비 완료
      setCameraReady(true);
      setStatus('scanning');
    } catch (e: any) {
      setStatus('error');
      setError(e?.message || '카메라 접근에 실패했습니다. (HTTPS/localhost 필요)');
    }
  }, []);

  // 검증 API 호출
  const verifyCode = useCallback(async (code: string) => {
    if (!API_BASE) {
      setStatus('error');
      setError('API_BASE(NEXT_PUBLIC_BACKEND_IP)가 설정되지 않았습니다.');
      return;
    }
    try {
      setStatus('verifying');
      setResult(null);

      // 서버 규약에 맞게 엔드포인트 조정하세요.
      // 예: GET /qr/verify?code=...
      const url = `${API_BASE.replace(/\/$/, '')}/qr/verify?code=${encodeURIComponent(code)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          // JWT가 필요한 경우:
          // 'Authorization': `Bearer ${token}`
        },
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
      setError(e?.message || '검증 중 오류가 발생했습니다.');
    }
  }, []);

  // ZXing 동적 임포트 (폴백용)
  const initZxing = useCallback(async () => {
    const { BrowserMultiFormatReader } = await import('@zxing/browser');
    const reader = new BrowserMultiFormatReader();
    detectorRef.current = reader;
  }, []);

  // BarcodeDetector 초기화
  const initBarcodeDetector = useCallback(async () => {
    // @ts-ignore
    const BarcodeDetectorCtor = (window as any).BarcodeDetector;
    // @ts-ignore
    const supported = await BarcodeDetectorCtor.getSupportedFormats?.().catch(() => []) || [];
    // @ts-ignore
    detectorRef.current = new BarcodeDetectorCtor({ formats: supported.length ? supported : ['qr_code'] });
  }, []);

  // 스캔 루프 (BarcodeDetector)
  const scanWithBarcodeDetector = useCallback(async () => {
    if (!videoRef.current || !detectorRef.current) return;

    const tick = async () => {
      if (!videoRef.current || !detectorRef.current || paused) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      try {
        // @ts-ignore
        const barcodes = await detectorRef.current.detect(videoRef.current);
        if (barcodes && barcodes.length > 0) {
          const code = barcodes[0].rawValue || barcodes[0].raw || '';
          if (code && code !== lastCode) {
            setLastCode(code);
            setPaused(true); // 중복 검증 방지로 잠깐 멈춤
            await verifyCode(code);
          }
        }
      } catch {
        // 프레임 처리 실패는 무시하고 다음 프레임
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [lastCode, paused, verifyCode]);

  // 스캔 루프 (ZXing)
  const scanWithZxing = useCallback(async () => {
    const reader = detectorRef.current;
    if (!reader || !videoRef.current) return;

    // @zxing/browser는 직접 비디오 요소에 attach 하는 방식도 있으나
    // 여기서는 프레임 폴링 방식으로 사용
    const tick = async () => {
      if (!videoRef.current || !reader || paused) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      try {
        // 캔버스에 한 프레임 그려서 decode
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const w = videoRef.current.videoWidth || 1280;
        const h = videoRef.current.videoHeight || 720;
        canvas.width = w;
        canvas.height = h;
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          const imageData = ctx.getImageData(0, 0, w, h);
          //const { BinaryBitmap, HybridBinarizer, RGBLuminanceSource, QRCodeReader } = await import('@zxing/browser/esm5/core'); // 내부 모듈
          const luminance = new RGBLuminanceSource(imageData.data, w, h);
          const binarizer = new HybridBinarizer(luminance);
          const bitmap = new BinaryBitmap(binarizer);
          const qrReader = new QRCodeReader();
          try {
            const res = qrReader.decode(bitmap);
            const code = res.getText();
            if (code && code !== lastCode) {
              setLastCode(code);
              setPaused(true);
              await verifyCode(code);
            }
          } catch {
            // decode 실패 → 다음 프레임
          }
        }
      } catch {
        // 프레임 처리 실패는 무시
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [lastCode, paused, verifyCode]);

  // 시작/초기화
  useEffect(() => {
    openCamera();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [openCamera]);

  // 스캐너 초기화 + 루프 시작
  useEffect(() => {
    const run = async () => {
      if (!cameraReady) return;
      try {
        if (isBarcodeDetectorSupported) {
          await initBarcodeDetector();
          await scanWithBarcodeDetector();
        } else {
          await initZxing();
          await scanWithZxing();
        }
      } catch (e: any) {
        setError(e?.message || '스캐너 초기화 실패');
        setStatus('error');
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraReady]);

  const resetScan = () => {
    setResult(null);
    setLastCode(null);
    setPaused(false);
    setStatus('scanning');
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">QR 코드 스캔</h1>

      <div className="rounded-2xl overflow-hidden bg-black aspect-video relative">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        {/* 가이드 라인 */}
        <div className="absolute inset-0 pointer-events-none border-2 border-white/30 rounded-xl m-8" />
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="inline-flex h-2 w-2 rounded-full"
          style={{ background: status === 'scanning' ? '#22c55e' : status === 'verifying' ? '#f59e0b' : status === 'done' ? '#3b82f6' : '#94a3b8' }} />
        <span>
          {status === 'idle' && '대기 중'}
          {status === 'camera' && '카메라 준비 중…'}
          {status === 'scanning' && (paused ? '일시정지됨' : '스캔 중… QR을 프레임 중앙에 맞춰주세요')}
          {status === 'verifying' && '서버 검증 중…'}
          {status === 'done' && '검증 완료'}
          {status === 'error' && '오류'}
        </span>
      </div>

      {lastCode && (
        <div className="text-xs break-all text-slate-400">
          마지막 감지 코드: <span className="font-mono">{lastCode}</span>
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
            {result.exists ? '유효한 QR입니다.' : '존재하지 않는 QR입니다.'}
          </div>
          <pre className="overflow-auto text-xs leading-relaxed">
            {JSON.stringify(result, null, 2)}
          </pre>
          <div className="flex gap-2">
            <button
              onClick={resetScan}
              className="rounded-xl px-4 py-2 text-sm bg-black text-white"
            >
              다시 스캔
            </button>
          </div>
        </div>
      )}

      {!result && (
        <div className="flex gap-2">
          <button
            onClick={() => setPaused(p => !p)}
            className="rounded-xl px-4 py-2 text-sm bg-slate-800 text-white"
          >
            {paused ? '스캔 재개' : '스캔 일시정지'}
          </button>
          <button
            onClick={resetScan}
            className="rounded-xl px-4 py-2 text-sm border border-slate-300"
          >
            초기화
          </button>
        </div>
      )}

      <p className="text-xs text-slate-400">
        * 카메라는 HTTPS 또는 localhost에서만 동작합니다. 모바일에서는 후면 카메라가 우선 선택됩니다.
      </p>
    </main>
  );
}

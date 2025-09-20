"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_IP;

export default function AuthCallbackPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("처리중...");
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const code = sp.get("code");
    if (!code) {
      setMessage("code가 없습니다.");
      return;
    }

    (async () => {
      try {
        // 1) 백엔드에 code 전달 (GET 요청)
        const res = await fetch(`${backendUrl}/auth/callback?code=${encodeURIComponent(code)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();
        if (!res.ok) {
          setMessage("토큰 교환 실패: " + JSON.stringify(data));
          return;
        }

        // 응답에서 토큰 추출 (백엔드 응답 구조에 맞게 수정)
        const token = data.access_token ?? data.token ?? data.jwt;
        if (!token) {
          setMessage("응답에 토큰이 없습니다: " + JSON.stringify(data));
          return;
        }

        // 2) 포인트 잔액 조회
        const balRes = await fetch(`${backendUrl}/point/balance`, {
          method: "GET",
          headers: {
            "auth": token,
          },
        });

        const balData = await balRes.json();
        if (!balRes.ok) {
          setMessage("잔액 조회 실패: " + JSON.stringify(balData));
          return;
        }

        // 백엔드 응답 구조 맞게 값 꺼내기
        const value = typeof balData === "number"
          ? balData
          : balData.balance ?? balData.point ?? null;

        setBalance(value);
        setMessage("로그인 및 잔액 조회 성공!");
      } catch (err: any) {
        setMessage("에러: " + err.message);
      }
    })();
  }, [sp]);

  return (
    <div className="p-6">
      <div>{message}</div>
      {balance !== null && <div>현재 포인트 잔액: <b>{balance}</b></div>}
      <button
        onClick={() => router.replace("/")}
        className="mt-4 rounded-lg border px-4 py-2 hover:bg-gray-100"
      >
        홈으로
      </button>
    </div>
  );
}

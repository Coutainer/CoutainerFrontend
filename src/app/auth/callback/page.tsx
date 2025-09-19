"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_IP;

export default function CallbackPage() {
  const params = useSearchParams();

  useEffect(() => {
    const code = params.get("code");
    if (!code) return;

    async function sendCode() {
      try {
        const res = await fetch(backendUrl + `/auth/callback?code=`+code, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("서버 응답 오류");
        const data = await res.json();
        console.log("로그인 성공:", data);

        // TODO: 토큰 저장 or 라우팅 처리
      } catch (err) {
        console.error("로그인 실패:", err);
      }
    }

    sendCode();
  }, [params]);

  return (
    <div className="p-6">
      <h1>로그인 처리 중...</h1>
    </div>
  );
}
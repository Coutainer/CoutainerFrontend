"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("처리중...");

  useEffect(() => {
    const code = sp.get("code");
    if (!code) {
      setMessage("code가 없습니다.");
      return;
    }

    (async () => {
      try {
        // 1) 백엔드(권한 서버)에 코드 전달해서 토큰 교환
        // -> 기존에 당신이 호출하던 백엔드 URL
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_IP!;
        const res = await fetch(`${backendUrl}/auth/callback?code=${encodeURIComponent(code)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!res.ok) {
          setMessage("토큰 교환 실패: " + JSON.stringify(data));
          return;
        }

        // 2) 토큰 추출 (백엔드 응답 구조에 맞게)
        const token: string | undefined = data.access_token ?? data.token ?? data.jwt ?? data.id_token;
        if (!token) {
          setMessage("응답에 토큰이 없습니다: " + JSON.stringify(data));
          return;
        }

        // 3) 내 서버에 토큰 저장 요청 -> 서버가 HttpOnly 쿠키로 저장
        const saveRes = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!saveRes.ok) {
          const err = await saveRes.text().catch(() => "no body");
          setMessage("세션 저장 실패: " + err);
          return;
        }

        setMessage("로그인 성공! (쿠키에 토큰 저장됨)");
        // 원하면 리디렉트
        router.replace("/");
      } catch (e: any) {
        setMessage("에러: " + (e?.message ?? String(e)));
      }
    })();
  }, [sp, router]);

  return (
    <div className="p-6">
      <div>{message}</div>
    </div>
  );
}

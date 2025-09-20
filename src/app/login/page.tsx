"use client";

import Image from "next/image";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";

export default function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);

  function googleLogin() {
    try {
      setLoading(true);
      const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
      const redirectUri = "http://localhost:3000/auth/callback";
      const scope = "openid email profile";
      const responseType = "code";
      const state = crypto?.randomUUID?.() ?? "state";
      const accessType = "offline";
      const prompt = "consent";

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId ?? "")}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(scope)}` +
        `&response_type=${encodeURIComponent(responseType)}` +
        `&state=${encodeURIComponent(state)}` +
        `&access_type=${encodeURIComponent(accessType)}` +
        `&prompt=${encodeURIComponent(prompt)}`;

      console.log("Redirecting to:", authUrl);
      window.location.href = authUrl;
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100svh] w-full bg-gradient-to-br from-white via-gray-50 to-white text-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* ambient blobs */}
      <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-fuchsia-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        <div className="rounded-2xl bg-white backdrop-blur-xl ring-1 ring-gray-200 shadow-2xl">
          {/* Header */}
          <div className="px-8 pt-10 pb-4 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="h-25 w-25 rounded-xl p-1 bg-gray-100 ring-1 ring-gray-200 grid place-items-center">
                <Image src="/logo.png" alt="logo" width={300} height={300}/>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">Coutainer</h1>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              간결하고 안전한 로그인. Google 계정으로 시작하세요.
            </p>
          </div>

          {/* Card body */}
          <div className="px-8 pb-10">
            <button
              onClick={googleLogin}
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-xl bg-gray-900 text-white shadow-lg ring-1 ring-gray-300 transition active:scale-[.99] disabled:opacity-70"
            >
              {/* subtle sheen */}
              <span className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-[100%] transition-transform duration-700" />

              <div className="flex items-center justify-center gap-3 px-5 py-3.5">
                <FcGoogle className="h-5 w-5" />
                <span className="font-semibold">{loading ? "Google로 이동 중..." : "Google로 zkLogin"}</span>
              </div>
            </button>

            {/* tiny copy */}
            <p className="mt-4 text-[11px] leading-5 text-gray-400 text-center">
              계속하면 서비스 약관과 개인정보 처리방침에 동의하게 됩니다.
            </p>
          </div>
        </div>

        {/* footer */}
        <div className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Coutainer. All rights reserved.
        </div>
      </div>
    </div>
  );
}
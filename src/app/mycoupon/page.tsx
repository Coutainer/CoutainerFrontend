// app/coupons/page.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

type Coupon = {
  logo: string;  // public/logos/* 경로
  title: string;
  brand: string;
  expiry: string;
};

const coupons: Coupon[] = [
  { logo: "/logos/mcdonalds.png", title: "$ 10",          brand: "McDonalds", expiry: "Valid until 01 February 2022" },
  { logo: "/logos/kfc.png",       title: "25% OFF",       brand: "KFC",       expiry: "Valid until 03 March 2022" },
  { logo: "/logos/starbucks.png", title: "1 Free Coffee", brand: "Starbucks", expiry: "Valid until 11 September 2022" },
  { logo: "/logos/vapiano.png",   title: "Pay 1 take 2",  brand: "Vapiano",   expiry: "Valid until 03 October 2022" },
];

export default function CouponsPage() {
  const router = useRouter();
  const shellBg = "#0B4661"; // 외곽(폰 프레임) 배경색과 노치 색 통일

  return (
    // 데스크톱에서는 가운데 390px "폰 프레임", 모바일은 전체 폭
    <div className="min-h-dvh w-full flex items-center justify-center bg-slate-200">
      <main
        className="h-dvh w-full md:h-[844px] md:w-[390px] md:rounded-[30px] md:shadow-2xl overflow-hidden"
        style={{ backgroundColor: shellBg }}
      >
        {/* 상단 헤더 */}
        <header className="flex items-center justify-between px-5 py-4 text-white">
          <button onClick={() => router.back()} className="text-2xl leading-none">←</button>
          <h1 className="text-lg font-semibold">My Coupons</h1>
          <button className="text-2xl leading-none">≡</button>
        </header>

        {/* 쿠폰 리스트(스크롤 영역) */}
        <section className="h-[calc(100dvh-160px)] md:h-[calc(844px-160px)] overflow-y-auto px-4 space-y-4">
          {coupons.map((c, i) => (
            <article
              key={i}
              className={[
                "relative flex gap-4 bg-white rounded-2xl p-4 shadow",
                // 좌우 반달 노치(폰 프레임 배경색으로 뚫어 보이게)
                "before:content-[''] before:absolute before:left-[-14px] before:top-1/2 before:-translate-y-1/2 before:w-7 before:h-7 before:rounded-full",
                "after:content-['']  after:absolute  after:right-[-14px] after:top-1/2  after:-translate-y-1/2  after:w-7 after:h-7 after:rounded-full",
              ].join(" ")}
              style={
                { 
                  // 노치 색상을 폰 프레임 배경과 동일하게
                  ["--notch" as any]: shellBg,
                  // @ts-ignore
                  "--tw-before-bg": shellBg, "--tw-after-bg": shellBg,
                  // tailwind에서 arbitrary 색상 사용 위해 직접 스타일
                  backgroundClip: "padding-box",
                } as React.CSSProperties
              }
            >
              {/* left: 로고 */}
              <div className="flex items-center">
                <Image src={c.logo} alt={c.brand} width={44} height={44} className="shrink-0 rounded" />
              </div>

              {/* 가운데 절취선(점선) */}
              <div className="mx-2 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent relative">
                <div className="absolute inset-0 border-l-2 border-dashed border-gray-300 left-[-1px]" />
              </div>

              {/* right: 내용 */}
              <div className="flex-1">
                <p className="text-2xl font-semibold leading-tight">{c.title}</p>
                <p className="text-base font-medium text-slate-700">{c.brand}</p>
                <p className="text-xs text-slate-400 mt-2">{c.expiry}</p>
              </div>
            </article>
          ))}
          <div className="h-2" />
        </section>

        {/* 하단 버튼 */}
        <footer className="px-6 pb-6 pt-2">
          <button className="w-full rounded-full bg-white py-4 text-base font-semibold text-[#0B4661] shadow">
            Add new coupon
          </button>
        </footer>
      </main>
    </div>
  );
}

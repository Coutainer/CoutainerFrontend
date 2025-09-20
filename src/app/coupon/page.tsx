// app/coupon/page.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  TicketIcon,
  ShoppingBagIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";

export default function CouponPage() {
  const router = useRouter();
  const shellBg = "#0B4661"; // 외곽(폰 프레임) 배경색

  return (
    <div className="min-h-dvh w-full flex items-center justify-center bg-slate-200">
      {/* 모바일 뷰 래퍼 */}
      <main
        className="h-dvh w-full md:h-[844px] md:w-[390px] md:rounded-[30px] md:shadow-2xl overflow-hidden relative flex items-center justify-center"
        style={{ backgroundColor: shellBg }}
      >
        <div className="bg-white rounded-2xl shadow-lg w-[320px] p-6 flex flex-col items-center mt-0 mx-auto mb-20">
          {/* 상품 이미지 */}
          <div className="w-full mb-6">
            <Image
              src="/nintendo.jpg" // public 폴더에 넣어주세요
              alt="Nintendo Switch"
              width={300}
              height={200}
              className="rounded-md object-contain mx-auto"
            />
          </div>

          {/* Sell & Send 버튼 */}
          <div className="grid grid-cols-2 gap-4 w-full mb-6">
            <button className="flex flex-col items-center justify-center border rounded-lg py-4 hover:bg-gray-100">
              <ShoppingBagIcon className="h-12 w-12" />
              <span className="text-xl font-bold mt-2">Sell</span>
            </button>
            <button className="flex flex-col items-center justify-center border rounded-lg py-4 hover:bg-gray-100">
              <PaperAirplaneIcon className="h-12 w-12" />
              <span className="text-xl font-bold mt-2">Send</span>
            </button>
          </div>

          {/* 만료일 */}
          <p className="text-xs text-gray-500 mb-4 text-center">
            Valid until 21 Sep 2025 <br />
            publisher : Sui &amp; DSRV
          </p>

          {/* Use Coupon 버튼 */}
          <button
            onClick={() => alert("쿠폰 사용하기")}
            className="w-full bg-gray-200 hover:bg-gray-300 text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <TicketIcon className="h-10 w-10" />
            <span className="text-xl font-bold">Use Coupon</span>
          </button>
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={() => router.push("/")}
          className="absolute bottom-8 bg-white text-black rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        >
          ✕
        </button>
      </main>
    </div>
  );
}

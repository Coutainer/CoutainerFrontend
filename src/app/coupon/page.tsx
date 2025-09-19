// app/coupon/page.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CouponPage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-900">
      <div className="bg-white rounded-2xl shadow-lg w-[320px] p-6 flex flex-col items-center">
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

        {/* SELL & Send 버튼 */}
        <div className="grid grid-cols-2 gap-4 w-full mb-6">
          <button className="flex flex-col items-center justify-center border rounded-lg py-4 hover:bg-gray-100">
            <span className="text-2xl">💳</span>
            <span className="font-medium mt-2">SELL</span>
          </button>
          <button className="flex flex-col items-center justify-center border rounded-lg py-4 hover:bg-gray-100">
            <span className="text-2xl">📤</span>
            <span className="font-medium mt-2">Send</span>
          </button>
        </div>

        {/* 만료일 */}
        <p className="text-xs text-gray-500 mb-4">
          Valid until 21 Sep 2025 <br />
          publisher : Sui & DSRV
        </p>

        {/* Use Coupon 버튼 */}
        <button
          onClick={() => alert("쿠폰 사용하기")}
          className="w-full bg-gray-200 hover:bg-gray-300 text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
        >
          🎟 Use Coupon
        </button>
      </div>

      {/* 닫기 버튼 */}
      <button
        onClick={() => router.push("/")}
        className="absolute bottom-8 bg-white text-black rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
      >
        ✕
      </button>
    </div>
  );
}

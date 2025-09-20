import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Inter } from "next/font/google";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = { 
  title: "Coupon Market Place", 
  description: "Coupon Market Place" 
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-white/10 bg-card2/60 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
        {/* ✅ 로고 (클릭 시 루트 경로로 이동) */}
        <Link href="/" className="shrink-0" aria-label="홈으로 이동">
          <Image
            src="/logo.png"
            alt="Coutainer 로고"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            priority
          />
        </Link>

        <span className="text-sm font-semibold text-red-300">Dashboard</span>
        <button className="text-sm text-slate-400 hover:text-white">About Us</button>
        <button className="text-sm text-slate-400 hover:text-white">FAQ</button>

        <div className="ml-auto flex items-center gap-3">
          <div className="relative w-72">
            <input
              className="w-full rounded-xl bg-card pl-10 pr-3 py-2 text-sm placeholder:text-slate-500 outline-none ring-1 ring-gray-400 focus:ring-red-400/40"
              placeholder="Search artwork"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">⌕</span>
          </div>
          
          <Link
            href="/market/mypermit"
            className="size-11 grid place-items-center ml-10 rounded-full bg-red-300 text-black ring-1 ring-red-400"
          >
            <ShoppingBagIcon className="h-8 w-8" />
          </Link>
          <span className="text-sm text-black">My Permit</span>
          
        </div>
      </div>
      {children}
    </div>
  );
}

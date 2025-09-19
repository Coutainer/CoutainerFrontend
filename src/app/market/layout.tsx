import type { Metadata } from "next";
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = { title: "Coupon Market Place", description: "Coupon Market Place" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
        <div className="border-b border-white/10 bg-card2/60 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
            <span className="text-sm font-semibold text-emerald-300">Dashboard</span>
            <button className="text-sm text-slate-400 hover:text-white">About Us</button>
            <button className="text-sm text-slate-400 hover:text-white">FAQ</button>

            <div className="ml-auto flex items-center gap-3">
              <div className="relative w-72">
                <input
                  className="w-full rounded-xl bg-card pl-10 pr-3 py-2 text-sm placeholder:text-slate-500 outline-none ring-1 ring-white/10 focus:ring-emerald-400/40"
                  placeholder="Search artwork"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">⌕</span>
              </div>
              <div className="size-9 grid place-items-center rounded-xl bg-card ring-1 ring-white/10">🖼️</div>
              <div className="size-9 grid place-items-center rounded-xl bg-card ring-1 ring-white/10">🔔</div>
              <div className="size-9 grid place-items-center rounded-full bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-400/40">L</div>
              <span className="text-sm text-slate-300">Leslie Alexander</span>
              <button className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400 transition">
                Create new item
              </button>
            </div>
          </div>
          {children}
        </div>
        
  );
}

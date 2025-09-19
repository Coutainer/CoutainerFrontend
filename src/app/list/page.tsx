"use client";

import Image from "next/image";
import {
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  ShoppingCartIcon,
  ChatBubbleLeftRightIcon,
  WalletIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

type Order = {
  id: string;
  title: string;
  colorName: string;
  colorDotClass: string; // e.g. bg-yellow-400
  price: string; // formatted
  img: string; // /public 경로
};

const ORDERS: Order[] = [
  {
    id: "1",
    title: "Starbucks Giftcard 50,000 won",
    colorName: "On Sale",
    colorDotClass: "bg-green-400",
    price: "43,000 ₩",
    img: "/starbucks5.jpg",
  },
  {
    id: "2",
    title: "Starbucks Giftcard 20,000 won",
    colorName: "On Sale",
    colorDotClass: "bg-green-400",
    price: "15,000 ₩",
    img: "/starbucks2.jpg",
  },
  {
    id: "3",
    title: "Oliveyoung Giftcard 50,000 won",
    colorName: "On Sale",
    colorDotClass: "bg-green-400",
    price: "45,000 ₩",
    img: "/oliveyoung5.jpg",
  },
  {
    id: "4",
    title: "Google Play Giftcard 100,000 won",
    colorName: "Out of stock",
    colorDotClass: "bg-gray-300",
    price: "90,000 ₩",
    img: "/googleplay.jpg",
  },
];

export default function OrdersPage() {
  return (
    <div className="min-h-dvh bg-neutral-50">
      {/* Safe area container (mobile 느낌) */}
      <div className="mx-auto max-w-[480px] min-h-dvh flex flex-col">
        {/* Header */}
        <header className="px-5 pt-4 pb-3 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">My Orders</h1>
            <div className="flex items-center gap-3">
              <MagnifyingGlassIcon className="w-6 h-6 text-neutral-800" />
              <EllipsisHorizontalIcon className="w-7 h-7 text-neutral-800" />
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex items-center gap-8">
            <button className="pb-2 text-base font-semibold text-neutral-900 relative">
              Active
              <span className="absolute -bottom-[1px] left-0 h-[3px] w-full rounded-full bg-neutral-900" />
            </button>
            <button className="pb-2 text-base font-medium text-neutral-300">
              Completed
            </button>
          </div>
          <div className="h-px w-full bg-neutral-200" />
        </header>

        {/* List */}
        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {ORDERS.map((o) => (
            <article
              key={o.id}
              className="rounded-3xl bg-white shadow-sm px-4 py-4 flex gap-4 items-center"
            >
              {/* product image */}
              <div className="shrink-0">
                <div className="rounded-2xl bg-neutral-100 p-3">
                  <Image
                    src={o.img}
                    alt={o.title}
                    width={90}
                    height={64}
                    className="h-16 w-[90px] object-contain"
                    priority
                  />
                </div>
              </div>

              {/* info */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-900">
                  {o.title}
                </h3>

                <div className="mt-1 flex items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 text-neutral-500">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${o.colorDotClass}`}
                    />
                    {o.colorName}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-2xl font-extrabold tracking-tight">
                    {o.price}
                  </div>

                  <button className="rounded-full bg-neutral-900 text-white px-4 py-2 text-sm font-semibold">
                    For details
                  </button>
                </div>
              </div>
            </article>
          ))}

          <div className="h-20" />
        </main>

        {/* Bottom Tab Bar */}
        <nav className="sticky bottom-0 bg-white border-t border-neutral-200">
          <div className="mx-auto max-w-[480px]">
            <ul className="grid grid-cols-5 px-6 py-3 text-xs text-neutral-400">
              <li className="flex flex-col items-center gap-1">
                <HomeIcon className="w-6 h-6" />
                <span>Home</span>
              </li>
              <li className="flex flex-col items-center gap-1 text-neutral-900">
                <ShoppingCartIcon className="w-6 h-6" />
                <span className="font-semibold">Orders</span>
              </li>
              <li className="flex flex-col items-center gap-1">
                <ChatBubbleLeftRightIcon className="w-6 h-6" />
                <span>Inbox</span>
              </li>
              <li className="flex flex-col items-center gap-1">
                <WalletIcon className="w-6 h-6" />
                <span>Wallet</span>
              </li>
              <li className="flex flex-col items-center gap-1">
                <UserIcon className="w-6 h-6" />
                <span>Profile</span>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
}

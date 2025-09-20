import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  UserGroupIcon,
  BuildingStorefrontIcon,
  ShoppingCartIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

// ===== Server Action: 로그아웃 =====
export async function logout() {
  "use server";
  const jar = await cookies();
  // path 지정해두면 삭제 누락 방지
  jar.delete({name: "app_token", path: "/" });
  redirect("/login");
}

type Profile = {
  id: number;
  address: string;
  nickname: string;
  role: "CONSUMER" | "SELLER" | "ISSUER" | "VENDOR" | string;
  hasWallet: boolean;
};

const cards = [
  { href: "/market", role: "issuer",  title: "발행자", desc: "토큰/쿠폰/증서를 발행",     Icon: UserGroupIcon,         tone: "from-indigo-500 to-sky-500" },
  { href: "/coupon", role: "seller",  title: "판매자", desc: "상품 등록 및 판매 관리",     Icon: BuildingStorefrontIcon, tone: "from-rose-500 to-orange-500" },
  { href: "/list",   role: "buyer",   title: "구매자", desc: "상품 탐색 및 결제",         Icon: ShoppingCartIcon,      tone: "from-emerald-500 to-lime-500" },
  { href: "/market", role: "vendor",  title: "공급자", desc: "재고/납품 및 공급 관리",     Icon: TruckIcon,             tone: "from-violet-500 to-fuchsia-500" },
];

export default async function Page() {
  const token = (await cookies()).get("app_token")?.value;
  if (!token) redirect("/login");

  // ===== /user/profile 조회 =====
  let profile: Profile | null = null;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_IP}/user/profile`,
      {
        method: "GET",
        headers: { auth: token },
        cache: "no-store",
      }
    );
    if (res.ok) {
      profile = (await res.json()) as Profile;
    }
  } catch {
    // 실패 시 profile은 null 유지 (UI에서 안내)
  }

  return (
    <main className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      {/* Soft gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,theme(colors.indigo.100/60),transparent),radial-gradient(40%_40%_at_100%_20%,theme(colors.sky.100/40),transparent),radial-gradient(50%_50%_at_0%_100%,theme(colors.purple.100/40),transparent)]" />
      {/* Subtle dot pattern */}
      <svg className="absolute inset-0 -z-10 h-full w-full opacity-[0.17]" aria-hidden="true">
        <defs>
          <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" className="fill-gray-300" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      <div className="w-full max-w-6xl px-6 py-14">
        {/* 상단 사용자 바 + 로그아웃 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 ring-2 ring-indigo-200/50" />
            <div className="min-w-0">
              <p className="truncate text-sm text-gray-600">
                {profile ? "환영합니다!" : "프로필을 불러오는 중이거나 실패했습니다."}
              </p>
              <h2 className="truncate text-base font-semibold text-gray-900">
                {profile ? `${profile.nickname} (${profile.role})` : "로그인 사용자"}
              </h2>
            </div>
          </div>

          {/* 서버 액션으로 로그아웃 */}
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg bg-white/80 px-4 py-2 text-sm font-medium text-gray-800 ring-1 ring-gray-200 shadow-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70"
            >
              로그아웃
            </button>
          </form>
        </div>

        {/* 프로필 카드 (상세 정보) */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-white/90 p-5 ring-1 ring-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">내 프로필</h3>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide
              ${profile?.hasWallet ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"}`}>
              {profile?.hasWallet ? "지갑 연결됨" : "지갑 없음"}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-200">
              <span className="text-gray-500">ID</span>
              <span className="font-medium">{profile?.id ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-200">
              <span className="text-gray-500">주소</span>
              <span className="font-medium truncate">{profile?.address ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-200">
              <span className="text-gray-500">닉네임</span>
              <span className="font-medium">{profile?.nickname ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-200">
              <span className="text-gray-500">역할</span>
              <span className="font-medium">{profile?.role ?? "-"}</span>
            </div>
          </div>

          {/* 실패 시 안내 */}
          {!profile && (
            <p className="mt-3 text-sm text-amber-700">
              프로필을 불러오지 못했어요. 잠시 후 다시 시도하거나 새로고침 해주세요.
            </p>
          )}
        </div>

        <header className="mb-10">
          <p className="text-sm font-medium tracking-wide text-indigo-700/80">
            ONBOARDING
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            사용자 유형을 선택하세요
          </h1>
          <p className="mt-2 text-gray-600">
            역할에 맞는 대시보드로 이동합니다. 언제든 홈으로 돌아와 변경할 수 있어요.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {cards.map(({ href, role, title, desc, Icon, tone }) => (
            <Link
              key={`${href}:${role}`}
              href={href}
              aria-label={`${title} 페이지로 이동`}
              className="group relative overflow-hidden rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-gray-200 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70"
            >
              {/* Top gradient strip */}
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone}`} />

              <div className="flex items-start gap-4">
                {/* Icon bubble */}
                <div className="rounded-xl ring-1 ring-gray-200 bg-gray-50 p-3 transition-all group-hover:scale-105">
                  <Icon className="h-7 w-7 text-gray-700" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-semibold text-gray-900">{title}</h2>
                    <span className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide text-gray-700 border-gray-200 bg-gray-50/80">
                      {role}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">{desc}</p>
                </div>
              </div>

              {/* CTA row */}
              <div className="mt-5 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">자세히 보기</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white transition-all group-hover:gap-1.5 bg-gradient-to-r ${tone} shadow-sm`}>
                  바로 가기
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M3 10a1 1 0 011-1h9.586l-3.293-3.293a1 1 0 111.414-1.414l5.0 5.0a1 1 0 010 1.414l-5.0 5.0a1 1 0 11-1.414-1.414L13.586 11H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </div>

              {/* Glow on hover */}
              <div className={`pointer-events-none absolute -inset-px -z-10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-30 bg-gradient-to-r ${tone}`} />
            </Link>
          ))}
        </section>

        {/* Helper links */}
        <div className="mt-10 text-center text-sm text-gray-600">
          잘 모르겠나요?{" "}
          <Link href="/guide" className="font-medium text-indigo-700 underline-offset-2 hover:underline">
            역할 가이드 보기
          </Link>
        </div>
      </div>
    </main>
  );
}

// app/wallet/page.tsx
import { cookies } from "next/headers";

export default async function WalletPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("app_token")?.value;

  if (!token) {
    return <div>로그인이 필요합니다.</div>;
  }

  // 세 개의 API 요청을 동시에 실행
  const [infoRes, balanceRes, profileRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_IP}/wallet/info`, {
      method: "GET",
      headers: { auth: token },
      cache: "no-store",
    }),
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_IP}/wallet/balance`, {
      method: "GET",
      headers: { auth: token },
      cache: "no-store",
    }),
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_IP}/user/profile`, {
      method: "GET",
      headers: { auth: token },
      cache: "no-store",
    }),
  ]);

  if (!infoRes.ok || !balanceRes.ok || !profileRes.ok) {
    return <div>지갑/프로필 정보를 불러올 수 없습니다.</div>;
  }

  const [info, balance, profile] = await Promise.all([
    infoRes.json(),
    balanceRes.json(),
    profileRes.json(),
  ]);

  return (
    <div>
      <h1>내 지갑 & 프로필</h1>

      <h2>Info</h2>
      <pre>{JSON.stringify(info, null, 2)}</pre>

      <h2>Balance</h2>
      <pre>{JSON.stringify(balance, null, 2)}</pre>

      <h2>Profile</h2>
      <pre>{JSON.stringify(profile, null, 2)}</pre>
    </div>
  );
}

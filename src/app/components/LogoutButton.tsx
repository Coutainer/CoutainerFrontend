"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/session", { method: "DELETE" });
        router.replace("/");
      }}
      className="rounded border px-3 py-1"
    >
      로그아웃
    </button>
  );
}

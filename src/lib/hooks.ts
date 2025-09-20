// src/lib/hooks.ts
import useSWR from "swr";
import { fetcher } from "./fetcher";

// 포인트 잔액
export function usePointBalance() {
  return useSWR<{ balance: number }>("point/balance", fetcher);
}

// SUI 잔액
export function useWalletBalance() {
  return useSWR<{ balance: string }>("wallet/balance", fetcher);
}

// 내 암호화 객체들
export function useMyCryptoObjects() {
  return useSWR<{ items: any[] }>("wallet/my-crypto-objects", fetcher);
}

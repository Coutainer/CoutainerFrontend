"use client";

import { useEffect, useState, useCallback } from "react";

export type Role = "CONSUMER" | "BUSINESS" | string;

export interface Me {
  id: number;
  address: string;
  nickname: string;
  role: Role;
  hasWallet: boolean;
}

const LS_KEY = "me";

export function useUser() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  // 로컬에서 먼저 복구
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setMe(JSON.parse(raw));
    } catch {}
  }, []);

  // 서버에서 최신값 동기화
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (!res.ok) {
        setMe(null);
        localStorage.removeItem(LS_KEY);
        setLoading(false);
        return;
      }
      const data: Me = await res.json();
      setMe(data);
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } finally {
      setLoading(false);
    }
  }, []);

  // 첫 마운트 시 동기화
  useEffect(() => {
    refresh();
  }, [refresh]);

  return { me, loading, refresh, clear: () => { setMe(null); localStorage.removeItem(LS_KEY); } };
}

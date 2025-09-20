export async function fetcher<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/backend/${path.replace(/^\//, "")}`, {
    method: "GET",
    ...init,
    // Route Handler 프록시로 가므로 쿠키 자동 동봉
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

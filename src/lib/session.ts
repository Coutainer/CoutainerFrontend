import { cookies } from "next/headers";
import { env } from "./env";

export async function getTokenFromCookie() {
  const cookieStore = await cookies(); // ✅ Promise 대응
  return cookieStore.get(env.SESSION_COOKIE_NAME)?.value ?? null;
}

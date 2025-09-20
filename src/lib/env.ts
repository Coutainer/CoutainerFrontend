export const env = {
  FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL!,
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL!,
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME ?? "app_session",
};

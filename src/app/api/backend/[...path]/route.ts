//import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path);
}
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path);
}
export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path);
}
export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path);
}
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path);
}

async function forward(req: NextRequest, path: string[]) {
  const token = req.cookies.get(env.SESSION_COOKIE_NAME)?.value;
  const url = new URL(`${env.BACKEND_URL}/${path.join("/")}`);
  url.search = new URL(req.url).search; // 쿼리 전달

  const init: RequestInit = {
    method: req.method,
    headers: {
      "Content-Type": req.headers.get("content-type") ?? "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer(),
  };

  const res = await fetch(url.toString(), init);
  const body = await res.arrayBuffer();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}

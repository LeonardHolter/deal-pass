import { NextRequest, NextResponse } from "next/server";

const KV_URL = process.env.KV_REST_API_URL!;
const KV_TOKEN = process.env.KV_REST_API_TOKEN!;

const KEY = "pass-on:count";

async function redis(cmd: string[]) {
  const res = await fetch(`${KV_URL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  return res.json();
}

export async function GET() {
  const data = await redis(["GET", KEY]);
  const count = parseInt(data.result, 10) || 0;
  return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const { action } = await request.json();

  if (action === "increment") {
    const data = await redis(["INCR", KEY]);
    return NextResponse.json({ count: data.result });
  }

  if (action === "decrement") {
    // Don't go below 0
    const current = await redis(["GET", KEY]);
    const val = parseInt(current.result, 10) || 0;
    if (val <= 0) return NextResponse.json({ count: 0 });
    const data = await redis(["DECR", KEY]);
    return NextResponse.json({ count: Math.max(0, data.result) });
  }

  return NextResponse.json({ error: "invalid action" }, { status: 400 });
}

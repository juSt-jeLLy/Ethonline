// supabase/functions/blockscout/index.ts
import { serve } from "https://deno.land/std/http/server.ts";

const BLOCKSCOUT_API_KEY = Deno.env.get("BLOCKSCOUT_API_KEY") ?? "";

const ALLOWED_ORIGINS = new Set([
  "http://localhost:8080",   // for local testing
  "https://paystream.cc",    // ✅ your production domain
]);

function corsHeaders(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.has(origin)
    ? origin
    : "https://paystream.cc";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const headers = corsHeaders(origin);

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    const url = new URL(req.url);
    const hash = url.searchParams.get("hash");
    if (!hash) {
      return new Response(JSON.stringify({ error: "Missing ?hash=" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const base = "https://optimism-sepolia.blockscout.com";
    const target = `${base}/api/v2/transactions/${hash}`;

    const r = await fetch(target, {
      headers: {
        accept: "application/json",
        ...(BLOCKSCOUT_API_KEY ? { "X-API-KEY": BLOCKSCOUT_API_KEY } : {}),
      },
    });

    const body = await r.text();
    return new Response(body, {
      status: r.status,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});

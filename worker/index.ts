export interface Env {
  ASSETS?: Fetcher;
  DB?: D1Database;
  AI?: Ai;
  KV?: KVNamespace;
}

/**
 * Worker principal (Static Assets + API /api/v1/*).
 * Cumple CA-00 sin exponer secretos ni PII.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/v1/health/system" && request.method === "GET") {
      return Response.json(
        {
          ok: true,
          service: "aduana-ia-fork",
          runtime: "cloudflare-workers-assets",
          timestamp_utc: new Date().toISOString(),
          bindings: {
            db_configured: Boolean(env?.DB),
            ai_configured: Boolean(env?.AI),
            kv_configured: Boolean(env?.KV),
          },
        },
        {
          status: 200,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    if (url.pathname.startsWith("/api/")) {
      return Response.json(
        { ok: false, error: "Ruta API no encontrada" },
        { status: 404 }
      );
    }

    if (env?.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};


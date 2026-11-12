import { describe, expect, it } from "vitest";
import worker, { type Env } from "../worker/index";

describe("CA-00: Health Probe Cloudflare Worker", () => {
  it("retorna HTTP 200 y contrato booleano de bindings sin secretos", async () => {
    const request = new Request("https://aduana-ia-fork.workers.dev/api/v1/health/system");
    const response = await worker.fetch(request, {} as Env);

    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      ok: boolean;
      service: string;
      runtime: string;
      timestamp_utc: string;
      bindings: {
        db_configured: boolean;
        ai_configured: boolean;
        kv_configured: boolean;
      };
    };

    expect(body.ok).toBe(true);
    expect(body.service).toBe("aduana-ia-fork");
    expect(body.runtime).toBe("cloudflare-workers-assets");
    expect(Number.isNaN(Date.parse(body.timestamp_utc))).toBe(false);
    expect(body.bindings).toEqual({
      db_configured: false,
      ai_configured: false,
      kv_configured: false,
    });
  });

  it("retorna HTTP 404 para rutas /api/* inexistentes", async () => {
    const request = new Request("https://aduana-ia-fork.workers.dev/api/v1/unknown");
    const response = await worker.fetch(request, {} as Env);
    expect(response.status).toBe(404);
  });
});

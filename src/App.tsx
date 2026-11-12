import { useCallback, useEffect, useState } from "react";

interface HealthPayload {
  ok: boolean;
  service: string;
  runtime: string;
  timestamp_utc: string;
  bindings: {
    db_configured: boolean;
    ai_configured: boolean;
    kv_configured: boolean;
  };
}

export function App() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/health/system");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as HealthPayload;
      setHealth(data);
    } catch (err) {
      setHealth(null);
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  return (
    <main className="layout">
      <section className="card">
        <h1>Aduana IA — Base React + Cloudflare Workers</h1>
        <p className="subtitle">
          Verificación de despliegue estático (Vite + React) y API Edge (Cloudflare Worker + Assets).
        </p>
      </section>

      <section className="card" aria-live="polite">
        <div className="row">
          <div>
            <strong>Estado de /api/v1/health/system: </strong>
            {loading && <span className="badge">Consultando...</span>}
            {!loading && health?.ok && <span className="badge badge-ok">OPERATIVO</span>}
            {!loading && error && <span className="badge badge-err">ERROR: {error}</span>}
          </div>
          <button type="button" onClick={() => void checkHealth()} disabled={loading}>
            Reintentar
          </button>
        </div>

        {health && <pre>{JSON.stringify(health, null, 2)}</pre>}
      </section>
    </main>
  );
}


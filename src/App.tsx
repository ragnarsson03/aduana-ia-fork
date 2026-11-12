import { useCallback, useEffect, useState } from "react";
import { AuditPanel } from "./components/AuditPanel";
import { OfficialPanel } from "./components/OfficialPanel";
import { INITIAL_LEDGER_BLOCKS } from "./data/previewFixtures";
import type { LedgerBlockRow } from "./types/aduana";

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

type ActiveTab = "official" | "audit" | "health";

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("official");
  const [blocks, setBlocks] = useState<LedgerBlockRow[]>([...INITIAL_LEDGER_BLOCKS]);
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);

  const checkHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const response = await fetch("/api/v1/health/system");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as HealthPayload;
      setHealth(data);
    } catch (err) {
      setHealth(null);
      setHealthError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  const handleSealBlock = (newBlock: LedgerBlockRow) => {
    setBlocks((prev) => [...prev, newBlock]);
  };

  const handleSimulateTamper = () => {
    setBlocks((prev) =>
      prev.map((block, idx) =>
        idx === prev.length - 1
          ? {
              ...block,
              human_decision: "PRIORIDAD_ALTA",
              tampered: true,
            }
          : block
      )
    );
  };

  const handleRestoreBlocks = () => {
    setBlocks([...INITIAL_LEDGER_BLOCKS]);
  };

  return (
    <div className="layout">
      <header className="card header-card">
        <div className="row">
          <div>
            <h1>🛡️ Aduana IA — Pasarela Soberana Zero-Trust</h1>
            <p className="subtitle">
              Avance de interfaz dual (React + Vite) sobre Cloudflare Workers.{" "}
              <strong>Nota:</strong> <code>/api/v1/health/system</code> es real en vivo; el pipeline de las 5 etapas corre en vista previa local hasta conectar D1 y Workers AI.
            </p>
          </div>
          <div className="status-pill">
            {healthLoading && <span className="badge">Worker...</span>}
            {!healthLoading && health?.ok && <span className="badge badge-ok">Worker LIVE</span>}
            {!healthLoading && healthError && <span className="badge badge-err">Worker Offline</span>}
          </div>
        </div>

        <nav className="tabs" role="tablist" aria-label="Paneles de Aduana IA">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "official"}
            className={activeTab === "official" ? "tab active" : "tab"}
            onClick={() => setActiveTab("official")}
          >
            Panel del Funcionario
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "audit"}
            className={activeTab === "audit" ? "tab active" : "tab"}
            onClick={() => setActiveTab("audit")}
          >
            Panel de Contraloría ({blocks.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "health"}
            className={activeTab === "health" ? "tab active" : "tab"}
            onClick={() => setActiveTab("health")}
          >
            Diagnóstico Edge
          </button>
        </nav>
      </header>

      {activeTab === "official" && (
        <OfficialPanel ledgerCount={blocks.length} onSealBlock={handleSealBlock} />
      )}

      {activeTab === "audit" && (
        <AuditPanel
          blocks={blocks}
          onSimulateTamper={handleSimulateTamper}
          onRestoreBlocks={handleRestoreBlocks}
        />
      )}

      {activeTab === "health" && (
        <section className="card" aria-live="polite">
          <div className="row">
            <h2>Diagnóstico en vivo: /api/v1/health/system</h2>
            <button type="button" onClick={() => void checkHealth()} disabled={healthLoading}>
              Actualizar
            </button>
          </div>
          {healthError && <p className="badge badge-err">Error: {healthError}</p>}
          {health && <pre>{JSON.stringify(health, null, 2)}</pre>}
        </section>
      )}
    </div>
  );
}

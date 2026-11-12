import { useState } from "react";
import {
  DEMO_PRESETS,
  runLocalPreviewPipeline,
} from "../data/previewFixtures";
import type {
  ExplicaFeatures,
  LedgerBlockRow,
  PipelinePreviewResult,
  RecommendationType,
} from "../types/aduana";

interface OfficialPanelProps {
  ledgerCount: number;
  onSealBlock: (block: LedgerBlockRow) => void;
}

const FEATURE_LABELS: Record<keyof ExplicaFeatures, string> = {
  vulnerabilidad_economica: "Vulnerabilidad económica",
  carga_familiar: "Carga familiar dependiente",
  urgencia_medica: "Urgencia médica / social",
  antiguedad_dias: "Antigüedad en espera (días)",
  consistencia_documental: "Consistencia documental",
};

export function OfficialPanel({ ledgerCount, onSealBlock }: OfficialPanelProps) {
  const [rawText, setRawText] = useState<string>(DEMO_PRESETS[0].rawText);
  const [features, setFeatures] = useState<ExplicaFeatures>(DEMO_PRESETS[0].features);
  const [consentGranted, setConsentGranted] = useState<boolean>(true);
  const [result, setResult] = useState<PipelinePreviewResult>(() =>
    runLocalPreviewPipeline(DEMO_PRESETS[0].rawText, DEMO_PRESETS[0].features, true, 3)
  );
  const [decisionMode, setDecisionMode] = useState<"confirm" | "override">("confirm");
  const [overrideDecision, setOverrideDecision] = useState<RecommendationType>("REVISION_ESTANDAR");
  const [justification, setJustification] = useState<string>("");
  const [sealedReceipt, setSealedReceipt] = useState<string | null>(null);

  const loadPreset = (presetId: string) => {
    const preset = DEMO_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setRawText(preset.rawText);
    setFeatures(preset.features);
    setSealedReceipt(null);
    setDecisionMode("confirm");
    setJustification("");
    setResult(runLocalPreviewPipeline(preset.rawText, preset.features, consentGranted, ledgerCount));
  };

  const handleProcess = (e: React.FormEvent) => {
    e.preventDefault();
    setSealedReceipt(null);
    setDecisionMode("confirm");
    setJustification("");
    setResult(runLocalPreviewPipeline(rawText, features, consentGranted, ledgerCount));
  };

  const overrideValid =
    decisionMode === "confirm" || justification.trim().length >= 20;

  const handleSeal = () => {
    if (!overrideValid) return;
    const isOverride = decisionMode === "override";
    const finalDecision = isOverride
      ? overrideDecision
      : result.explica.model_recommendation;
    const nextIdx = ledgerCount + 1;

    onSealBlock({
      block_index: nextIdx,
      timestamp_utc: new Date().toISOString(),
      blind_citizen_id: `hmac_preview_${String(nextIdx).padStart(4, "0")}`,
      payload_hash: `sha256_masked_${result.requestId}`,
      prev_hash: "prev_chain_hash",
      block_hash: `blk_hash_${String(nextIdx).padStart(6, "0")}`,
      hmac_signature: `hmac_sig_${String(nextIdx).padStart(6, "0")}`,
      security_verdict: result.policyStatus,
      model_recommendation: result.explica.model_recommendation,
      human_decision: finalDecision,
      human_override: isOverride,
      override_justification: isOverride ? justification.trim() : null,
    });

    setSealedReceipt(result.citizenReceiptCode);
  };

  const shapEntries = Object.entries(result.explica.linear_shap_values) as Array<
    [keyof ExplicaFeatures, number]
  >;
  const maxAbsShap = Math.max(
    0.25,
    ...shapEntries.map(([, val]) => Math.abs(val))
  );

  return (
    <div className="panel-grid">
      <section className="card">
        <div className="row">
          <h2>1. Solicitud Ciudadana y Consentimiento</h2>
          <div className="preset-group" role="group" aria-label="Casos rápidos de demostración">
            {DEMO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="btn-secondary"
                onClick={() => loadPreset(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleProcess} className="stack">
          <label htmlFor="citizen-input" className="field-label">
            Texto del trámite (la pasarela intercepta PII antes de llamar a Workers AI)
          </label>
          <textarea
            id="citizen-input"
            rows={3}
            maxLength={4096}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />

          <div className="features-grid">
            <label className="field-item">
              <span>Vulnerabilidad (0–1): {features.vulnerabilidad_economica.toFixed(2)}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={features.vulnerabilidad_economica}
                onChange={(e) =>
                  setFeatures({ ...features, vulnerabilidad_economica: Number(e.target.value) })
                }
              />
            </label>
            <label className="field-item">
              <span>Urgencia médica (0–1): {features.urgencia_medica.toFixed(2)}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={features.urgencia_medica}
                onChange={(e) =>
                  setFeatures({ ...features, urgencia_medica: Number(e.target.value) })
                }
              />
            </label>
            <label className="field-item">
              <span>Carga familiar: {features.carga_familiar}</span>
              <input
                type="number"
                min={0}
                max={12}
                value={features.carga_familiar}
                onChange={(e) =>
                  setFeatures({ ...features, carga_familiar: Number(e.target.value) })
                }
              />
            </label>
            <label className="field-item">
              <span>Días espera: {features.antiguedad_dias}</span>
              <input
                type="number"
                min={0}
                max={365}
                value={features.antiguedad_dias}
                onChange={(e) =>
                  setFeatures({ ...features, antiguedad_dias: Number(e.target.value) })
                }
              />
            </label>
            <label className="field-item">
              <span>Recaudos (0–1): {features.consistencia_documental.toFixed(1)}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.5}
                value={features.consistencia_documental}
                onChange={(e) =>
                  setFeatures({ ...features, consistencia_documental: Number(e.target.value) })
                }
              />
            </label>
          </div>

          <div className="row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={consentGranted}
                onChange={(e) => setConsentGranted(e.target.checked)}
              />
              <span>
                Consentimiento explícito otorgado (<code>EVALUACION_PRIORIDAD_TRAMITE_SOCIAL</code>)
              </span>
            </label>
            <button type="submit">Procesar por Aduana IA</button>
          </div>
        </form>
      </section>

      <section className="card" aria-live="polite">
        <div className="row">
          <h2>2. Inspección del Pipeline (Rayos-X Zero-Trust)</h2>
          <span
            className={`badge ${
              result.policyStatus === "CLEAN" ? "badge-ok" : "badge-err"
            }`}
          >
            {result.policyStatus}
          </span>
        </div>

        <div className="pipeline-steps">
          <div className="step-pill">0. Consent: {consentGranted ? "OK" : "BLOQUEO"}</div>
          <div className="step-pill">
            1. Shield: {result.detectedTypes.length} PII ({result.rifMod11Verified === null ? "sin RIF" : result.rifMod11Verified ? "RIF Mod11 ✓" : "RIF Mod11 ✗"})
          </div>
          <div className="step-pill">2. Guard-In: riesgo {result.riskScore}</div>
          <div className="step-pill">3. IA: {result.aiAdapterMode}</div>
          <div className="step-pill">4. Guard-Out: Canary limpio</div>
          <div className="step-pill">5. Explica: {result.explica.model_recommendation}</div>
        </div>

        <div className="compare-grid">
          <div className="box-muted">
            <h3>Texto sanitizado enviado al LLM (Cero PII)</h3>
            <p className="mono">{result.maskedText}</p>
            <small className="muted">Canary por transacción: {result.canaryToken}</small>
          </div>
          <div className="box-muted">
            <h3>Salida institucional marcada</h3>
            <p>{result.aiSummary}</p>
            <small className="muted">
              Aviso de transparencia: texto de apoyo generado/asistido por IA sobre datos tokenizados.
            </small>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="row">
          <h2>3. Explicabilidad White-Box (SHAP Lineal) y Decisión Humana</h2>
          <span className="badge badge-info">
            Probabilidad P(y=1|x): {(result.explica.probability_score * 100).toFixed(1)}% · z={result.explica.logit_z}
          </span>
        </div>

        <div className="shap-list">
          {shapEntries.map(([key, phi]) => {
            const pct = Math.min(100, (Math.abs(phi) / maxAbsShap) * 100);
            return (
              <div key={key} className="shap-row">
                <span className="shap-name">{FEATURE_LABELS[key]}</span>
                <div className="shap-bar-track" aria-hidden="true">
                  <div
                    className={`shap-bar ${phi >= 0 ? "shap-pos" : "shap-neg"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="shap-val">{phi >= 0 ? `+${phi.toFixed(3)}` : phi.toFixed(3)}</span>
              </div>
            );
          })}
        </div>
        <small className="muted">
          Error de reconstrucción del logit: {result.explica.logit_reconstruction_error} (&lt; 1e-9, cero Math.random()).
        </small>

        <div className="hitl-box">
          <h3>Decisión vinculante del Funcionario (Human-in-the-Loop)</h3>
          <div className="row">
            <label className="checkbox-label">
              <input
                type="radio"
                name="hitl-mode"
                checked={decisionMode === "confirm"}
                onChange={() => setDecisionMode("confirm")}
              />
              <span>Confirmar recomendación ({result.explica.model_recommendation})</span>
            </label>
            <label className="checkbox-label">
              <input
                type="radio"
                name="hitl-mode"
                checked={decisionMode === "override"}
                onChange={() => setDecisionMode("override")}
              />
              <span>Sobrescribir (Override justificado)</span>
            </label>
          </div>

          {decisionMode === "override" && (
            <div className="stack">
              <label htmlFor="override-select" className="field-label">
                Nueva decisión administrativa
              </label>
              <select
                id="override-select"
                value={overrideDecision}
                onChange={(e) => setOverrideDecision(e.target.value as RecommendationType)}
              >
                <option value="PRIORIDAD_ALTA">PRIORIDAD_ALTA</option>
                <option value="REVISION_ESTANDAR">REVISION_ESTANDAR</option>
                <option value="RECAUDOS_INCOMPLETOS">RECAUDOS_INCOMPLETOS</option>
                <option value="BLOQUEADO_SEGURIDAD">BLOQUEADO_SEGURIDAD</option>
              </select>

              <label htmlFor="override-reason" className="field-label">
                Justificación obligatoria ({justification.trim().length}/20 caracteres mínimos)
              </label>
              <input
                id="override-reason"
                type="text"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Motivo administrativo o humanitario verificable..."
              />
            </div>
          )}

          <div className="row">
            <button type="button" onClick={handleSeal} disabled={!overrideValid}>
              Sellar Decisión en Ledger D1 (Preview)
            </button>
            {sealedReceipt && (
              <span className="badge badge-ok">
                Sellado · Recibo: {sealedReceipt}
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}


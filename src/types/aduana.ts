export type PolicyStatus =
  | "CLEAN"
  | "BLOCKED_INJECTION"
  | "BLOCKED_CANARY_LEAK"
  | "BLOCKED_NO_CONSENT"
  | "BLOCKED_PII_LEAK";

export type RecommendationType =
  | "PRIORIDAD_ALTA"
  | "REVISION_ESTANDAR"
  | "RECAUDOS_INCOMPLETOS"
  | "BLOQUEADO_SEGURIDAD";

export interface ExplicaFeatures {
  vulnerabilidad_economica: number;
  carga_familiar: number;
  urgencia_medica: number;
  antiguedad_dias: number;
  consistencia_documental: number;
}

export interface ExplicaPreview {
  logit_z: number;
  probability_score: number;
  intercept_b0: number;
  feature_contributions_bx: Record<keyof ExplicaFeatures, number>;
  linear_shap_values: Record<keyof ExplicaFeatures, number>;
  logit_reconstruction_error: number;
  model_recommendation: RecommendationType;
}

export interface DemoPreset {
  id: "caso_medico" | "ataque_injection" | "ataque_base64";
  label: string;
  tag: string;
  rawText: string;
  features: ExplicaFeatures;
}

export interface PipelinePreviewResult {
  requestId: string;
  policyStatus: PolicyStatus;
  maskedText: string;
  detectedTypes: string[];
  rifMod11Verified: boolean | null;
  riskScore: number;
  matchedPatterns: string[];
  canaryToken: string;
  aiSummary: string;
  aiAdapterMode: string;
  explica: ExplicaPreview;
  citizenReceiptCode: string;
}

export interface LedgerBlockRow {
  block_index: number;
  timestamp_utc: string;
  blind_citizen_id: string;
  payload_hash: string;
  prev_hash: string;
  block_hash: string;
  hmac_signature: string;
  security_verdict: PolicyStatus;
  model_recommendation: RecommendationType;
  human_decision: RecommendationType;
  human_override: boolean;
  override_justification: string | null;
  tampered?: boolean;
}


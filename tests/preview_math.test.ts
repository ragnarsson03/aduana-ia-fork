import { describe, expect, it } from "vitest";
import {
  computeExplicaPreview,
  verifyRifMod11,
} from "../src/data/previewFixtures";

describe("Preview Math & Módulo 11 SENIAT", () => {
  it("valida dígito verificador Módulo 11 SENIAT en RIF venezolano", () => {
    expect(verifyRifMod11("V-19876543-7")).toBe(true);
    expect(verifyRifMod11("V-19876543-0")).toBe(false);
  });

  it("reconstruye logit_z en EXPLICA con error < 1e-9 sin Math.random", () => {
    const res = computeExplicaPreview({
      vulnerabilidad_economica: 0.85,
      carga_familiar: 3,
      urgencia_medica: 0.9,
      antiguedad_dias: 45,
      consistencia_documental: 1,
    });
    expect(res.logit_reconstruction_error).toBeLessThan(1e-9);
    expect(res.probability_score).toBeGreaterThan(0.7);
    expect(res.model_recommendation).toBe("PRIORIDAD_ALTA");
  });
});

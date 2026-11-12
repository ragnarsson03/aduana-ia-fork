-- Esquema Cloudflare D1 (SQLite en el Edge) — Aduana IA
-- Cumple SPEC.md (Sección 7) y RF-15 / RNF-06: cero PII en texto plano y registro Append-Only.

CREATE TABLE IF NOT EXISTS ledger_blocks (
  block_index INTEGER PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  timestamp_utc TEXT NOT NULL,
  blind_citizen_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  prev_hash TEXT NOT NULL,
  block_hash TEXT NOT NULL,
  hmac_signature TEXT NOT NULL,
  security_verdict TEXT NOT NULL,
  model_recommendation TEXT NOT NULL,
  human_decision TEXT NOT NULL,
  human_override INTEGER NOT NULL DEFAULT 0 CHECK (human_override IN (0, 1)),
  override_justification TEXT,
  citizen_receipt_code TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_ledger_blind_citizen
  ON ledger_blocks (blind_citizen_id, timestamp_utc);

-- Protección Append-Only contra manipulación accidental o SQLi en operación normal
CREATE TRIGGER IF NOT EXISTS trg_ledger_no_update
BEFORE UPDATE ON ledger_blocks
BEGIN
  SELECT RAISE(ABORT, 'ERR_IMMUTABLE_LEDGER: Prohibido modificar bloques del Ledger');
END;

CREATE TRIGGER IF NOT EXISTS trg_ledger_no_delete
BEFORE DELETE ON ledger_blocks
BEGIN
  SELECT RAISE(ABORT, 'ERR_IMMUTABLE_LEDGER: Prohibido eliminar bloques del Ledger');
END;


# SPEC 00 — Health Probe & Base Cloudflare Workers + React

## Propósito
Validar el despliegue integral de frontend React (compilado en `dist/` como Static Assets) junto con Cloudflare Worker (`worker/index.ts`) usando `npx wrangler deploy`.

## Invariantes de Seguridad
- Sin llaves, secretos ni PII en respuesta de diagnóstico.
- Sin llamadas a CDNs externos en el frontend (`index.html`, `src/styles.css`).
- Cero `Math.random()`.

## Contrato
`GET /api/v1/health/system` → HTTP `200` JSON:
- `ok`: `true`
- `service`: `"aduana-ia-fork"`
- `runtime`: `"cloudflare-workers-assets"`
- `timestamp_utc`: ISO-8601 UTC string
- `bindings`: `{ db_configured: boolean, ai_configured: boolean, kv_configured: boolean }`

## Criterio de Aceptación
- **CA-00:** Dado un request `GET /api/v1/health/system`, cuando el Worker responda, entonces retorna HTTP `200`, `ok === true`, `runtime === "cloudflare-workers-assets"` y el estado booleano de los bindings sin exponer credenciales.

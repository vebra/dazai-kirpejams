import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * HMAC žetonas užsakymo peržiūrai be prisijungimo.
 *
 * Naudojimas: patvirtinimo el. laiške įterpiamas `Peržiūrėti užsakymą`
 * mygtukas su nuoroda `/uzsakymas/{nr}?token=...`. Žetonas suriša
 * konkretų užsakymo numerį su galiojimo data — neleidžia matyti kitų
 * užsakymų ir pasibaigia po 30 dienų.
 *
 * Saugumas: pasirašoma per HMAC-SHA256 su SUPABASE_SERVICE_ROLE_KEY
 * (jau saugomas slaptas raktas; nereikia naujo env). Žetono nuotekis
 * leistų peržiūrėti TIK to vieno užsakymo PII — taip pat kaip ir
 * sausainukas-snapshot'as šiandien.
 */

const TTL_SECONDS = 60 * 60 * 24 * 30 // 30 dienų

function getSecret(): string | null {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  return k && k.length >= 32 ? k : null
}

function b64url(buf: Buffer): string {
  return buf.toString('base64url')
}

function b64urlDecodeSafe(s: string): Buffer | null {
  try {
    return Buffer.from(s, 'base64url')
  } catch {
    return null
  }
}

export function createOrderViewToken(
  orderNumber: string,
  nowSec: number = Math.floor(Date.now() / 1000)
): string | null {
  const secret = getSecret()
  if (!secret) return null
  const exp = nowSec + TTL_SECONDS
  const payload = `${orderNumber}:${exp}`
  const sig = createHmac('sha256', secret).update(payload).digest()
  return `${b64url(Buffer.from(payload, 'utf8'))}.${b64url(sig)}`
}

export function verifyOrderViewToken(
  token: string,
  orderNumber: string,
  nowSec: number = Math.floor(Date.now() / 1000)
): boolean {
  const secret = getSecret()
  if (!secret) return false
  const dot = token.indexOf('.')
  if (dot <= 0 || dot === token.length - 1) return false
  const payloadBuf = b64urlDecodeSafe(token.slice(0, dot))
  const sigBuf = b64urlDecodeSafe(token.slice(dot + 1))
  if (!payloadBuf || !sigBuf) return false
  const payload = payloadBuf.toString('utf8')
  const colon = payload.lastIndexOf(':')
  if (colon <= 0) return false
  const tokenOrderNumber = payload.slice(0, colon)
  const exp = Number(payload.slice(colon + 1))
  if (tokenOrderNumber !== orderNumber) return false
  if (!Number.isFinite(exp) || exp < nowSec) return false
  const expected = createHmac('sha256', secret).update(payload).digest()
  if (sigBuf.length !== expected.length) return false
  return timingSafeEqual(sigBuf, expected)
}

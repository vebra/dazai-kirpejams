import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * HMAC žetonas marketingo laiškų atsisakymui be prisijungimo.
 *
 * Naudojimas: kampanijos laiško footer'yje (ir List-Unsubscribe header'yje)
 * įterpiama nuoroda `/api/marketing/atsisakyti?u={userId}&t={token}`.
 * Žetonas suriša konkretų vartotoją su galiojimo data — negalima atsisakyti
 * už kitą vartotoją.
 *
 * Tas pats šablonas kaip orders/view-token.ts (HMAC-SHA256 su
 * SUPABASE_SERVICE_ROLE_KEY), tik su 'unsub' domeno prefiksu payload'e,
 * kad žetonų nebūtų galima panaudoti kryžmai. TTL ilgas (365 d.) —
 * atsisakymo nuoroda sename laiške privalo veikti ir po mėnesių.
 */

const TTL_SECONDS = 60 * 60 * 24 * 365 // 365 dienos

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

export function createUnsubscribeToken(
  userId: string,
  nowSec: number = Math.floor(Date.now() / 1000)
): string | null {
  const secret = getSecret()
  if (!secret) return null
  const exp = nowSec + TTL_SECONDS
  const payload = `unsub:${userId}:${exp}`
  const sig = createHmac('sha256', secret).update(payload).digest()
  return `${b64url(Buffer.from(payload, 'utf8'))}.${b64url(sig)}`
}

export function verifyUnsubscribeToken(
  token: string,
  userId: string,
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
  const parts = payload.split(':')
  if (parts.length !== 3 || parts[0] !== 'unsub') return false
  const exp = Number(parts[2])
  if (parts[1] !== userId) return false
  if (!Number.isFinite(exp) || exp < nowSec) return false
  const expected = createHmac('sha256', secret).update(payload).digest()
  if (sigBuf.length !== expected.length) return false
  return timingSafeEqual(sigBuf, expected)
}

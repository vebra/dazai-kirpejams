import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createHmac } from 'node:crypto'
import {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
} from './unsubscribe-token'

// HMAC raktas testams — kaip view-token.test.ts, NE tikra paslaptis.
const FAKE_SECRET = 'x'.repeat(64)
const USER_ID = 'a2f3c1d4-0000-4111-8222-333344445555'
const OTHER_USER_ID = 'b1e2d3c4-0000-4111-8222-999988887777'

beforeEach(() => {
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', FAKE_SECRET)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('createUnsubscribeToken', () => {
  it('grąžina null be secret', () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
    expect(createUnsubscribeToken(USER_ID)).toBeNull()
  })

  it('grąžina payload.signature formos žetoną', () => {
    const token = createUnsubscribeToken(USER_ID)!
    expect(token.split('.').length).toBe(2)
  })
})

describe('verifyUnsubscribeToken', () => {
  it('round-trip: tinkamą žetoną patvirtina', () => {
    const token = createUnsubscribeToken(USER_ID)!
    expect(verifyUnsubscribeToken(token, USER_ID)).toBe(true)
  })

  it('atmeta žetoną kitam vartotojui (cross-user)', () => {
    const token = createUnsubscribeToken(USER_ID)!
    expect(verifyUnsubscribeToken(token, OTHER_USER_ID)).toBe(false)
  })

  it('atmeta order view-token formos payload (domenų atskyrimas per unsub prefiksą)', () => {
    // Payload be 'unsub:' prefikso, bet su galiojančiu HMAC — turi kristi
    // per parts[0] !== 'unsub' patikrą, net jei parašas techniškai teisingas.
    const exp = Math.floor(Date.now() / 1000) + 1000
    const payload = `${USER_ID}:${exp}`
    const sig = createHmac('sha256', FAKE_SECRET).update(payload).digest()
    const forged = `${Buffer.from(payload).toString('base64url')}.${sig.toString('base64url')}`
    expect(verifyUnsubscribeToken(forged, USER_ID)).toBe(false)
  })

  it('atmeta sugadintą parašą', () => {
    const token = createUnsubscribeToken(USER_ID)!
    const [payload] = token.split('.')
    expect(
      verifyUnsubscribeToken(`${payload}.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxw`, USER_ID)
    ).toBe(false)
  })

  it('atmeta pasibaigusį žetoną (exp praeityje)', () => {
    const overYearAgo = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 366
    const token = createUnsubscribeToken(USER_ID, overYearAgo)!
    expect(verifyUnsubscribeToken(token, USER_ID)).toBe(false)
  })

  it('atmeta žetoną su kitu secretu', () => {
    const token = createUnsubscribeToken(USER_ID)!
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'y'.repeat(64))
    expect(verifyUnsubscribeToken(token, USER_ID)).toBe(false)
  })
})

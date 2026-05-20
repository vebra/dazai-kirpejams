import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createOrderViewToken, verifyOrderViewToken } from './view-token'

// HMAC raktas testams — pakankamai ilgas, kad praeitų `length >= 32` patikrą
// view-token.ts. NE tikra paslaptis — naudojama tik testuose.
const FAKE_SECRET = 'x'.repeat(64)
const ORDER = 'DK-260520-160345'

beforeEach(() => {
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', FAKE_SECRET)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('createOrderViewToken', () => {
  it('grąžina null, kai SERVICE_ROLE secret nesukonfigūruotas', () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
    expect(createOrderViewToken(ORDER)).toBeNull()
  })

  it('grąžina null, kai SERVICE_ROLE per trumpas (<32 simb.)', () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'short')
    expect(createOrderViewToken(ORDER)).toBeNull()
  })

  it('grąžina ne tuščią žetoną su tinkamu secretu', () => {
    const token = createOrderViewToken(ORDER)
    expect(token).not.toBeNull()
    expect(token!.length).toBeGreaterThan(20)
  })

  it('žetonas turi payload.signature formą (vienas taškas)', () => {
    const token = createOrderViewToken(ORDER)!
    const parts = token.split('.')
    expect(parts.length).toBe(2)
    expect(parts[0].length).toBeGreaterThan(0)
    expect(parts[1].length).toBeGreaterThan(0)
  })
})

describe('verifyOrderViewToken', () => {
  it('round-trip: tinkamą žetoną patvirtina', () => {
    const token = createOrderViewToken(ORDER)!
    expect(verifyOrderViewToken(token, ORDER)).toBe(true)
  })

  it('atmeta žetoną kitam užsakymo numeriui (cross-order)', () => {
    const token = createOrderViewToken(ORDER)!
    expect(verifyOrderViewToken(token, 'DK-999999-000001')).toBe(false)
  })

  it('atmeta sugadintą parašą', () => {
    const token = createOrderViewToken(ORDER)!
    const [payload] = token.split('.')
    const tampered = `${payload}.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxw`
    expect(verifyOrderViewToken(tampered, ORDER)).toBe(false)
  })

  it('atmeta sugadintą payload (nepakeitus parašo)', () => {
    const token = createOrderViewToken(ORDER)!
    const [, sig] = token.split('.')
    // pakeičiam payload į kitą order_number, parašas lieka senas
    const otherPayload = Buffer.from(`DK-XXXX-OTHER:${Math.floor(Date.now() / 1000) + 1000}`).toString('base64url')
    const tampered = `${otherPayload}.${sig}`
    expect(verifyOrderViewToken(tampered, ORDER)).toBe(false)
  })

  it('atmeta nesusiformavusį žetoną (be taško)', () => {
    expect(verifyOrderViewToken('nodot', ORDER)).toBe(false)
  })

  it('atmeta tuščią arba beveik tuščią žetoną', () => {
    expect(verifyOrderViewToken('', ORDER)).toBe(false)
    expect(verifyOrderViewToken('.', ORDER)).toBe(false)
    expect(verifyOrderViewToken('a.', ORDER)).toBe(false)
    expect(verifyOrderViewToken('.b', ORDER)).toBe(false)
  })

  it('atmeta pasibaigusį žetoną (exp praeityje)', () => {
    const longAgo = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 31
    const token = createOrderViewToken(ORDER, longAgo)!
    expect(verifyOrderViewToken(token, ORDER)).toBe(false)
  })

  it('priima ką tik sukurtą žetoną ant lygiai 30 d. ribos', () => {
    // exp = now + 30 d. — verifikacija po 1 sek. dar leistina
    const token = createOrderViewToken(ORDER)!
    const justAfter = Math.floor(Date.now() / 1000) + 1
    expect(verifyOrderViewToken(token, ORDER, justAfter)).toBe(true)
  })

  it('atmeta žetoną sukurtą su kitu secretu (raktų rotacija = senas žetonas miršta)', () => {
    const token = createOrderViewToken(ORDER)!
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'y'.repeat(64)) // pakeitėm raktą
    expect(verifyOrderViewToken(token, ORDER)).toBe(false)
  })

  it('grąžina false, jei secret nesukonfigūruotas verifikacijos metu', () => {
    const token = createOrderViewToken(ORDER)!
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
    expect(verifyOrderViewToken(token, ORDER)).toBe(false)
  })
})

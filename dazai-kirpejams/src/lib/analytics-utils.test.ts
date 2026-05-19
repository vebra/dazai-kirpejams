// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  hasConsent,
  canTrack,
  analyticsEnabled,
  isProductionHost,
  dedupeOncePerSession,
  safeCall,
} from './analytics-utils'

// jsdom default URL is http://localhost/ — i.e. a non-production host.
// This file pins the "preview / localhost" behaviour: analytics must stay
// off regardless of consent, so we never pollute production stats with
// bot/preview traffic.

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  delete process.env.NEXT_PUBLIC_ENABLE_ANALYTICS
})

describe('hasConsent', () => {
  it('is false when no consent cookie is stored', () => {
    expect(hasConsent()).toBe(false)
  })

  it('is true only for the exact "accepted" value', () => {
    localStorage.setItem('cookie-consent-v1', 'accepted')
    expect(hasConsent()).toBe(true)
  })

  it('is false for any other stored value', () => {
    localStorage.setItem('cookie-consent-v1', 'rejected')
    expect(hasConsent()).toBe(false)
  })
})

describe('isProductionHost / analyticsEnabled on a non-production host', () => {
  it('localhost is not a production host', () => {
    expect(isProductionHost()).toBe(false)
  })

  it('analytics stays disabled on non-production hosts', () => {
    expect(analyticsEnabled()).toBe(false)
  })

  it('canTrack is false even when consent was given (host gate wins)', () => {
    localStorage.setItem('cookie-consent-v1', 'accepted')
    expect(canTrack()).toBe(false)
  })
})

describe('dedupeOncePerSession', () => {
  it('returns true on first call and false on every repeat for the same key', () => {
    expect(dedupeOncePerSession('purchase-123')).toBe(true)
    expect(dedupeOncePerSession('purchase-123')).toBe(false)
    expect(dedupeOncePerSession('purchase-123')).toBe(false)
  })

  it('tracks distinct keys independently', () => {
    expect(dedupeOncePerSession('a')).toBe(true)
    expect(dedupeOncePerSession('b')).toBe(true)
    expect(dedupeOncePerSession('a')).toBe(false)
  })
})

describe('safeCall', () => {
  it('runs the callback', () => {
    const fn = vi.fn()
    safeCall(fn, 'test')
    expect(fn).toHaveBeenCalledOnce()
  })

  it('swallows errors thrown by the callback', () => {
    expect(() =>
      safeCall(() => {
        throw new Error('boom')
      }, 'test')
    ).not.toThrow()
  })
})

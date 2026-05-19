// @vitest-environment jsdom
// @vitest-environment-options { "url": "https://www.dazaikirpejams.lt/" }

import { describe, it, expect, beforeEach } from 'vitest'
import {
  isProductionHost,
  analyticsEnabled,
  canTrack,
} from './analytics-utils'

// This file runs under the production hostname so we can exercise the
// consent + env-flag gate that is unreachable on localhost.

beforeEach(() => {
  localStorage.clear()
  delete process.env.NEXT_PUBLIC_ENABLE_ANALYTICS
})

describe('isProductionHost', () => {
  it('recognises the production hostname', () => {
    expect(isProductionHost()).toBe(true)
  })
})

describe('analyticsEnabled — env kill switch', () => {
  it('is enabled by default on the production host', () => {
    expect(analyticsEnabled()).toBe(true)
  })

  it('is disabled when NEXT_PUBLIC_ENABLE_ANALYTICS="false"', () => {
    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS = 'false'
    expect(analyticsEnabled()).toBe(false)
  })

  it('is disabled when NEXT_PUBLIC_ENABLE_ANALYTICS="0"', () => {
    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS = '0'
    expect(analyticsEnabled()).toBe(false)
  })
})

describe('canTrack — GDPR consent gate', () => {
  it('is false without consent even on an analytics-enabled production host', () => {
    expect(canTrack()).toBe(false)
  })

  it('is true only once consent is given', () => {
    localStorage.setItem('cookie-consent-v1', 'accepted')
    expect(canTrack()).toBe(true)
  })

  it('stays false if the env kill switch is on, regardless of consent', () => {
    localStorage.setItem('cookie-consent-v1', 'accepted')
    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS = 'false'
    expect(canTrack()).toBe(false)
  })
})

/**
 * Supabase SSR klientai — cookie-based sesijos Next.js 16 aplinkoje.
 *
 * Trys klientai su skirtingomis cookie prieigomis:
 *  - `createBrowserSupabase()` — client komponentams, naudoja document.cookie
 *  - `createServerSupabase()` — RSC / Server Actions, naudoja next/headers cookies()
 *  - `createProxySupabase(request, response)` — proxy.ts, naudoja NextRequest/Response
 *
 * Pastaba dėl Next.js 16: `cookies()` dabar async → visada `await cookies()`.
 */

import {
  createBrowserClient,
  createServerClient,
  type CookieOptions,
} from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { NextRequest, NextResponse } from 'next/server'

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (
    !url ||
    !anonKey ||
    url.includes('your-supabase') ||
    anonKey.includes('your-supabase')
  ) {
    throw new Error(
      'Supabase Auth nesukonfigūruotas. Nustatykite NEXT_PUBLIC_SUPABASE_URL ir NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local faile.'
    )
  }
  return { url, anonKey }
}

/** Client-side (browser) klientas — naudoti 'use client' komponentuose */
export function createBrowserSupabase() {
  const { url, anonKey } = getEnv()
  return createBrowserClient(url, anonKey)
}

/**
 * Server-side klientas RSC ir Server Actions kontekstui.
 * Naudoja next/headers cookies() — visas cookie mutacijas apgaubia try/catch,
 * nes RSC'ose cookies() yra read-only, o Server Actions'uose — mutable.
 */
export async function createServerSupabase() {
  const { url, anonKey } = getEnv()
  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options as CookieOptions)
          }
        } catch {
          // RSC kontekste cookies() yra read-only. Ignoruojam — sesiją
          // atnaujins kitas kelias (proxy arba Server Action).
        }
      },
    },
  })
}

/**
 * Proxy klientas — perduoda NextRequest/NextResponse cookie jar'ą.
 * Naudojamas src/proxy.ts opitimistiniam auth patikrinimui.
 */
export function createProxySupabase(
  request: NextRequest,
  response: NextResponse
) {
  const { url, anonKey } = getEnv()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set({
            name,
            value,
            ...(options as CookieOptions),
          })
        }
      },
    },
  })
}

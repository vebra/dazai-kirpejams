import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/ssr'

/**
 * Atsijungimo handler'is — iškviečiamas iš AdminSidebar `<form action="/admin/logout">`.
 * POST nutrina Supabase sesiją ir nukreipia į login puslapį.
 *
 * GET taip pat palaikomas (pvz. jei vartotojas tiesiog įrašo URL'ą), kad
 * nebūtų 405.
 */
async function signOutAndRedirect(request: NextRequest) {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/admin/login'
  loginUrl.search = ''
  return NextResponse.redirect(loginUrl, { status: 303 })
}

export async function POST(request: NextRequest) {
  return signOutAndRedirect(request)
}

export async function GET(request: NextRequest) {
  return signOutAndRedirect(request)
}

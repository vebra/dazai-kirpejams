import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/ssr'

async function signOutAndRedirect(request: NextRequest) {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/vadybininke/login'
  loginUrl.search = ''
  return NextResponse.redirect(loginUrl, { status: 303 })
}

export async function POST(request: NextRequest) {
  return signOutAndRedirect(request)
}
export async function GET(request: NextRequest) {
  return signOutAndRedirect(request)
}

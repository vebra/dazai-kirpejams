import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { isUserVerified } from '@/lib/auth/verification'

export const dynamic = 'force-dynamic'

/**
 * Atsisiuntimo maršrutas: pagal download id grąžina signed URL į privatų failą.
 * - visibility='public' — atsisiunčia bet kas
 * - visibility='pro' — tik patvirtintas profesionalas (kitaip → prisijungimas)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lang: string; id: string }> }
) {
  const { lang, id } = await params
  const admin = createServerClient()

  const { data: row, error } = await admin
    .from('downloads')
    .select('file_path, file_name, visibility, is_active')
    .eq('id', id)
    .maybeSingle()

  if (error || !row || !row.is_active) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  if (row.visibility === 'pro') {
    const verified = await isUserVerified()
    if (!verified) {
      return NextResponse.redirect(new URL(`/${lang}/prisijungimas`, req.url))
    }
  }

  const { data: signed, error: signErr } = await admin.storage
    .from('downloads')
    .createSignedUrl(row.file_path, 60, {
      download: row.file_name ?? true,
    })

  if (signErr || !signed?.signedUrl) {
    console.error('[atsisiuntimai] signed url:', signErr?.message)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}

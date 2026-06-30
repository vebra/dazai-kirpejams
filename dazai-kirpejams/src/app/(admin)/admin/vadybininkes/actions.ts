'use server'

import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'

export type CreateRepResult =
  | { ok: true; link: string; email: string }
  | { ok: false; error: string }

/**
 * Sukuria vadybininkės (sales_rep) paskyrą: auth vartotojas (atsitiktinis laikinas
 * slaptažodis — nerodomas) + user_profiles.role='sales_rep' + slaptažodžio
 * nustatymo (recovery) nuoroda, kurią admin persiunčia vadybininkei. Be plaintext.
 */
export async function createRepAccount(input: {
  email: string
  name: string
}): Promise<CreateRepResult> {
  await requireAdmin()

  const email = (input.email ?? '').trim().toLowerCase()
  const nameRaw = (input.name ?? '').trim()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: 'Netinkamas el. paštas.' }
  }
  if (!nameRaw) return { ok: false, error: 'Įveskite vardą.' }
  const [first, ...rest] = nameRaw.split(/\s+/).filter(Boolean)
  const last = rest.join(' ')

  const sb = createServerClient()
  const tempPw = randomBytes(24).toString('base64url')
  const { data: created, error: cErr } = await sb.auth.admin.createUser({
    email,
    password: tempPw,
    email_confirm: true,
  })
  if (cErr || !created.user) {
    // Dublikato el. pašto atpažinimas pagal HTTP statusą / kodą (atsparu žinutės
    // formuluotės pokyčiams ir lokalizacijai), su teksto fallback'u.
    const status = (cErr as { status?: number } | null)?.status
    const code = (cErr as { code?: string } | null)?.code ?? ''
    const m = (cErr?.message ?? '').toLowerCase()
    const isDuplicate =
      status === 422 ||
      code === 'email_exists' ||
      /already|registered|exist/.test(m)
    if (isDuplicate) {
      return { ok: false, error: 'Vartotojas su tokiu el. paštu jau egzistuoja.' }
    }
    return { ok: false, error: 'Nepavyko sukurti paskyros.' }
  }
  const uid = created.user.id

  // role=sales_rep (profilį auto-sukuria trigeris; mažas retry tikslumui)
  let roleSet = false
  for (let i = 0; i < 5 && !roleSet; i++) {
    const { error } = await sb
      .from('user_profiles')
      .upsert({ id: uid, role: 'sales_rep', first_name: first, last_name: last }, { onConflict: 'id' })
    if (!error) roleSet = true
    else await new Promise((r) => setTimeout(r, 300))
  }
  if (!roleSet) {
    // Rolė nenustatyta → paskyra be teisių ir su užimtu el. paštu (pakartoti
    // nebepavyktų). Pašalinam ką tik sukurtą vartotoją, kad admin galėtų bandyti
    // iš naujo švariai.
    await sb.auth.admin.deleteUser(uid).catch(() => {})
    return { ok: false, error: 'Nepavyko nustatyti rolės. Bandykite dar kartą.' }
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
    'https://www.dazaikirpejams.lt'
  const { data: link, error: lErr } = await sb.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${siteUrl}/auth/recovery?lang=lt` },
  })
  if (lErr || !link?.properties?.action_link) {
    return {
      ok: false,
      error:
        'Paskyra sukurta, bet nepavyko sugeneruoti slaptažodžio nuorodos. Vadybininkė gali pasinaudoti „Pamiršote slaptažodį?".',
    }
  }

  revalidatePath('/admin/vadybininkes')
  return { ok: true, link: link.properties.action_link, email }
}

/**
 * Admin vartotojo sukūrimas Supabase Auth'e + `admin_users` lentelėje.
 *
 * Paleidimas:
 *   npm run admin:create -- info@dazaikirpejams.lt SlaptasZodis123!
 *   # arba interaktyviai (promptas slaptažodžiui)
 *   npm run admin:create -- info@dazaikirpejams.lt
 *
 * Veikia idempotentiškai:
 *  - Auth vartotojas: create arba update password
 *  - admin_users lentelė: upsert pagal id
 *
 * Naudoja SERVICE_ROLE_KEY — apeina RLS, todėl reikalingas bootstrap'ui
 * (be įrašo admin_users lentelėje `is_admin()` grąžina false ir prisijungti
 * neįmanoma).
 *
 * Reikalavimai:
 *  - .env.local su NEXT_PUBLIC_SUPABASE_URL ir SUPABASE_SERVICE_ROLE_KEY
 *  - Migracija 004_admin_access.sql pritaikyta Supabase'e
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { createInterface } from 'readline/promises'
import { stdin as input, stdout as output } from 'process'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_KEY ||
  SUPABASE_URL.includes('your-supabase')
) {
  console.error(
    '❌ Trūksta NEXT_PUBLIC_SUPABASE_URL arba SUPABASE_SERVICE_ROLE_KEY .env.local faile'
  )
  process.exit(1)
}

async function promptPassword(): Promise<string> {
  const rl = createInterface({ input, output })
  const pw = await rl.question('Slaptažodis (min 8 simboliai): ')
  rl.close()
  return pw
}

async function main() {
  const [emailArg, passwordArg] = process.argv.slice(2)

  if (!emailArg) {
    console.error(
      'Naudojimas: npm run admin:create -- <email> [slaptažodis]\n' +
        'Pavyzdys:  npm run admin:create -- info@dazaikirpejams.lt MySecret123!'
    )
    process.exit(1)
  }

  const email = emailArg.trim().toLowerCase()
  const password = passwordArg?.trim() || (await promptPassword())

  if (password.length < 8) {
    console.error('❌ Slaptažodis turi būti bent 8 simbolių')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ============================================
  // 1. Auth vartotojas
  // ============================================
  console.log(`🔍 Tikrinu ar ${email} jau egzistuoja Supabase Auth'e...`)
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (listErr) {
    console.error('❌ listUsers klaida:', listErr.message)
    process.exit(1)
  }

  const existing = list.users.find((u) => u.email?.toLowerCase() === email)

  let userId: string

  if (existing) {
    console.log(
      `✏️  Vartotojas egzistuoja (${existing.id}) — atnaujinu slaptažodį...`
    )
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    })
    if (error) {
      console.error('❌ updateUser klaida:', error.message)
      process.exit(1)
    }
    userId = existing.id
  } else {
    console.log(`➕ Kuriu naują Auth vartotoją ${email}...`)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error) {
      console.error('❌ createUser klaida:', error.message)
      process.exit(1)
    }
    userId = data.user.id
  }

  // ============================================
  // 2. admin_users lentelė (RLS allow-list'as)
  // ============================================
  console.log(`➕ Įrašau į admin_users lentelę...`)
  const { error: upsertErr } = await supabase
    .from('admin_users')
    .upsert({ id: userId, email }, { onConflict: 'id' })

  if (upsertErr) {
    if (
      upsertErr.message.includes('relation "admin_users" does not exist') ||
      upsertErr.code === '42P01'
    ) {
      console.error(
        '❌ admin_users lentelė nerasta. Pritaikyk migraciją pirma:\n' +
          '   supabase db push\n' +
          '   (arba rankiniu būdu paleisk supabase/migrations/004_admin_access.sql)'
      )
      process.exit(1)
    }
    console.error('❌ admin_users upsert klaida:', upsertErr.message)
    process.exit(1)
  }

  console.log(`✅ Admin sukurtas: ${email} (${userId})`)
  console.log('\n👉 Dabar gali prisijungti: http://localhost:3000/admin/login')
}

main().catch((err) => {
  console.error('❌ Neplanuota klaida:', err)
  process.exit(1)
})

import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/ssr'
import { isAdminEmail } from '@/lib/admin/auth'
import { LoginForm } from './LoginForm'

export const metadata = {
  title: 'Prisijungimas',
}

/**
 * Login page — viešas. Jei jau prisijungęs kaip admin, iš karto redirect
 * į /admin, kad nereikėtų matyti login formos antrą kartą.
 */
export default async function AdminLoginPage({
  searchParams,
}: PageProps<'/admin/login'>) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user && isAdminEmail(user.email)) {
    redirect('/admin')
  }

  const sp = await searchParams
  const errorParam = typeof sp.error === 'string' ? sp.error : undefined
  const initialError =
    errorParam === 'forbidden'
      ? 'Prieiga neleidžiama. Susisiekite su administratoriumi.'
      : undefined

  return <LoginForm initialError={initialError} />
}

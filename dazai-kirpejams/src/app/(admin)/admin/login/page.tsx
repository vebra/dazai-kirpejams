import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/admin/auth'
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
  const adminUser = await getAdminUser()
  if (adminUser) {
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

import { redirect } from 'next/navigation'
import { getRepUser } from '@/lib/rep/auth'
import { LoginForm } from './LoginForm'

export const metadata = { title: 'Prisijungimas' }

export default async function RepLoginPage({
  searchParams,
}: PageProps<'/vadybininke/login'>) {
  const rep = await getRepUser()
  if (rep) redirect('/vadybininke/naujas-uzsakymas')

  const sp = await searchParams
  const errorParam = typeof sp.error === 'string' ? sp.error : undefined
  const initialError =
    errorParam === 'forbidden'
      ? 'Ši paskyra neturi vadybininkės teisių.'
      : undefined

  return <LoginForm initialError={initialError} />
}

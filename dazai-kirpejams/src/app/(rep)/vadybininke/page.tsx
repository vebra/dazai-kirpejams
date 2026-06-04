import { redirect } from 'next/navigation'
import { requireSalesRep } from '@/lib/rep/auth'

export default async function RepHome() {
  await requireSalesRep()
  redirect('/vadybininke/naujas-uzsakymas')
}

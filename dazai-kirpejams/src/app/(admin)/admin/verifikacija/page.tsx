import { requireAdmin } from '@/lib/admin/auth'
import { getUserProfiles } from '@/lib/admin/queries'
import { VerificationTable } from './VerificationTable'

export const metadata = {
  title: 'Verifikacija',
}

export const dynamic = 'force-dynamic'

export default async function AdminVerificationPage({
  searchParams,
}: PageProps<'/admin/verifikacija'>) {
  await requireAdmin()

  const sp = await searchParams
  const errorParam = typeof sp.error === 'string' ? sp.error : undefined
  const errorMessage =
    errorParam === 'invalid-id'
      ? 'Trūksta ID.'
      : errorParam === 'update-failed'
        ? 'Nepavyko atnaujinti.'
        : null

  const profiles = await getUserProfiles()

  const statusCounts = {
    pending: profiles.filter((p) => p.verificationStatus === 'pending').length,
    approved: profiles.filter((p) => p.verificationStatus === 'approved').length,
    rejected: profiles.filter((p) => p.verificationStatus === 'rejected').length,
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold text-brand-gray-900">
          Vartotojų verifikacija
        </h2>
        <p className="mt-1 text-sm text-brand-gray-500">
          Peržiūrėkite registracijų dokumentus ir patvirtinkite profesionalus,
          kad jie galėtų matyti kainas ir pirkti.
        </p>
      </div>

      {errorMessage && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        <div className="px-4 py-3 rounded-xl border bg-amber-50 text-amber-700 border-amber-200">
          <div className="text-2xl font-bold">{statusCounts.pending}</div>
          <div className="text-[12px] font-semibold mt-0.5">Laukia peržiūros</div>
        </div>
        <div className="px-4 py-3 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200">
          <div className="text-2xl font-bold">{statusCounts.approved}</div>
          <div className="text-[12px] font-semibold mt-0.5">Patvirtinti</div>
        </div>
        <div className="px-4 py-3 rounded-xl border bg-red-50 text-red-600 border-red-200">
          <div className="text-2xl font-bold">{statusCounts.rejected}</div>
          <div className="text-[12px] font-semibold mt-0.5">Atmesti</div>
        </div>
      </div>

      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <VerificationTable profiles={profiles} />
      </section>
    </div>
  )
}

import { Container } from '@/components/ui/Container'
import { Skeleton } from '@/components/ui/Skeleton'

export default function ProductsLoading() {
  return (
    <>
      {/* Breadcrumb */}
      <section className="py-3">
        <Container>
          <Skeleton className="h-4 w-40" />
        </Container>
      </section>

      {/* Hero */}
      <section className="pt-5 pb-8 lg:pt-8 lg:pb-12 bg-white">
        <Container>
          <div className="max-w-[720px]">
            <Skeleton className="h-4 w-32 mb-3" />
            <Skeleton className="h-10 w-80 mb-3" />
            <Skeleton className="h-5 w-full max-w-md" />
          </div>
        </Container>
      </section>

      {/* Category pills + product grid */}
      <section className="py-10 lg:py-14 bg-brand-gray-50">
        <Container>
          <div className="flex flex-wrap gap-3 mb-10">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-28 rounded-full" />
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4">
                <Skeleton className="aspect-square w-full rounded-xl mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-5 w-20 mb-3" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}

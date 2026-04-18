import { Container } from '@/components/ui/Container'
import { Skeleton } from '@/components/ui/Skeleton'

export default function HomeLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <section className="py-16 lg:py-24 bg-white">
        <Container>
          <div className="max-w-2xl">
            <Skeleton className="h-4 w-40 mb-4" />
            <Skeleton className="h-12 w-full mb-3" />
            <Skeleton className="h-6 w-3/4 mb-8" />
            <div className="flex gap-4">
              <Skeleton className="h-12 w-48 rounded-lg" />
              <Skeleton className="h-12 w-48 rounded-lg" />
            </div>
          </div>
        </Container>
      </section>

      {/* Trust bar skeleton */}
      <section className="py-6 bg-brand-gray-50">
        <Container>
          <div className="flex flex-wrap justify-center gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-36" />
            ))}
          </div>
        </Container>
      </section>

      {/* Product cards skeleton */}
      <section className="py-14 bg-white">
        <Container>
          <Skeleton className="h-8 w-64 mx-auto mb-10" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-brand-gray-50 rounded-2xl p-4">
                <Skeleton className="aspect-square w-full rounded-xl mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}

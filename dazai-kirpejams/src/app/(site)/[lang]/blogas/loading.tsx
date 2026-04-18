import { Container } from '@/components/ui/Container'
import { Skeleton } from '@/components/ui/Skeleton'

export default function BlogLoading() {
  return (
    <>
      {/* Breadcrumb */}
      <section className="py-3">
        <Container>
          <Skeleton className="h-4 w-36" />
        </Container>
      </section>

      {/* Hero */}
      <section className="pt-5 pb-8 lg:pt-8 lg:pb-12 bg-white">
        <Container>
          <div className="max-w-[720px]">
            <Skeleton className="h-4 w-28 mb-3" />
            <Skeleton className="h-10 w-72 mb-3" />
            <Skeleton className="h-5 w-full max-w-sm" />
          </div>
        </Container>
      </section>

      {/* Category filter + articles grid */}
      <section className="py-10 lg:py-14 bg-brand-gray-50">
        <Container>
          <div className="flex flex-wrap gap-3 mb-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-full" />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden">
                <Skeleton className="aspect-[16/9] w-full" />
                <div className="p-5">
                  <Skeleton className="h-3 w-20 mb-3" />
                  <Skeleton className="h-5 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}

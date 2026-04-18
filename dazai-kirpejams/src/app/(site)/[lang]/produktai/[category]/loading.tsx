import { Container } from '@/components/ui/Container'
import { Skeleton } from '@/components/ui/Skeleton'

export default function CategoryLoading() {
  return (
    <>
      <section className="py-3">
        <Container>
          <Skeleton className="h-4 w-52" />
        </Container>
      </section>

      <section className="pt-5 pb-8 lg:pt-8 lg:pb-12 bg-white">
        <Container>
          <div className="max-w-[720px]">
            <Skeleton className="h-4 w-28 mb-3" />
            <Skeleton className="h-10 w-64 mb-3" />
            <Skeleton className="h-5 w-full max-w-sm" />
          </div>
        </Container>
      </section>

      <section className="py-10 lg:py-14 bg-brand-gray-50">
        <Container>
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

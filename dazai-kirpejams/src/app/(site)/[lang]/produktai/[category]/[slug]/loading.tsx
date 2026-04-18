import { Container } from '@/components/ui/Container'
import { Skeleton } from '@/components/ui/Skeleton'

export default function ProductDetailLoading() {
  return (
    <>
      <section className="py-3">
        <Container>
          <Skeleton className="h-4 w-64" />
        </Container>
      </section>

      <section className="py-8 lg:py-12 bg-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
            {/* Image gallery */}
            <div>
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <div className="flex gap-3 mt-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="w-20 h-20 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Product info */}
            <div>
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-6 w-24 mb-6" />
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-5 w-5/6 mb-2" />
              <Skeleton className="h-5 w-2/3 mb-8" />
              <Skeleton className="h-12 w-full rounded-lg mb-4" />
              <Skeleton className="h-10 w-48 rounded-lg" />
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}

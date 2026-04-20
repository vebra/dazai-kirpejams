import { Container } from '@/components/ui/Container'
import { Skeleton } from '@/components/ui/Skeleton'

export default function ArticleLoading() {
  return (
    <>
      {/* Breadcrumb */}
      <section className="py-3">
        <Container>
          <Skeleton className="h-4 w-64" />
        </Container>
      </section>

      {/* Article hero */}
      <section className="py-12 lg:py-16 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)]">
        <Container>
          <div className="max-w-[820px] mx-auto">
            <div className="flex justify-center mb-5">
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full mb-3 mx-auto" />
            <Skeleton className="h-10 w-4/5 mb-5 mx-auto" />
            <div className="flex justify-center">
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </Container>
      </section>

      {/* Cover image */}
      <section className="bg-white">
        <Container>
          <div className="max-w-[820px] mx-auto -mt-4 mb-4">
            <Skeleton className="aspect-[16/9] w-full rounded-xl" />
          </div>
        </Container>
      </section>

      {/* Article body */}
      <section className="py-12 lg:py-16 bg-white">
        <Container>
          <div className="max-w-[760px] mx-auto space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-11/12" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <div className="h-4" />
            <Skeleton className="h-7 w-2/3 mt-8" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-11/12" />
            <Skeleton className="h-5 w-10/12" />
            <Skeleton className="h-5 w-full" />
            <div className="h-4" />
            <Skeleton className="h-7 w-1/2 mt-8" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-11/12" />
            <Skeleton className="h-5 w-9/12" />
          </div>
        </Container>
      </section>
    </>
  )
}

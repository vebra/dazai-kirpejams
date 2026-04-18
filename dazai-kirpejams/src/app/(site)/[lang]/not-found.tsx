import Link from 'next/link'
import { Container } from '@/components/ui/Container'

export default function NotFound() {
  return (
    <section className="py-24 md:py-32 bg-white">
      <Container>
        <div className="text-center max-w-lg mx-auto">
          <p className="text-[7rem] md:text-[9rem] font-extrabold leading-none text-brand-magenta/15">
            404
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-gray-900 -mt-4 mb-4">
            Puslapis nerastas
          </h1>
          <p className="text-brand-gray-500 mb-8 leading-relaxed">
            Ieškomas puslapis neegzistuoja arba buvo perkeltas. Patikrinkite
            adresą arba grįžkite į pagrindinį puslapį.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="px-8 py-3.5 bg-brand-magenta text-white rounded-lg font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
            >
              Grįžti į pradžią
            </Link>
            <Link
              href="/produktai"
              className="px-8 py-3.5 border border-[#E0E0E0] text-brand-gray-900 rounded-lg font-semibold hover:border-brand-magenta hover:text-brand-magenta transition-all"
            >
              Peržiūrėti produktus
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}

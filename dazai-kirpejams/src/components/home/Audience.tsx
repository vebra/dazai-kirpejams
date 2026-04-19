import { Container } from '@/components/ui/Container'

type Card = { icon: string; title: string; desc: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Audience({ dict }: { dict: any }) {
  const t = dict.audience
  const cards: Card[] = t.cards

  return (
    <section id="kam-skirta" className="py-20 bg-brand-gray-50">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
            {t.label}
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
            {t.titleFull}
          </h2>
          <p className="text-[1.1rem] text-brand-gray-500">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl p-9 px-7 text-center border border-[#E0E0E0] hover:border-brand-magenta hover:shadow-[0_2px_16px_rgba(0,0,0,0.07)] transition-all"
            >
              <div className="text-[2.5rem] mb-4" aria-hidden>
                {card.icon}
              </div>
              <h4 className="text-[1.1rem] font-bold text-brand-gray-900 mb-2.5">
                {card.title}
              </h4>
              <p className="text-[0.9rem] text-brand-gray-500 leading-[1.65]">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

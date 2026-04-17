import { Container } from '@/components/ui/Container'

/**
 * Trust bar — balta juosta su apatiniu rėmeliu po Hero.
 * 4 elementai: emoji ikona + h4 + smulki aprašymo eilutė.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TrustBar({ dict }: { dict: any }) {
  const t = dict.trustBar
  const items = [
    { icon: '📦', title: t.volumeTitle, desc: t.volumeDesc },
    { icon: '⚗', title: t.formulaTitle, desc: t.formulaDesc },
    { icon: '🚚', title: t.deliveryTitle, desc: t.deliveryDesc },
    { icon: '🤝', title: t.b2bTitle, desc: t.b2bDesc },
  ]

  return (
    <section className="py-8 bg-white border-b border-[#E0E0E0]">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {items.map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-center gap-2"
            >
              <div className="text-[1.8rem]" aria-hidden>
                {item.icon}
              </div>
              <h4 className="text-[0.95rem] font-bold text-brand-gray-900 leading-tight">
                {item.title}
              </h4>
              <p className="text-[0.85rem] text-brand-gray-500 leading-snug">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

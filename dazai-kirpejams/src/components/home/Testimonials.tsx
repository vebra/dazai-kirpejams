import { Container } from '@/components/ui/Container'

/**
 * Atsiliepimai — baltas fonas, centruota antraštė, 3 šviesiai pilkos
 * kortelės su auksinėmis žvaigždutėmis, citatomis ir autoriaus avataru.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Testimonials({ dict: _dict }: { dict: any }) {
  const testimonials = [
    {
      quote:
        '180 ml pakuotė — tikras atradimas. Vienos pakuotės pakanka dvigubai ilgiau nei įprasta. Spalvos sodrūs ir ilgai išlieka.',
      initials: 'RS',
      name: 'Rasa S.',
      role: 'Koloristė, Kaunas',
    },
    {
      quote:
        'Puikus kainos ir kokybės santykis. Mūsų salonui tai leido sumažinti dažų sąnaudas beveik 40%. Rekomenduoju kolegoms.',
      initials: 'DK',
      name: 'Diana K.',
      role: 'Salono savininkė, Kaunas',
    },
    {
      quote:
        'Greitas pristatymas, patogus užsakymas. Spalvų paletė plati — randu viską, ko reikia kasdieniam darbui.',
      initials: 'LM',
      name: 'Laura M.',
      role: 'Kirpėja, Klaipėda',
    },
  ]

  return (
    <section className="py-20 bg-white">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
            Atsiliepimai
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
            Ką sako mūsų klientai
          </h2>
          <p className="text-[1.1rem] text-brand-gray-500">
            Patirtis iš salonų, kurie jau naudoja mūsų produktus
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-brand-gray-50 rounded-xl p-8 relative"
            >
              <div
                className="text-[#F5A623] text-base tracking-[2px] mb-4"
                aria-label="5 iš 5 žvaigždučių"
              >
                ★★★★★
              </div>
              <p className="text-[0.95rem] text-brand-gray-900 italic leading-[1.7] mb-5">
                „{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#E0E0E0] flex items-center justify-center font-bold text-[0.85rem] text-brand-gray-500">
                  {t.initials}
                </div>
                <div>
                  <div className="font-semibold text-[0.9rem] text-brand-gray-900">
                    {t.name}
                  </div>
                  <div className="text-[0.8rem] text-brand-gray-500">
                    {t.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

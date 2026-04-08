import { Container } from '@/components/ui/Container'

/**
 * "Kam skirta" — šviesiai pilkas fonas, centruota antraštė, 4 kortelės
 * su dideliu emoji viršuje, h4 ir aprašymu.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Audience({ dict: _dict }: { dict: any }) {
  const cards = [
    {
      icon: '✂',
      title: 'Kirpėjams',
      desc:
        'Patikimi darbo įrankiai kasdieniam naudojimui. Ekonomiška 180 ml pakuotė — mažiau rūpesčių, daugiau darbo.',
    },
    {
      icon: '🎨',
      title: 'Koloristams',
      desc:
        'Plati spalvų paletė ir profesionali formulė leidžia kurti tikslias spalvas pagal kiekvieno kliento poreikius.',
    },
    {
      icon: '🏪',
      title: 'Grožio salonams',
      desc:
        'B2B sąlygos, reguliarus tiekimas ir ekonomiškas kainos modelis — idealus sprendimas salono biudžetui.',
    },
    {
      icon: '💪',
      title: 'Profesionalams',
      desc:
        'Dirbantiems kasdien, kurie vertina patikimą rezultatą, kokybę ir protingą kainos ir vertės santykį.',
    },
  ]

  return (
    <section id="kam-skirta" className="py-20 bg-brand-gray-50">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
            Auditorija
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
            Kam skirta?
          </h2>
          <p className="text-[1.1rem] text-brand-gray-500">
            Mūsų produktai sukurti tiems, kuriems svarbus darbo rezultatas
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

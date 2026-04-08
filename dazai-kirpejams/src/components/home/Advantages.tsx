import { Container } from '@/components/ui/Container'

/**
 * "Kodėl kirpėjai renkasi mus?" — baltas blokas su centrine antrašte,
 * magenta section-label, 3×2 tinklelis šviesiai pilkų kortelių.
 * Kiekviena kortelė: balta apvali ikonos dėžutė + h4 + trumpas tekstas.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Advantages({ dict: _dict }: { dict: any }) {
  const cards = [
    {
      icon: '📦',
      title: '180 ml — dvigubai daugiau',
      desc:
        'Standartinė pakuotė rinkoje — 60–100 ml. Mūsų — 180 ml. Tai reiškia mažesnę savikainą kiekvienam dažymui.',
    },
    {
      icon: '🎨',
      title: 'Profesionali formulė',
      desc:
        'Kokybiški ingredientai užtikrina tolygų padengimą, ilgai išliekančią spalvą ir plaukų apsaugą dažymo metu.',
    },
    {
      icon: '💰',
      title: 'Ekonomiškiau salonui',
      desc:
        'Didesnė pakuotė — mažiau atliekų, mažesnė kaina vienam dažymui. Racionalus pasirinkimas kasdieniam darbui.',
    },
    {
      icon: '🌈',
      title: 'Plati spalvų paletė',
      desc:
        'Dešimtys profesionalių atspalvių — nuo natūralių iki ryškių. Kiekvienas koloristas ras tai, ko ieško.',
    },
    {
      icon: '🚚',
      title: 'Greitas ir patogus užsakymas',
      desc:
        'Užsisakykite internetu ir gaukite per 1–3 darbo dienas. Pristatymas kurjeriu, į paštomatą arba atsiėmimas.',
    },
    {
      icon: '🤝',
      title: 'B2B sąlygos salonams',
      desc:
        'Specialios kainos, reguliarus tiekimas ir asmeninis vadybininkas grožio salonams ir tinklams.',
    },
  ]

  return (
    <section id="kodel" className="py-20 bg-white">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
            Privalumai
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
            Kodėl kirpėjai renkasi mus?
          </h2>
          <p className="text-[1.1rem] text-brand-gray-500">
            Profesionalūs produktai, sukurti kasdieniam darbui salone
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-brand-gray-50 rounded-xl p-9 px-7 border border-transparent hover:border-[#E0E0E0] hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center text-2xl mb-5">
                <span aria-hidden>{card.icon}</span>
              </div>
              <h4 className="text-[1.05rem] font-bold text-brand-gray-900 mb-2.5 leading-tight">
                {card.title}
              </h4>
              <p className="text-[0.92rem] leading-[1.6] text-brand-gray-500">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

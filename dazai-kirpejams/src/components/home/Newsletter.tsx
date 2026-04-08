import { Container } from '@/components/ui/Container'

/**
 * Naujienlaiškis — šviesiai pilkas fonas, horizontalus išdėstymas:
 *  - kairėje antraštė + paantraštė
 *  - dešinėje inline email forma
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Newsletter({ dict: _dict }: { dict: any }) {
  return (
    <section className="py-[60px] bg-brand-gray-50">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 text-center md:text-left">
          <div>
            <h3 className="text-[clamp(1.15rem,2.5vw,1.5rem)] font-bold text-brand-gray-900 mb-2">
              Gaukite specialius pasiūlymus
            </h3>
            <p className="text-brand-gray-500">
              Naujienos, akcijos ir patarimai profesionalams — tiesiai į Jūsų
              paštą.
            </p>
          </div>

          <form className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0">
            <input
              type="email"
              name="email"
              placeholder="Jūsų el. paštas"
              required
              className="px-5 py-[14px] border border-[#E0E0E0] rounded-lg text-[0.95rem] bg-white w-full sm:w-[300px] focus:outline-none focus:border-brand-magenta transition-colors"
            />
            <button
              type="submit"
              className="px-8 py-[14px] bg-brand-magenta text-white rounded-lg font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all whitespace-nowrap"
            >
              Prenumeruoti
            </button>
          </form>
        </div>
      </Container>
    </section>
  )
}

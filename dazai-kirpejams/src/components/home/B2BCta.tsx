import { Container } from '@/components/ui/Container'
import type { Locale } from '@/i18n/config'

type B2BCtaProps = {
  lang: Locale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
}

export function B2BCta({ lang: _lang, dict }: B2BCtaProps) {
  const t = dict.b2bHome
  const features: string[] = t.features

  return (
    <section
      id="salonams"
      className="py-20 bg-[linear-gradient(135deg,#2B35AF_0%,#1e2780_100%)] text-white"
    >
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-[60px] items-center">
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-white/60 mb-3">
              {t.label}
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white leading-tight">
              {t.title}
            </h2>
            <p className="mt-3 text-white/80 leading-[1.7]">
              {t.desc}
            </p>

            <div className="grid gap-4 mt-6">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 text-base text-white/90"
                >
                  <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-[0.9rem] flex-shrink-0">
                    ✓
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 border border-white/15 rounded-xl p-9">
            <h3 className="text-[clamp(1.15rem,2.5vw,1.5rem)] font-bold text-white mb-6">
              {t.formTitle}
            </h3>
            <form className="space-y-4">
              <input
                type="text"
                placeholder={t.formSalonName}
                required
                className="w-full px-4 py-3 bg-white/[0.08] border border-white/20 rounded-lg text-white placeholder:text-white/45 text-[0.95rem] focus:outline-none focus:border-brand-magenta transition-colors"
              />
              <input
                type="text"
                placeholder={t.formYourName}
                required
                className="w-full px-4 py-3 bg-white/[0.08] border border-white/20 rounded-lg text-white placeholder:text-white/45 text-[0.95rem] focus:outline-none focus:border-brand-magenta transition-colors"
              />
              <input
                type="email"
                placeholder={t.formEmail}
                required
                className="w-full px-4 py-3 bg-white/[0.08] border border-white/20 rounded-lg text-white placeholder:text-white/45 text-[0.95rem] focus:outline-none focus:border-brand-magenta transition-colors"
              />
              <input
                type="tel"
                placeholder={t.formPhone}
                className="w-full px-4 py-3 bg-white/[0.08] border border-white/20 rounded-lg text-white placeholder:text-white/45 text-[0.95rem] focus:outline-none focus:border-brand-magenta transition-colors"
              />
              <textarea
                placeholder={t.formMessage}
                rows={3}
                className="w-full px-4 py-3 bg-white/[0.08] border border-white/20 rounded-lg text-white placeholder:text-white/45 text-[0.95rem] focus:outline-none focus:border-brand-magenta transition-colors resize-vertical"
              />
              <button
                type="submit"
                className="w-full px-8 py-[14px] bg-brand-magenta text-white rounded-lg font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
              >
                {t.formSubmit} →
              </button>
            </form>
          </div>
        </div>
      </Container>
    </section>
  )
}

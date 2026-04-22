import { Container } from '@/components/ui/Container'
import type { Locale } from '@/i18n/config'
import { B2BCtaForm } from './B2BCtaForm'

type B2BCtaProps = {
  lang: Locale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
}

export function B2BCta({ lang, dict }: B2BCtaProps) {
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
            <B2BCtaForm
              lang={lang}
              labels={{
                formTitle: t.formTitle,
                formSalonName: t.formSalonName,
                formYourName: t.formYourName,
                formEmail: t.formEmail,
                formPhone: t.formPhone,
                formMessage: t.formMessage,
                formSubmit: t.formSubmit,
                formSubmitting: t.formSubmitting,
                formSuccessTitle: t.formSuccessTitle,
                formSuccessDesc: t.formSuccessDesc,
              }}
            />
          </div>
        </div>
      </Container>
    </section>
  )
}

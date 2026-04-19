'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Container } from '@/components/ui/Container'

const errorText = {
  lt: {
    title: 'Kažkas nutiko ne taip',
    desc: 'Atsiprašome — įvyko netikėta klaida. Pabandykite dar kartą arba grįžkite į pagrindinį puslapį.',
    code: 'Klaidos kodas:',
    retry: 'Bandyti dar kartą',
    home: 'Grįžti į pradžią',
  },
  en: {
    title: 'Something went wrong',
    desc: 'Sorry — an unexpected error occurred. Try again or return to the home page.',
    code: 'Error code:',
    retry: 'Try again',
    home: 'Back to home',
  },
  ru: {
    title: 'Что-то пошло не так',
    desc: 'Извините — произошла непредвиденная ошибка. Попробуйте ещё раз или вернитесь на главную.',
    code: 'Код ошибки:',
    retry: 'Попробовать снова',
    home: 'На главную',
  },
} as const

type Lang = keyof typeof errorText

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error('[site-error]', error)
  }, [error])

  const params = useParams()
  const rawLang = (params?.lang as string | undefined) ?? 'lt'
  const lang: Lang = rawLang in errorText ? (rawLang as Lang) : 'lt'
  const t = errorText[lang]

  return (
    <section className="py-24 md:py-32 bg-white">
      <Container>
        <div className="text-center max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-gray-900 mb-4">
            {t.title}
          </h1>
          <p className="text-brand-gray-500 mb-8 leading-relaxed">{t.desc}</p>
          {error.digest && (
            <p className="text-xs text-brand-gray-400 mb-6 font-mono">
              {t.code} {error.digest}
            </p>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => unstable_retry()}
              className="px-8 py-3.5 bg-brand-magenta text-white rounded-lg font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
            >
              {t.retry}
            </button>
            <Link
              href={lang === 'lt' ? '/' : `/${lang}`}
              className="px-8 py-3.5 border border-[#E0E0E0] text-brand-gray-900 rounded-lg font-semibold hover:border-brand-magenta hover:text-brand-magenta transition-all"
            >
              {t.home}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}

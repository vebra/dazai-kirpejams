import { Container } from './Container'

type PageHeaderProps = {
  title: string
  description?: string
  eyebrow?: string
  size?: 'default' | 'large'
}

export function PageHeader({
  title,
  description,
  eyebrow,
  size = 'default',
}: PageHeaderProps) {
  return (
    <section className="bg-brand-gray-50 border-b border-brand-gray-50">
      <Container>
        <div
          className={`py-16 lg:py-20 max-w-3xl ${
            size === 'large' ? 'lg:py-28' : ''
          }`}
        >
          {eyebrow && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-xs font-medium text-brand-gray-500 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-brand-magenta" />
              {eyebrow}
            </div>
          )}
          <h1
            className={`font-bold tracking-tight text-brand-gray-900 leading-[1.05] ${
              size === 'large'
                ? 'text-4xl sm:text-5xl lg:text-6xl'
                : 'text-3xl sm:text-4xl lg:text-5xl'
            }`}
          >
            {title}
          </h1>
          {description && (
            <p className="text-lg text-brand-gray-500 mt-6 leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </Container>
    </section>
  )
}

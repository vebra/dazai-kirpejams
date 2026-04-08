import { cn } from '@/lib/utils'

type SectionProps = {
  children: React.ReactNode
  className?: string
  background?: 'white' | 'gray' | 'dark'
  id?: string
}

export function Section({
  children,
  className,
  background = 'white',
  id,
}: SectionProps) {
  const backgrounds = {
    white: 'bg-brand-white',
    gray: 'bg-brand-gray-50',
    dark: 'bg-brand-gray-900 text-white',
  }

  return (
    <section
      id={id}
      className={cn(
        'py-16 sm:py-20 lg:py-24',
        backgrounds[background],
        className
      )}
    >
      {children}
    </section>
  )
}

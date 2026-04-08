import { cn } from '@/lib/utils'

type ContainerProps = {
  children: React.ReactNode
  className?: string
  size?: 'default' | 'narrow' | 'wide'
}

/**
 * Originalus HTML dizainas naudojo 1200px konteinerį — išlaikome jį,
 * kad atkurtume tikslią tinklelio geometriją.
 */
export function Container({
  children,
  className,
  size = 'default',
}: ContainerProps) {
  const sizes = {
    narrow: 'max-w-4xl',
    default: 'max-w-[1200px]',
    wide: 'max-w-[1440px]',
  }

  return (
    <div className={cn('mx-auto px-6', sizes[size], className)}>
      {children}
    </div>
  )
}

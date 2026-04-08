import Link from 'next/link'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonBaseProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: React.ReactNode
}

type ButtonAsButton = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined
  }

type ButtonAsLink = ButtonBaseProps & {
  href: string
  target?: string
  rel?: string
}

type ButtonProps = ButtonAsButton | ButtonAsLink

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-magenta text-white hover:bg-brand-magenta-dark shadow-sm',
  secondary:
    'bg-brand-blue text-white hover:bg-brand-blue-dark shadow-sm',
  outline:
    'bg-transparent border border-brand-gray-900 text-brand-gray-900 hover:bg-brand-gray-900 hover:text-white',
  ghost:
    'bg-transparent text-brand-gray-900 hover:bg-brand-gray-50',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-base',
}

export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    className,
    children,
  } = props

  const classes = cn(
    'inline-flex items-center justify-center font-medium rounded-full transition-colors duration-200 whitespace-nowrap',
    variantStyles[variant],
    sizeStyles[size],
    className
  )

  if ('href' in props && props.href) {
    const { href, target, rel } = props
    return (
      <Link href={href} target={target} rel={rel} className={classes}>
        {children}
      </Link>
    )
  }

  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } =
    props as ButtonAsButton
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}

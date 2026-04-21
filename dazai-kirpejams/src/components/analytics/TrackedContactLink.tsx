'use client'

import type { ReactNode } from 'react'
import type { Locale } from '@/i18n/config'
import type { ContactClickContext } from '@/lib/analytics-types'
import {
  trackEmailClick,
  trackPhoneClick,
  trackWhatsAppClick,
} from '@/lib/analytics'

type ContactKind = 'phone' | 'email' | 'whatsapp'

type TrackedContactLinkProps = {
  kind: ContactKind
  href: string
  location: ContactClickContext['location']
  locale: Locale
  className?: string
  target?: string
  rel?: string
  ariaLabel?: string
  title?: string
  children: ReactNode
}

export function TrackedContactLink({
  kind,
  href,
  location,
  locale,
  className,
  target,
  rel,
  ariaLabel,
  title,
  children,
}: TrackedContactLinkProps) {
  function handleClick() {
    const ctx: ContactClickContext = { location, locale }
    if (kind === 'phone') trackPhoneClick(ctx)
    else if (kind === 'email') trackEmailClick(ctx)
    else trackWhatsAppClick(ctx)
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      target={target}
      rel={rel}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </a>
  )
}

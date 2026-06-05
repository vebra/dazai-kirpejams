'use client'

import { Children, useEffect, useRef, useState } from 'react'

/**
 * Tinklelio „stagger" pasirodymas — vaikai (kortelės) po vieną „įplaukia", kai
 * tinklelis pasirodo ekrane. StaggerReveal PATS yra tinklelis (className =
 * grid klasės), kad vaikai liktų tiesioginiai grid items. Gerbia reduced-motion.
 */
export function StaggerReveal({
  children,
  className = '',
  step = 70,
}: {
  children: React.ReactNode
  className?: string
  /** Uždelsimas tarp kortelių, ms */
  step?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || typeof IntersectionObserver === 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActive(true)
      return
    }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setActive(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={className}>
      {Children.map(children, (child, i) => (
        <div
          className={active ? 'dk-fade-up' : 'opacity-0'}
          style={active ? { animationDelay: `${i * step}ms` } : undefined}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

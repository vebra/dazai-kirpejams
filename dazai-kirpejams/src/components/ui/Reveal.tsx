'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Scroll-reveal — turinys subtiliai „išplaukia" (fade + slide-up) pasirodydamas
 * ekrane. Naudoja IntersectionObserver (pigu). Gerbia prefers-reduced-motion
 * (tada rodo iškart, be animacijos) ir veikia be IO palaikymo (fallback → rodo).
 *
 * Turinys VISADA yra DOM'e (SEO saugu) — keičiasi tik opacity/transform.
 */
export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  /** Uždelsimas ms (subtiliam sekcijų „stagger") */
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || typeof IntersectionObserver === 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShown(true)
      return
    }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

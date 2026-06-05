'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Skaičius „prisuka" nuo 0 iki `to`, kai pasirodo ekrane (IntersectionObserver).
 * Gerbia prefers-reduced-motion (tada iškart rodo galutinį). easeOutCubic.
 */
export function CountUp({
  to,
  duration = 1300,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}: {
  to: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVal(to)
      return
    }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const step = (now: number) => {
            const t = Math.min(1, (now - start) / duration)
            const eased = 1 - Math.pow(1 - t, 3)
            setVal(to * eased)
            if (t < 1) requestAnimationFrame(step)
            else setVal(to)
          }
          requestAnimationFrame(step)
          io.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {val.toFixed(decimals)}
      {suffix}
    </span>
  )
}

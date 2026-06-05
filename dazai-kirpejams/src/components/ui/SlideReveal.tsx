'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Kortelės „įslydimas" pasirodant ekrane. Mobiliajame slysta iš šono
 * (from='left' → iš kairės, 'right' → iš dešinės), desktope — subtilus kilimas
 * iš apačios (be horizontalaus judesio). Gerbia prefers-reduced-motion.
 */
export function SlideReveal({
  children,
  from,
  className = '',
}: {
  children: React.ReactNode
  from: 'left' | 'right'
  className?: string
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
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const hidden =
    from === 'left'
      ? 'opacity-0 -translate-x-16 md:translate-x-0 md:translate-y-8'
      : 'opacity-0 translate-x-16 md:translate-x-0 md:translate-y-8'

  return (
    <div
      ref={ref}
      className={`transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
        shown ? 'opacity-100 translate-x-0 md:translate-y-0' : hidden
      } ${className}`}
    >
      {children}
    </div>
  )
}

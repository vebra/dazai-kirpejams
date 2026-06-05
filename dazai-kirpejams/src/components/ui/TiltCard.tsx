'use client'

import { useRef } from 'react'

/**
 * Kortelės „tilt" — užvedus pelę kortelė lengvai palinksta link žymeklio (3D).
 * Imperatyvus transform (be re-render, sklandu). Gerbia reduced-motion.
 * Vidinė kortelė (Link) tvarko savo hover (pakilimą/šešėlį) atskirai.
 */
export function TiltCard({
  children,
  className = '',
  max = 6,
}: {
  children: React.ReactNode
  className?: string
  /** Maks. pakrypimas laipsniais */
  max?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  function onMove(e: React.MouseEvent) {
    const el = ref.current
    if (!el) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(800px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`
  }

  function reset() {
    if (ref.current) ref.current.style.transform = ''
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={`h-full transition-transform duration-200 ease-out ${className}`}
      style={{ willChange: 'transform' }}
    >
      {children}
    </div>
  )
}

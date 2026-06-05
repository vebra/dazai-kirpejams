'use client'

import { useEffect, useRef } from 'react'

/**
 * „Brand žodžių" juosta — dvi eilutės bėga priešingomis kryptimis, outline
 * (contour) tekstas brand spalvomis. Greitėja slenkant puslapį (scroll boost),
 * grynu JS (be framer-motion). Gerbia prefers-reduced-motion (sustoja).
 *
 * Tekstas (row1/row2) turėtų būti frazė su skirtukais, pvz.
 * „180 ML • COLOR SHOCK • PROFESIONALŪS DAŽAI • ".
 */
export function BrandMarquee({
  row1,
  row2,
  baseSpeed = 55,
}: {
  row1: string
  row2: string
  /** Bazinis greitis px/s */
  baseSpeed?: number
}) {
  const t1 = useRef<HTMLDivElement>(null)
  const t2 = useRef<HTMLDivElement>(null)
  const g1 = useRef<HTMLSpanElement>(null)
  const g2 = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const rows = (
      [
        { track: t1.current, group: g1.current, dir: -1, offset: 0, width: 0 },
        { track: t2.current, group: g2.current, dir: 1, offset: 0, width: 0 },
      ] as Array<{
        track: HTMLDivElement | null
        group: HTMLSpanElement | null
        dir: number
        offset: number
        width: number
      }>
    ).filter((r) => r.track && r.group) as Array<{
      track: HTMLDivElement
      group: HTMLSpanElement
      dir: number
      offset: number
      width: number
    }>
    if (rows.length === 0) return

    const measure = () => {
      for (const r of rows) {
        r.width = r.group.offsetWidth
        r.offset = r.dir > 0 ? -r.width : 0
      }
    }
    measure()
    window.addEventListener('resize', measure)

    let boost = 0
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      boost = Math.min(boost + Math.abs(y - lastY) * 9, 1500)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    let raf = 0
    let prev = 0
    const frame = (t: number) => {
      const dt = prev ? Math.min((t - prev) / 1000, 0.05) : 0
      prev = t
      const v = baseSpeed + boost
      for (const r of rows) {
        if (r.width > 0) {
          r.offset += r.dir * v * dt
          while (r.offset <= -r.width) r.offset += r.width
          while (r.offset > 0) r.offset -= r.width
          r.track.style.transform = `translate3d(${r.offset}px, 0, 0)`
        }
      }
      boost *= 0.93
      if (boost < 0.5) boost = 0
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [baseSpeed, row1, row2])

  // Kartojam frazę, kad grupė tikrai būtų platesnė nei ekranas (sklandus loop).
  const unit1 = `${row1}  `.repeat(4)
  const unit2 = `${row2}  `.repeat(4)

  return (
    <section className="dk-brand-marquee select-none" aria-hidden>
      <div className="overflow-hidden">
        <div ref={t1} className="flex w-max will-change-transform">
          <span ref={g1} className="dk-brand-word dk-brand-word--magenta">
            {unit1}
          </span>
          <span className="dk-brand-word dk-brand-word--magenta">{unit1}</span>
        </div>
      </div>
      <div className="overflow-hidden">
        <div ref={t2} className="flex w-max will-change-transform">
          <span ref={g2} className="dk-brand-word dk-brand-word--blue">
            {unit2}
          </span>
          <span className="dk-brand-word dk-brand-word--blue">{unit2}</span>
        </div>
      </div>
    </section>
  )
}

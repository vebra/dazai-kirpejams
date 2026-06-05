'use client'

import { useEffect, useState } from 'react'

/**
 * Plona gradientinė juostelė svetainės viršuje — rodo slinkties progresą.
 * Lengva (rAF + passive scroll). Subtilus „gyvas" signalas.
 */
export function ScrollProgress() {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const doc = document.documentElement
        const max = doc.scrollHeight - doc.clientHeight
        setPct(max > 0 ? (doc.scrollTop / max) * 100 : 0)
      })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] pointer-events-none">
      <div
        className="h-full bg-brand-gradient"
        style={{ width: `${pct}%`, transition: 'width 80ms linear' }}
      />
    </div>
  )
}

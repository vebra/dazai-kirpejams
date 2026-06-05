'use client'

import { useEffect, useRef } from 'react'

/**
 * Pelę sekantis spalvų „pliūpsnio" švytėjimas (Color SHOCK tema).
 *  - sklandžiai vejasi žymeklį (lerp, requestAnimationFrame)
 *  - tik desktop (pointer: fine), mobiliuose nerodomas
 *  - gerbia prefers-reduced-motion (visai išjungiamas)
 *  - pointer-events: none — netrukdo paspaudimų; mix-blend tik nudažo foną
 * Vaizdas: /cursor-splash.png (permatomas PNG).
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const finePointer = window.matchMedia?.('(pointer: fine)').matches
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!finePointer || reduce) return

    const el = ref.current
    if (!el) return

    let tx = window.innerWidth / 2
    let ty = window.innerHeight / 2
    let x = tx
    let y = ty
    let raf = 0
    let shown = false

    const onMove = (e: MouseEvent) => {
      tx = e.clientX
      ty = e.clientY
      if (!shown) {
        shown = true
        el.dataset.on = '1'
      }
    }

    const loop = () => {
      x += (tx - x) * 0.12
      y += (ty - y) * 0.12
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return <div ref={ref} aria-hidden className="dk-cursor-glow" />
}

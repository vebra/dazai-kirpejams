'use client'

import { useEffect, useRef } from 'react'

/**
 * Pelę sekantis spalvų „pliūpsnio" švytėjimas (Color SHOCK tema).
 *  - sklandžiai vejasi žymeklį (lerp, requestAnimationFrame)
 *  - tik desktop (pointer: fine), mobiliuose nerodomas
 *  - gerbia prefers-reduced-motion (visai išjungiamas)
 *  - pointer-events: none — netrukdo paspaudimų
 *  - du sluoksniai: multiply (matosi ant šviesaus) + screen (matosi ant tamsaus),
 *    todėl švytėjimas matomas ir baltame, ir juodame fone
 * Vaizdas: /cursor-splash.png (permatomas PNG).
 */
export function CursorGlow() {
  const aRef = useRef<HTMLDivElement>(null)
  const bRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const finePointer = window.matchMedia?.('(pointer: fine)').matches
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!finePointer || reduce) return

    const els = [aRef.current, bRef.current].filter(Boolean) as HTMLDivElement[]
    if (els.length === 0) return

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
        for (const el of els) el.dataset.on = '1'
      }
    }

    const loop = () => {
      x += (tx - x) * 0.12
      y += (ty - y) * 0.12
      const t = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      for (const el of els) el.style.transform = t
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div ref={aRef} aria-hidden className="dk-cursor-glow dk-glow-multiply" />
      <div ref={bRef} aria-hidden className="dk-cursor-glow dk-glow-screen" />
    </>
  )
}

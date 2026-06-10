'use client'

/**
 * Bendras skenavimo grįžtamasis ryšys (priėmimas / išdavimas / grąžinimas).
 * Aiškus, „nepraleisi" patvirtinimas iš kart prie skenavimo lauko:
 *   • didelis spalvotas blokas su prekės pavadinimu ir nauju likučiu;
 *   • viso ekrano spalvos blyksnis (žalias/geltonas/raudonas);
 *   • garsas + vibracija (planšetėje).
 */

export type ScanOutcome = 'ok' | 'warn' | 'fail'

export type ScanResult = {
  /** Didėjantis ID — kiekvienas naujas skanas pakeičia, kad blyksnis pasikartotų. */
  id: number
  outcome: ScanOutcome
  title: string
  subtitle?: string
}

/** Garsas + vibracija. ok=aukštas trumpas, warn=vidutinis, fail=žemas ilgas. */
export function playScanFeedback(outcome: ScanOutcome) {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = outcome === 'ok' ? 880 : outcome === 'warn' ? 520 : 240
    gain.gain.value = 0.06
    osc.start()
    osc.stop(ctx.currentTime + (outcome === 'fail' ? 0.28 : 0.09))
    osc.onended = () => ctx.close()
  } catch {
    /* garsas nebūtinas */
  }
  try {
    navigator.vibrate?.(outcome === 'ok' ? 40 : outcome === 'warn' ? [30, 40, 30] : 180)
  } catch {
    /* vibracija nebūtina */
  }
}

const STYLES: Record<ScanOutcome, { box: string; flash: string; icon: string }> = {
  ok: {
    box: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    flash: 'bg-emerald-400',
    icon: '✓',
  },
  warn: {
    box: 'bg-amber-50 border-amber-300 text-amber-900',
    flash: 'bg-amber-400',
    icon: '⚠',
  },
  fail: {
    box: 'bg-red-50 border-red-300 text-red-900',
    flash: 'bg-red-400',
    icon: '✕',
  },
}

/**
 * Didelis paskutinio skano patvirtinimo blokas. Dėti IŠ KART po skenavimo
 * lauku. `result.id` pasikeitus, blyksnis ir blokas persipiešia (animacija).
 */
export function ScanResultBanner({ result }: { result: ScanResult | null }) {
  if (!result) return null
  const s = STYLES[result.outcome]
  return (
    <>
      {/* Viso ekrano blyksnis — pamatoma ir periferiniu matymu */}
      <div
        key={result.id}
        aria-hidden
        className={`fixed inset-0 z-[60] pointer-events-none animate-[scanflash_0.45s_ease-out] ${s.flash}`}
        style={{ opacity: 0 }}
      />
      {/* Patvirtinimo blokas */}
      <div
        key={`box-${result.id}`}
        role="status"
        aria-live="polite"
        className={`animate-[scanpop_0.3s_ease-out] flex items-center gap-4 px-5 py-4 rounded-xl border-2 ${s.box}`}
      >
        <span className="text-3xl leading-none shrink-0">{s.icon}</span>
        <div className="min-w-0">
          <div className="text-lg font-bold leading-tight truncate">
            {result.title}
          </div>
          {result.subtitle && (
            <div className="text-sm font-medium opacity-80 mt-0.5">
              {result.subtitle}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

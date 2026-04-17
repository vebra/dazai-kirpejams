'use client'

import { useState, type ReactNode } from 'react'

const PAGE_SIZE = 24

type Props = {
  total: number
  showMoreLabel: string
  showingOfLabel: string
  children: ReactNode[]
}

export function ShowMoreGrid({
  total,
  showMoreLabel,
  showingOfLabel,
  children,
}: Props) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  const shown = Math.min(visible, total)
  const hasMore = shown < total

  return (
    <>
      {children.slice(0, visible)}
      {hasMore && (
        <div className="col-span-full flex flex-col items-center gap-2 pt-6">
          <span className="text-[0.85rem] text-brand-gray-500">
            {showingOfLabel
              .replace('{visible}', String(shown))
              .replace('{total}', String(total))}
          </span>
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="inline-flex items-center justify-center px-8 py-3 border-2 border-brand-magenta text-brand-magenta rounded-lg text-[0.95rem] font-semibold hover:bg-brand-magenta hover:text-white transition-all"
          >
            {showMoreLabel}
          </button>
        </div>
      )}
    </>
  )
}

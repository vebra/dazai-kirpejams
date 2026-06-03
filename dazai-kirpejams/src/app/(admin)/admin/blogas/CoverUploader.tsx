'use client'

import { useActionState, useRef, useState } from 'react'
import Image from 'next/image'
import { uploadBlogCoverAction, type CoverUploadState } from './actions'

const initialUpload: CoverUploadState = {}

/**
 * Vieno viršelio įkėlimas su peržiūra. URL laikomas paslėptame input'e
 * (`name`), kuris submit'inamas su straipsnio forma. Naudojamas po vieną
 * kiekvienai kalbai (LT / EN / RU).
 */
export function CoverUploader({
  name,
  label,
  hint,
  initialUrl = '',
}: {
  name: string
  label: string
  hint?: string
  initialUrl?: string
}) {
  const [uploadState, uploadAction, isUploading] = useActionState(
    uploadBlogCoverAction,
    initialUpload
  )
  const [coverUrl, setCoverUrl] = useState(initialUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (uploadState.url && uploadState.url !== coverUrl) {
    setCoverUrl(uploadState.url)
  }

  return (
    <div>
      <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
        {label}
      </label>

      {/* Paslėptas input — keliauja su forma */}
      <input type="hidden" name={name} value={coverUrl} />

      {coverUrl ? (
        <div className="relative w-full max-w-[400px] aspect-[16/9] rounded-lg overflow-hidden border border-[#E0E0E0] mb-3 group">
          <Image
            src={coverUrl}
            alt={label}
            fill
            sizes="400px"
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => {
              setCoverUrl('')
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            className="absolute top-2 right-2 px-2.5 py-1 bg-white/90 text-red-700 text-[11px] font-semibold rounded hover:bg-red-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            Pašalinti
          </button>
        </div>
      ) : (
        <div className="w-full max-w-[400px] aspect-[16/9] rounded-lg border-2 border-dashed border-[#ddd] bg-[#F5F5F7] flex items-center justify-center mb-3">
          <span className="text-sm text-brand-gray-500">Nėra nuotraukos</span>
        </div>
      )}

      {uploadState.error && (
        <div className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-3 max-w-[400px]">
          {uploadState.error}
        </div>
      )}

      <div className="flex items-center gap-3 max-w-[400px]">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const fd = new FormData()
            fd.append('file', file)
            uploadAction(fd)
          }}
          className="block w-full text-sm text-brand-gray-900
            file:mr-3 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-[#F5F5F7] file:text-brand-gray-900
            hover:file:bg-[#eee]
            file:cursor-pointer cursor-pointer"
        />
        {isUploading && (
          <span className="text-xs text-brand-magenta font-medium whitespace-nowrap">
            Keliama…
          </span>
        )}
      </div>
      {hint && <p className="text-[11px] text-brand-gray-500 mt-1.5">{hint}</p>}
    </div>
  )
}

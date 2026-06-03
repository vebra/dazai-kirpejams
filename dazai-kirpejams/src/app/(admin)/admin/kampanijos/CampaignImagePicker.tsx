'use client'

import { useActionState, useRef, useState } from 'react'
import Image from 'next/image'
import {
  uploadCampaignImageAction,
  type CampaignImageUploadState,
} from './actions'

const initialUpload: CampaignImageUploadState = {}

/**
 * Kampanijos laiško nuotraukos pasirinkimas. Įkelia į storage, parodo peržiūrą
 * ir laiko URL paslėptame input'e (name="image_url"), kuris submit'inamas su
 * create/update kampanijos forma. Pasirinktinis laukas — galima palikti tuščią.
 */
export function CampaignImagePicker({ initialUrl = '' }: { initialUrl?: string }) {
  const [uploadState, uploadAction, isUploading] = useActionState(
    uploadCampaignImageAction,
    initialUpload
  )
  const [imageUrl, setImageUrl] = useState(initialUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Kai įkėlimas pavyksta — atnaujinam URL
  if (uploadState.url && uploadState.url !== imageUrl) {
    setImageUrl(uploadState.url)
  }

  return (
    <div>
      <label className="block text-[12px] font-semibold text-brand-gray-900 mb-1.5">
        Nuotrauka laiške <span className="font-normal text-brand-gray-500">(nebūtina)</span>
      </label>

      {/* Paslėptas input — keliauja su forma */}
      <input type="hidden" name="image_url" value={imageUrl} />

      {imageUrl ? (
        <div className="relative w-full max-w-[400px] aspect-[16/9] rounded-lg overflow-hidden border border-[#eee] mb-3 group bg-[#F5F5F7]">
          <Image
            src={imageUrl}
            alt="Laiško nuotrauka"
            fill
            sizes="400px"
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => {
              setImageUrl('')
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
      <p className="mt-1.5 text-[11px] text-brand-gray-500">
        JPG, PNG, WebP arba AVIF · max 10 MB · rodoma virš teksto laiške
      </p>
    </div>
  )
}

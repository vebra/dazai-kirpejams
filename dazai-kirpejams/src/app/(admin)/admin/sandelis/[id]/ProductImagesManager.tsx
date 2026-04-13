'use client'

import { useActionState, useRef } from 'react'
import Image from 'next/image'
import {
  uploadProductImagesAction,
  deleteProductImageAction,
  setPrimaryProductImageAction,
  type UploadImagesState,
} from '../actions'

const initialUploadState: UploadImagesState = {}

type Props = {
  productId: string
  imageUrls: string[]
}

/**
 * Produktų nuotraukų valdymas — įkėlimas, pagrindinės nustatymas, trinti.
 *
 * Pirmoji masyvo nuotrauka = pagrindinė (naudojama produkto kortelėje ir
 * produkto puslapio hero'je). Kitos — papildomos galerijai.
 */
export function ProductImagesManager({ productId, imageUrls }: Props) {
  const [uploadState, uploadAction, isUploading] = useActionState(
    uploadProductImagesAction,
    initialUploadState
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
          Nuotraukos
          {imageUrls.length > 0 && (
            <span className="ml-2 text-brand-gray-900 normal-case font-normal">
              · {imageUrls.length}
            </span>
          )}
        </h3>
      </div>

      {/* Būsenos pranešimai */}
      {uploadState.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {uploadState.error}
        </div>
      )}
      {uploadState.success && uploadState.uploadedCount && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          ✓ Įkelta {uploadState.uploadedCount}{' '}
          {uploadState.uploadedCount === 1 ? 'nuotrauka' : 'nuotraukos'}
        </div>
      )}

      {/* Esamos nuotraukos */}
      {imageUrls.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {imageUrls.map((url, index) => (
            <div
              key={url}
              className="group relative aspect-square bg-[#F5F5F7] border border-[#ddd] rounded-lg overflow-hidden"
            >
              <Image
                src={url}
                alt={`Nuotrauka ${index + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover"
              />

              {/* Pagrindinės nuotraukos žymė */}
              {index === 0 && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-brand-magenta text-white text-[10px] font-semibold uppercase tracking-wider rounded">
                  Pagrindinė
                </div>
              )}

              {/* Veiksmų overlay — matomas hover'iui */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center gap-1.5 p-2 opacity-0 group-hover:opacity-100">
                {index !== 0 && (
                  <form action={setPrimaryProductImageAction}>
                    <input type="hidden" name="product_id" value={productId} />
                    <input type="hidden" name="url" value={url} />
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-white text-brand-gray-900 text-[11px] font-semibold rounded hover:bg-brand-magenta hover:text-white transition-colors"
                      title="Nustatyti kaip pagrindinę"
                    >
                      ★ Pagrindinė
                    </button>
                  </form>
                )}
                <form action={deleteProductImageAction}>
                  <input type="hidden" name="product_id" value={productId} />
                  <input type="hidden" name="url" value={url} />
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-white text-red-700 text-[11px] font-semibold rounded hover:bg-red-600 hover:text-white transition-colors"
                    title="Ištrinti nuotrauką"
                  >
                    🗑 Trinti
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center bg-[#F5F5F7] border border-dashed border-[#ddd] rounded-lg">
          <div className="text-sm text-brand-gray-500">
            Produktas dar neturi nuotraukų
          </div>
          <div className="text-[12px] text-brand-gray-500 mt-1">
            Pirmoji įkelta nuotrauka taps pagrindine
          </div>
        </div>
      )}

      {/* Upload forma */}
      <form
        action={uploadAction}
        className="pt-5 border-t border-[#eee] space-y-3"
      >
        <input type="hidden" name="product_id" value={productId} />

        <label
          htmlFor="files"
          className="block text-[13px] font-semibold text-brand-gray-900"
        >
          Įkelti naujas nuotraukas
        </label>

        <input
          ref={fileInputRef}
          type="file"
          id="files"
          name="files"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          required
          className="block w-full text-sm text-brand-gray-900
            file:mr-4 file:py-2.5 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-[#F5F5F7] file:text-brand-gray-900
            hover:file:bg-[#eee]
            file:cursor-pointer cursor-pointer"
        />

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-brand-gray-500">
            JPG, PNG, WebP arba AVIF · max 10 MB per failą · galima kelti po kelias
          </p>
          <button
            type="submit"
            disabled={isUploading}
            className="px-4 py-2 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isUploading ? 'Keliama…' : 'Įkelti'}
          </button>
        </div>
      </form>
    </section>
  )
}

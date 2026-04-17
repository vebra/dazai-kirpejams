'use client'

import { useActionState, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  saveBlogPostAction,
  uploadBlogCoverAction,
  type BlogFormState,
  type CoverUploadState,
} from './actions'
import type { BlogPostRow } from '@/lib/admin/queries'

const CATEGORIES = [
  { value: '', label: '— Pasirinkite —' },
  { value: 'patarimai', label: 'Patarimai' },
  { value: 'produktai', label: 'Produktai' },
  { value: 'tendencijos', label: 'Tendencijos' },
]

const initialState: BlogFormState = {}
const initialUpload: CoverUploadState = {}

export function BlogPostForm({ post }: { post?: BlogPostRow }) {
  const [state, formAction, isPending] = useActionState(
    saveBlogPostAction,
    initialState
  )
  const [uploadState, uploadAction, isUploading] = useActionState(
    uploadBlogCoverAction,
    initialUpload
  )
  const [tab, setTab] = useState<'lt' | 'en' | 'ru'>('lt')
  const [coverUrl, setCoverUrl] = useState(post?.coverImageUrl ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // When upload succeeds, update coverUrl
  const handleUpload = async (formData: FormData) => {
    const result = await uploadAction(formData)
    // uploadAction updates uploadState via useActionState;
    // we read the URL from the returned state in the effect below
  }

  // Sync upload result to coverUrl
  if (uploadState.url && uploadState.url !== coverUrl) {
    setCoverUrl(uploadState.url)
  }

  return (
    <form action={formAction} className="space-y-6">
      {post && <input type="hidden" name="id" value={post.id} />}
      {/* Hidden input carries the cover URL to the save action */}
      <input type="hidden" name="cover_image_url" value={coverUrl} />

      {/* Success / Error */}
      {state.success && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium">
          Straipsnis sėkmingai išsaugotas!
        </div>
      )}
      {state.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
          {state.error}
        </div>
      )}

      {/* Slug + Category + Author row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
            Slug (URL)
          </label>
          <input
            name="slug"
            defaultValue={post?.slug ?? ''}
            placeholder="pvz. kaip-pasirinkti-oksidanta"
            className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors font-mono"
          />
          <p className="text-[11px] text-brand-gray-500 mt-1">
            Palikus tuščią — sugeneruos iš LT pavadinimo
          </p>
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
            Kategorija
          </label>
          <select
            name="category"
            defaultValue={post?.category ?? ''}
            className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
            Autorius
          </label>
          <input
            name="author"
            defaultValue={post?.author ?? ''}
            placeholder="Vardas Pavardė"
            className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors"
          />
        </div>
      </div>

      {/* Cover image upload */}
      <div>
        <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
          Viršelio nuotrauka
        </label>

        {/* Preview */}
        {coverUrl ? (
          <div className="relative w-full max-w-[400px] aspect-[16/10] rounded-lg overflow-hidden border border-[#E0E0E0] mb-3 group">
            <Image
              src={coverUrl}
              alt="Viršelio nuotrauka"
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
          <div className="w-full max-w-[400px] aspect-[16/10] rounded-lg border-2 border-dashed border-[#ddd] bg-[#F5F5F7] flex items-center justify-center mb-3">
            <span className="text-sm text-brand-gray-500">Nėra nuotraukos</span>
          </div>
        )}

        {/* Upload error */}
        {uploadState.error && (
          <div className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-3 max-w-[400px]">
            {uploadState.error}
          </div>
        )}

        {/* File input + upload button */}
        <div className="flex items-center gap-3 max-w-[400px]">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={async (e) => {
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
        <p className="text-[11px] text-brand-gray-500 mt-1.5">
          JPG, PNG, WebP arba AVIF · max 10 MB · ta pati nuotrauka matysis visomis kalbomis (LT, EN, RU)
        </p>
      </div>

      {/* Language tabs */}
      <div>
        <div className="flex items-center gap-1 mb-4 border-b border-[#E0E0E0]">
          {(['lt', 'en', 'ru'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setTab(l)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-[1px] ${
                tab === l
                  ? 'border-brand-magenta text-brand-magenta'
                  : 'border-transparent text-brand-gray-500 hover:text-brand-gray-900'
              }`}
            >
              {l === 'lt' ? 'Lietuvių' : l === 'en' ? 'English' : 'Русский'}
            </button>
          ))}
        </div>

        {/* LT */}
        <div className={tab === 'lt' ? 'space-y-4' : 'hidden'}>
          <div>
            <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
              Pavadinimas (LT) *
            </label>
            <input
              name="title_lt"
              defaultValue={post?.titleLt ?? ''}
              className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
              Trumpas aprašymas (LT)
            </label>
            <textarea
              name="excerpt_lt"
              rows={2}
              defaultValue={post?.excerptLt ?? ''}
              className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors resize-y"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
              Turinys (LT) — Markdown
            </label>
            <textarea
              name="content_lt"
              rows={16}
              defaultValue={post?.contentLt ?? ''}
              className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors resize-y font-mono"
            />
          </div>
        </div>

        {/* EN */}
        <div className={tab === 'en' ? 'space-y-4' : 'hidden'}>
          <div>
            <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
              Title (EN)
            </label>
            <input
              name="title_en"
              defaultValue={post?.titleEn ?? ''}
              className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
              Excerpt (EN)
            </label>
            <textarea
              name="excerpt_en"
              rows={2}
              defaultValue={post?.excerptEn ?? ''}
              className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors resize-y"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
              Content (EN) — Markdown
            </label>
            <textarea
              name="content_en"
              rows={16}
              defaultValue={post?.contentEn ?? ''}
              className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors resize-y font-mono"
            />
          </div>
        </div>

        {/* RU */}
        <div className={tab === 'ru' ? 'space-y-4' : 'hidden'}>
          <div>
            <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
              Заголовок (RU)
            </label>
            <input
              name="title_ru"
              defaultValue={post?.titleRu ?? ''}
              className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
              Краткое описание (RU)
            </label>
            <textarea
              name="excerpt_ru"
              rows={2}
              defaultValue={post?.excerptRu ?? ''}
              className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors resize-y"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
              Содержание (RU) — Markdown
            </label>
            <textarea
              name="content_ru"
              rows={16}
              defaultValue={post?.contentRu ?? ''}
              className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors resize-y font-mono"
            />
          </div>
        </div>
      </div>

      {/* Publish toggle + Submit */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#eee]">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="hidden"
            name="is_published"
            value={post?.isPublished ? 'true' : 'false'}
          />
          <input
            type="checkbox"
            defaultChecked={post?.isPublished ?? false}
            onChange={(e) => {
              const hidden = e.target
                .closest('label')
                ?.querySelector('input[type=hidden]') as HTMLInputElement
              if (hidden) hidden.value = e.target.checked ? 'true' : 'false'
            }}
            className="w-5 h-5 rounded border-[#E0E0E0] text-brand-magenta focus:ring-brand-magenta"
          />
          <span className="text-sm font-medium text-brand-gray-900">
            Publikuoti
          </span>
        </label>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/blogas"
            className="px-5 py-2.5 text-sm font-medium text-brand-gray-500 hover:text-brand-gray-900 transition-colors"
          >
            Atšaukti
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 bg-brand-magenta text-white text-sm font-semibold rounded-lg hover:bg-brand-magenta-dark transition-colors disabled:opacity-50"
          >
            {isPending ? 'Saugoma…' : 'Išsaugoti'}
          </button>
        </div>
      </div>
    </form>
  )
}

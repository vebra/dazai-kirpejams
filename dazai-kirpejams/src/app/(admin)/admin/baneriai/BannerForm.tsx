'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { saveBannerAction, type BannerFormState } from './actions'
import type { BannerRow } from '@/lib/admin/queries'

const initialState: BannerFormState = {}

const PLACEMENTS = [
  { value: 'hero', label: 'Hero (pagrindinis puslapis)' },
  { value: 'category', label: 'Kategorijos puslapis' },
]

export function BannerForm({ banner }: { banner?: BannerRow }) {
  const [state, formAction, isPending] = useActionState(
    saveBannerAction,
    initialState
  )
  const [tab, setTab] = useState<'lt' | 'en' | 'ru'>('lt')

  return (
    <form action={formAction} className="space-y-6">
      {banner && <input type="hidden" name="id" value={banner.id} />}

      {state.success && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium">
          Baneris sėkmingai išsaugotas!
        </div>
      )}
      {state.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
          {state.error}
        </div>
      )}

      {/* Placement, sort, image, background */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
            Pozicija
          </label>
          <select
            name="placement"
            defaultValue={banner?.placement ?? 'hero'}
            className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors"
          >
            {PLACEMENTS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
            Eiliškumas
          </label>
          <input
            name="sort_order"
            type="number"
            defaultValue={banner?.sortOrder ?? 0}
            className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors"
          />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
            Fono spalva
          </label>
          <input
            name="background_color"
            defaultValue={banner?.backgroundColor ?? ''}
            placeholder="#F5F5F7"
            className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
            Nuotraukos URL
          </label>
          <input
            name="image_url"
            defaultValue={banner?.imageUrl ?? ''}
            placeholder="https://..."
            className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
              Pradžia
            </label>
            <input
              name="starts_at"
              type="datetime-local"
              defaultValue={banner?.startsAt?.substring(0, 16) ?? ''}
              className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
              Pabaiga
            </label>
            <input
              name="ends_at"
              type="datetime-local"
              defaultValue={banner?.endsAt?.substring(0, 16) ?? ''}
              className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors"
            />
          </div>
        </div>
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
          <FieldInput
            label="Badge (LT)"
            name="badge_lt"
            defaultValue={banner?.badgeLt ?? ''}
            placeholder="Color SHOCK · Pasirinkimas iš 50+ spalvų"
          />
          <FieldInput
            label="Antraštė (LT) *"
            name="title_lt"
            defaultValue={banner?.titleLt ?? ''}
          />
          <FieldTextarea
            label="Paantraštė (LT)"
            name="subtitle_lt"
            defaultValue={banner?.subtitleLt ?? ''}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <FieldInput
              label="CTA tekstas (LT)"
              name="cta_text_lt"
              defaultValue={banner?.ctaTextLt ?? ''}
              placeholder="Peržiūrėti produktus"
            />
            <FieldInput
              label="CTA URL"
              name="cta_url"
              defaultValue={banner?.ctaUrl ?? ''}
              placeholder="/produktai"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FieldInput
              label="Antrinis CTA tekstas (LT)"
              name="cta_secondary_text_lt"
              defaultValue={banner?.ctaSecondaryTextLt ?? ''}
              placeholder="Gauti pasiūlymą salonui"
            />
            <FieldInput
              label="Antrinis CTA URL"
              name="cta_secondary_url"
              defaultValue={banner?.ctaSecondaryUrl ?? ''}
              placeholder="/salonams"
            />
          </div>
        </div>

        {/* EN */}
        <div className={tab === 'en' ? 'space-y-4' : 'hidden'}>
          <FieldInput
            label="Badge (EN)"
            name="badge_en"
            defaultValue={banner?.badgeEn ?? ''}
          />
          <FieldInput
            label="Title (EN)"
            name="title_en"
            defaultValue={banner?.titleEn ?? ''}
          />
          <FieldTextarea
            label="Subtitle (EN)"
            name="subtitle_en"
            defaultValue={banner?.subtitleEn ?? ''}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <FieldInput
              label="CTA text (EN)"
              name="cta_text_en"
              defaultValue={banner?.ctaTextEn ?? ''}
            />
            <FieldInput
              label="Secondary CTA text (EN)"
              name="cta_secondary_text_en"
              defaultValue={banner?.ctaSecondaryTextEn ?? ''}
            />
          </div>
        </div>

        {/* RU */}
        <div className={tab === 'ru' ? 'space-y-4' : 'hidden'}>
          <FieldInput
            label="Badge (RU)"
            name="badge_ru"
            defaultValue={banner?.badgeRu ?? ''}
          />
          <FieldInput
            label="Заголовок (RU)"
            name="title_ru"
            defaultValue={banner?.titleRu ?? ''}
          />
          <FieldTextarea
            label="Подзаголовок (RU)"
            name="subtitle_ru"
            defaultValue={banner?.subtitleRu ?? ''}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <FieldInput
              label="CTA текст (RU)"
              name="cta_text_ru"
              defaultValue={banner?.ctaTextRu ?? ''}
            />
            <FieldInput
              label="Вторичный CTA текст (RU)"
              name="cta_secondary_text_ru"
              defaultValue={banner?.ctaSecondaryTextRu ?? ''}
            />
          </div>
        </div>
      </div>

      {/* Active toggle + Submit */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#eee]">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="hidden"
            name="is_active"
            value={banner?.isActive !== false ? 'true' : 'false'}
          />
          <input
            type="checkbox"
            defaultChecked={banner?.isActive !== false}
            onChange={(e) => {
              const hidden = e.target
                .closest('label')
                ?.querySelector('input[type=hidden]') as HTMLInputElement
              if (hidden) hidden.value = e.target.checked ? 'true' : 'false'
            }}
            className="w-5 h-5 rounded border-[#E0E0E0] text-brand-magenta focus:ring-brand-magenta"
          />
          <span className="text-sm font-medium text-brand-gray-900">
            Aktyvus
          </span>
        </label>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/baneriai"
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

function FieldInput({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string
  name: string
  defaultValue: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
        {label}
      </label>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors"
      />
    </div>
  )
}

function FieldTextarea({
  label,
  name,
  defaultValue,
  rows,
}: {
  label: string
  name: string
  defaultValue: string
  rows: number
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px] mb-1.5">
        {label}
      </label>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className="w-full px-4 py-2.5 border border-[#E0E0E0] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-magenta transition-colors resize-y"
      />
    </div>
  )
}

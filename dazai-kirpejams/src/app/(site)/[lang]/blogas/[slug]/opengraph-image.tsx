import { ImageResponse } from 'next/og'
import { getBlogPostBySlug } from '@/lib/data/queries'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import {
  OG_SIZE,
  OgLayout,
  loadFonts,
  truncate,
  DARK,
  GRAY,
} from '@/lib/og'

export const alt = 'Straipsnio vaizdas'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang, slug } = await params
  const locale = hasLocale(lang) ? (lang as 'lt' | 'en' | 'ru') : 'lt'
  const dict = await getDictionary(locale)
  const t = dict.og

  const post = await getBlogPostBySlug(slug, locale)
  if (!post) {
    return new ImageResponse(
      (
        <OgLayout>
          <div style={{ fontSize: 48, fontWeight: 700, color: DARK }}>
            {t.articleNotFound}
          </div>
        </OgLayout>
      ),
      { ...size, fonts: await loadFonts() }
    )
  }

  return new ImageResponse(
    (
      <OgLayout badge={t.blogBadge}>
        <div style={{ display: 'flex', gap: 48, alignItems: 'center', flex: 1 }}>
          {/* Cover image */}
          {post.coverImageUrl && (
            <div
              style={{
                width: 340,
                height: 340,
                borderRadius: 24,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'white',
                border: '1px solid #E0E0E0',
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.coverImageUrl}
                alt={post.title}
                width={340}
                height={340}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              />
            </div>
          )}

          {/* Article info */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div
              style={{
                fontSize: post.coverImageUrl ? 36 : 48,
                fontWeight: 700,
                color: DARK,
                lineHeight: 1.25,
              }}
            >
              {truncate(post.title, 100)}
            </div>

            {post.excerpt && (
              <div
                style={{
                  fontSize: 20,
                  color: GRAY,
                  marginTop: 16,
                  lineHeight: 1.5,
                }}
              >
                {truncate(post.excerpt, 140)}
              </div>
            )}

            {post.author && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20 }}>
                <span style={{ fontSize: 16, color: GRAY }}>
                  {post.author}
                </span>
              </div>
            )}
          </div>
        </div>
      </OgLayout>
    ),
    { ...size, fonts: await loadFonts() }
  )
}

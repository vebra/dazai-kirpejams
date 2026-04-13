'use client'

import Link from 'next/link'
import { useState } from 'react'
import { togglePublishAction, deleteBlogPostAction } from './actions'
import type { BlogPostRow } from '@/lib/admin/queries'

const DATE_FORMATTER = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function formatDate(iso: string): string {
  return DATE_FORMATTER.format(new Date(iso))
}

const CATEGORY_LABELS: Record<string, string> = {
  patarimai: 'Patarimai',
  produktai: 'Produktai',
  tendencijos: 'Tendencijos',
}

export function BlogPostsTable({ posts }: { posts: BlogPostRow[] }) {
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  const filtered = posts.filter((p) => {
    if (filter === 'published') return p.isPublished
    if (filter === 'draft') return !p.isPublished
    return true
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {(['all', 'published', 'draft'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                filter === s
                  ? 'bg-brand-gray-900 text-white'
                  : 'bg-[#F5F5F7] text-brand-gray-500 hover:text-brand-gray-900'
              }`}
            >
              {s === 'all'
                ? `Visi (${posts.length})`
                : s === 'published'
                  ? `Publikuoti (${posts.filter((p) => p.isPublished).length})`
                  : `Juodraščiai (${posts.filter((p) => !p.isPublished).length})`}
            </button>
          ))}
        </div>
        <Link
          href="/admin/blogas/naujas"
          className="px-4 py-2 bg-brand-magenta text-white text-sm font-semibold rounded-lg hover:bg-brand-magenta-dark transition-colors"
        >
          + Naujas straipsnis
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-brand-gray-500">
            {filter === 'all'
              ? 'Straipsnių kol kas nėra. Sukurkite pirmąjį!'
              : 'Nėra straipsnių su šiuo filtru.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-6 py-3 text-left">Straipsnis</th>
                  <th className="px-6 py-3 text-left">Kategorija</th>
                  <th className="px-6 py-3 text-center">Būsena</th>
                  <th className="px-6 py-3 text-left">Data</th>
                  <th className="px-6 py-3 text-right">Veiksmai</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => (
                  <tr
                    key={post.id}
                    className="border-t border-[#eee] hover:bg-[#F9F9FB] transition-colors"
                  >
                    <td className="px-6 py-3">
                      <Link
                        href={`/admin/blogas/${post.id}`}
                        className="font-medium text-brand-gray-900 hover:text-brand-magenta transition-colors"
                      >
                        {post.titleLt}
                      </Link>
                      <div className="text-[11px] text-brand-gray-500 font-mono mt-0.5">
                        /{post.slug}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-brand-gray-500">
                      {CATEGORY_LABELS[post.category ?? ''] ?? post.category ?? '—'}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <form action={togglePublishAction}>
                        <input type="hidden" name="id" value={post.id} />
                        <input
                          type="hidden"
                          name="publish"
                          value={post.isPublished ? 'false' : 'true'}
                        />
                        <button
                          type="submit"
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                            post.isPublished
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          {post.isPublished ? 'Publikuota' : 'Juodraštis'}
                        </button>
                      </form>
                    </td>
                    <td className="px-6 py-3 text-brand-gray-500 text-[12px]">
                      {post.publishedAt
                        ? formatDate(post.publishedAt)
                        : formatDate(post.createdAt)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/blogas/${post.id}`}
                          className="px-3 py-1 text-[12px] font-medium text-brand-magenta hover:text-brand-magenta-dark transition-colors"
                        >
                          Redaguoti
                        </Link>
                        <form
                          action={deleteBlogPostAction}
                          onSubmit={(e) => {
                            if (
                              !confirm(
                                `Tikrai ištrinti "${post.titleLt}"?`
                              )
                            ) {
                              e.preventDefault()
                            }
                          }}
                        >
                          <input type="hidden" name="id" value={post.id} />
                          <button
                            type="submit"
                            className="px-3 py-1 text-[12px] font-medium text-red-500 hover:text-red-700 transition-colors"
                          >
                            Trinti
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

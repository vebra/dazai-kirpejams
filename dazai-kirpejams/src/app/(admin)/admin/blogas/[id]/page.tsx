import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { getBlogPostById } from '@/lib/admin/queries'
import { BlogPostForm } from '../BlogPostForm'

export const metadata = {
  title: 'Redaguoti straipsnį',
}

export const dynamic = 'force-dynamic'

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()

  const { id } = await params
  const post = await getBlogPostById(id)
  if (!post) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-gray-900 mb-6">
        Redaguoti: {post.titleLt}
      </h1>
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <BlogPostForm post={post} />
      </div>
    </div>
  )
}

import { requireAdmin } from '@/lib/admin/auth'
import { getBlogPosts } from '@/lib/admin/queries'
import { BlogPostsTable } from './BlogPostsTable'

export const metadata = {
  title: 'Blogas',
}

export const dynamic = 'force-dynamic'

export default async function AdminBlogPage() {
  await requireAdmin()

  const posts = await getBlogPosts()

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-gray-900 mb-6">
        Blogas
      </h1>
      <BlogPostsTable posts={posts} />
    </div>
  )
}

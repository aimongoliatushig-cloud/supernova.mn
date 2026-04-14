import BlogManager from '@/components/admin/BlogManager'
import { getBlogAdminData } from '@/lib/admin/data'

export default async function AdminBlogPage() {
  const { categories, articles } = await getBlogAdminData()

  return <BlogManager initialCategories={categories} initialArticles={articles} />
}

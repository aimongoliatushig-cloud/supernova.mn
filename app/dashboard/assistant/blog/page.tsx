import BlogAnalyticsBoard from '@/components/admin/BlogAnalyticsBoard'
import { requireRole } from '@/lib/admin/auth'
import { getBlogStaffAnalyticsData } from '@/lib/admin/data'

export default async function AssistantBlogAnalyticsPage() {
  await requireRole(['office_assistant', 'super_admin'])
  const { categories, articles } = await getBlogStaffAnalyticsData()

  return <BlogAnalyticsBoard initialCategories={categories} initialArticles={articles} />
}

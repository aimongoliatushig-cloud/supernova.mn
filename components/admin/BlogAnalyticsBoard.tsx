'use client'

import { useMemo, useState } from 'react'
import { Eye, FilePenLine, FolderOpen, UserRound } from 'lucide-react'
import {
  AdminEmptyState,
  AdminInput,
  AdminPageHeader,
  AdminSectionCard,
  AdminStatCard,
} from '@/components/admin/AdminPrimitives'
import type { BlogArticle, BlogCategory } from '@/lib/admin/types'

function formatDateLabel(value: string | null | undefined) {
  if (!value) {
    return 'Огноо оруулаагүй'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Огноо тодорхойгүй'
  }

  const mongoliaDate = new Date(date.getTime() + 8 * 60 * 60 * 1000)
  const monthLabels = [
    'нэгдүгээр',
    'хоёрдугаар',
    'гуравдугаар',
    'дөрөвдүгээр',
    'тавдугаар',
    'зургаадугаар',
    'долоодугаар',
    'наймдугаар',
    'есдүгээр',
    'аравдугаар',
    'арваннэгдүгээр',
    'арванхоёрдугаар',
  ]

  return `${mongoliaDate.getUTCFullYear()} оны ${monthLabels[mongoliaDate.getUTCMonth()]} сарын ${mongoliaDate.getUTCDate()}`
}

function formatViewCount(value: number) {
  return value.toLocaleString('en-US')
}

function buildCategoryStats(categories: BlogCategory[], articles: BlogArticle[]) {
  const stats = new Map<string, { id: string | null; name: string; articleCount: number; totalViews: number }>()

  for (const category of categories) {
    stats.set(category.id, {
      id: category.id,
      name: category.name,
      articleCount: 0,
      totalViews: 0,
    })
  }

  for (const article of articles) {
    const key = article.category_id ?? 'uncategorized'
    const current = stats.get(key) ?? {
      id: article.category_id,
      name: article.categories?.name ?? 'Ангилалгүй',
      articleCount: 0,
      totalViews: 0,
    }

    current.articleCount += 1
    current.totalViews += article.view_count
    stats.set(key, current)
  }

  return Array.from(stats.values())
    .filter((item) => item.articleCount > 0)
    .sort((left, right) => right.totalViews - left.totalViews)
}

function truncate(text: string | null | undefined, length: number) {
  if (!text) {
    return ''
  }

  return text.length > length ? `${text.slice(0, length).trim()}...` : text
}

export default function BlogAnalyticsBoard({
  initialCategories,
  initialArticles,
}: {
  initialCategories: BlogCategory[]
  initialArticles: BlogArticle[]
}) {
  const [search, setSearch] = useState('')
  const categoryStats = useMemo(
    () => buildCategoryStats(initialCategories, initialArticles),
    [initialArticles, initialCategories]
  )
  const totalViews = useMemo(
    () => initialArticles.reduce((sum, article) => sum + article.view_count, 0),
    [initialArticles]
  )
  const publishedCount = useMemo(
    () => initialArticles.filter((article) => article.is_published).length,
    [initialArticles]
  )
  const topArticles = useMemo(
    () => [...initialArticles].sort((left, right) => right.view_count - left.view_count).slice(0, 5),
    [initialArticles]
  )

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase()

    return initialArticles.filter((article) => {
      if (!query) {
        return true
      }

      return (
        article.title.toLowerCase().includes(query) ||
        (article.excerpt ?? '').toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        (article.categories?.name ?? '').toLowerCase().includes(query) ||
        (article.publisher_name ?? '').toLowerCase().includes(query)
      )
    })
  }, [initialArticles, search])

  return (
    <div className="space-y-6 p-6 md:p-8">
      <AdminPageHeader
        eyebrow="Блогийн статистик"
        title="Нийтлэлийн үзэлтийн тайлан"
        description="Оффисын баг нийтлэл бүрийн нийтлэгч, нийт үзэлт, хамгийн их уншигдсан нийтлэл болон ангиллын гүйцэтгэлийг эндээс харна."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Нийт нийтлэл" value={initialArticles.length} />
        <AdminStatCard label="Нийт үзэлт" value={formatViewCount(totalViews)} tone="green" />
        <AdminStatCard label="Нийтэлсэн" value={publishedCount} tone="yellow" />
        <AdminStatCard label="Ноорог" value={initialArticles.length - publishedCount} tone="red" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminSectionCard
          title="Хамгийн их уншигдсан нийтлэлүүд"
          description="Үзэлтийн тоогоор тэргүүлж буй нийтлэлүүд."
        >
          {topArticles.length === 0 ? (
            <AdminEmptyState
              title="Нийтлэл алга"
              description="Нийтлэл нэмэгдсэний дараа хамгийн их уншигдсан жагсаалт энд харагдана."
            />
          ) : (
            <div className="space-y-3">
              {topArticles.map((article, index) => (
                <div
                  key={article.id}
                  className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E63B5]">
                        #{index + 1}
                      </p>
                      <p className="mt-1 text-base font-bold text-[#1F2937]">{article.title}</p>
                    </div>
                    <span className="rounded-full bg-[#EAF3FF] px-3 py-1 text-xs font-bold text-[#1E63B5]">
                      {formatViewCount(article.view_count)} үзэлт
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#5B6877]">
                    <span className="inline-flex items-center gap-2">
                      <UserRound size={15} className="text-[#1E63B5]" />
                      {article.publisher_name ?? 'Супернова баг'}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <FolderOpen size={15} className="text-[#1E63B5]" />
                      {article.categories?.name ?? 'Ангилалгүй'}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <FilePenLine size={15} className="text-[#1E63B5]" />
                      {formatDateLabel(article.published_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminSectionCard>

        <AdminSectionCard
          title="Ангиллын үзэлтийн жагсаалт"
          description="Ангилал бүрийн нийт үзэлт болон нийтлэлийн тоо."
        >
          {categoryStats.length === 0 ? (
            <AdminEmptyState
              title="Ангиллын статистик алга"
              description="Нийтлэлд үзэлт бүртгэгдэж эхлэхэд ангиллын тайлан энд харагдана."
            />
          ) : (
            <div className="space-y-3">
              {categoryStats.map((stat) => (
                <div
                  key={stat.id ?? stat.name}
                  className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-[#1F2937]">{stat.name}</p>
                      <p className="mt-1 text-sm text-[#6B7280]">{stat.articleCount} нийтлэл</p>
                    </div>
                    <span className="rounded-full bg-[#EAF3FF] px-3 py-1 text-xs font-bold text-[#1E63B5]">
                      {formatViewCount(stat.totalViews)} үзэлт
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminSectionCard>
      </div>

      <AdminSectionCard
        title="Нийтлэлийн дэлгэрэнгүй статистик"
        description="Гарчиг, нийтлэгч, нийтэлсэн огноо болон үзэлтийн тоогоор нь хайж харна."
      >
        <div className="space-y-4">
          <AdminInput
            placeholder="Гарчиг, ангилал эсвэл нийтлэгчээр хайх"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {filteredArticles.length === 0 ? (
            <AdminEmptyState
              title="Нийтлэл олдсонгүй"
              description="Хайлтын нөхцөлөө өөрчлөөд дахин оролдоно уу."
            />
          ) : (
            <div className="space-y-3">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-[#1F2937]">{article.title}</p>
                      <p className="mt-1 text-sm text-[#6B7280]">
                        {article.categories?.name ?? 'Ангилалгүй'}
                      </p>
                    </div>
                    <span
                      className={[
                        'rounded-full px-3 py-1 text-xs font-semibold',
                        article.is_published
                          ? 'bg-[#EAF8EF] text-[#15803D]'
                          : 'bg-[#F3F4F6] text-[#6B7280]',
                      ].join(' ')}
                    >
                      {article.is_published ? 'Нийтэлсэн' : 'Ноорог'}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-[#4B5563]">
                    {truncate(article.excerpt || article.content, 160)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#5B6877]">
                    <span className="inline-flex items-center gap-2">
                      <UserRound size={15} className="text-[#1E63B5]" />
                      {article.publisher_name ?? 'Супернова баг'}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Eye size={15} className="text-[#1E63B5]" />
                      {formatViewCount(article.view_count)} үзэлт
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <FilePenLine size={15} className="text-[#1E63B5]" />
                      {formatDateLabel(article.published_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminSectionCard>
    </div>
  )
}

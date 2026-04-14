'use client'

import { useEffect, useMemo, useState } from 'react'
import { Eye, FolderOpen, Plus, Save, Trash2, Upload, UserRound } from 'lucide-react'
import {
  deleteBlogArticle,
  deleteBlogCategory,
  saveBlogArticle,
  saveBlogCategory,
} from '@/app/dashboard/admin/actions'
import {
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminMessage,
  AdminPageHeader,
  AdminSectionCard,
  AdminSelect,
  AdminStatCard,
  AdminTextArea,
  AdminToggle,
} from '@/components/admin/AdminPrimitives'
import { useServerAction } from '@/components/admin/useServerAction'
import type {
  BlogArticle,
  BlogArticleInput,
  BlogCategory,
  BlogCategoryInput,
} from '@/lib/admin/types'

const blankCategory: BlogCategoryInput = {
  name: '',
  slug: '',
  description: '',
  sort_order: 0,
  is_active: true,
}

function toDateTimeLocal(value: string | null | undefined) {
  const date = value ? new Date(value) : new Date()

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const localValue = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localValue.toISOString().slice(0, 16)
}

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

const blankArticle: BlogArticleInput = {
  category_id: null,
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  image_url: '',
  cta_label: '',
  cta_link: '',
  is_published: true,
  published_at: toDateTimeLocal(null),
}

function toCategoryInput(category?: BlogCategory | null): BlogCategoryInput {
  if (!category) {
    return blankCategory
  }

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? '',
    sort_order: category.sort_order,
    is_active: category.is_active,
  }
}

function toArticleInput(article?: BlogArticle | null): BlogArticleInput {
  if (!article) {
    return {
      ...blankArticle,
      published_at: toDateTimeLocal(null),
    }
  }

  return {
    id: article.id,
    category_id: article.category_id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt ?? '',
    content: article.content,
    image_url: article.image_url ?? '',
    cta_label: article.cta_label ?? '',
    cta_link: article.cta_link ?? '',
    is_published: article.is_published,
    published_at: toDateTimeLocal(article.published_at),
  }
}

function truncate(text: string | null | undefined, length: number) {
  if (!text) {
    return ''
  }

  return text.length > length ? `${text.slice(0, length).trim()}...` : text
}

type CategoryStat = {
  id: string | null
  name: string
  articleCount: number
  totalViews: number
}

function buildCategoryStats(categories: BlogCategory[], articles: BlogArticle[]) {
  const stats = new Map<string, CategoryStat>()

  for (const category of categories) {
    stats.set(category.id, {
      id: category.id,
      name: category.name,
      articleCount: 0,
      totalViews: 0,
    })
  }

  const uncategorizedKey = 'uncategorized'

  for (const article of articles) {
    const key = article.category_id ?? uncategorizedKey
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
    .sort((left, right) => {
      if (right.totalViews !== left.totalViews) {
        return right.totalViews - left.totalViews
      }

      return right.articleCount - left.articleCount
    })
}

export default function BlogManager({
  initialCategories,
  initialArticles,
}: {
  initialCategories: BlogCategory[]
  initialArticles: BlogArticle[]
}) {
  const categoryAction = useServerAction()
  const articleAction = useServerAction()
  const [categories, setCategories] = useState(initialCategories)
  const [articles, setArticles] = useState(initialArticles)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialCategories[0]?.id ?? null
  )
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    initialArticles[0]?.id ?? null
  )
  const [categoryForm, setCategoryForm] = useState<BlogCategoryInput>(
    toCategoryInput(initialCategories[0] ?? null)
  )
  const [articleForm, setArticleForm] = useState<BlogArticleInput>(
    toArticleInput(initialArticles[0] ?? null)
  )
  const [search, setSearch] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadPending, setUploadPending] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)

  useEffect(() => {
    setCategories(initialCategories)

    if (!selectedCategoryId) {
      return
    }

    const selected = initialCategories.find((category) => category.id === selectedCategoryId)
    if (selected) {
      setCategoryForm(toCategoryInput(selected))
      return
    }

    const fallback = initialCategories[0] ?? null
    setSelectedCategoryId(fallback?.id ?? null)
    setCategoryForm(toCategoryInput(fallback))
  }, [initialCategories, selectedCategoryId])

  useEffect(() => {
    setArticles(initialArticles)

    if (!selectedArticleId) {
      return
    }

    const selected = initialArticles.find((article) => article.id === selectedArticleId)
    if (selected) {
      setArticleForm(toArticleInput(selected))
      return
    }

    const fallback = initialArticles[0] ?? null
    setSelectedArticleId(fallback?.id ?? null)
    setArticleForm(toArticleInput(fallback))
  }, [initialArticles, selectedArticleId])

  const categoryNameById = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories]
  )

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase()

    return articles.filter((article) => {
      if (!query) {
        return true
      }

      return (
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        (article.excerpt ?? '').toLowerCase().includes(query) ||
        (article.categories?.name ?? '').toLowerCase().includes(query) ||
        (article.publisher_name ?? '').toLowerCase().includes(query)
      )
    })
  }, [articles, search])

  const topArticles = useMemo(
    () =>
      [...articles]
        .sort((left, right) => {
          if (right.view_count !== left.view_count) {
            return right.view_count - left.view_count
          }

          return (right.published_at ?? '').localeCompare(left.published_at ?? '')
        })
        .slice(0, 5),
    [articles]
  )

  const categoryStats = useMemo(
    () => buildCategoryStats(categories, articles),
    [articles, categories]
  )

  const totalViews = useMemo(
    () => articles.reduce((sum, article) => sum + article.view_count, 0),
    [articles]
  )

  const publishedCount = useMemo(
    () => articles.filter((article) => article.is_published).length,
    [articles]
  )

  const selectedArticle = useMemo(
    () => articles.find((article) => article.id === selectedArticleId) ?? null,
    [articles, selectedArticleId]
  )

  function openCategory(category?: BlogCategory | null) {
    setSelectedCategoryId(category?.id ?? null)
    setCategoryForm(toCategoryInput(category))
    categoryAction.setError(null)
    categoryAction.setSuccess(null)
  }

  function openArticle(article?: BlogArticle | null) {
    setSelectedArticleId(article?.id ?? null)
    setArticleForm(toArticleInput(article))
    setSelectedFile(null)
    setFileInputKey((current) => current + 1)
    articleAction.setError(null)
    articleAction.setSuccess(null)
  }

  async function handleUpload() {
    if (!selectedFile) {
      articleAction.setError('Оруулах зургаа эхлээд сонгоно уу.')
      return
    }

    setUploadPending(true)
    articleAction.setError(null)
    articleAction.setSuccess(null)

    try {
      const formData = new FormData()
      formData.set('image', selectedFile)

      const response = await fetch('/api/admin/blog-upload', {
        method: 'POST',
        body: formData,
      })

      const payload = (await response.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error ?? 'Зураг оруулах үед алдаа гарлаа.')
      }

      setArticleForm((current) => ({ ...current, image_url: payload.url! }))
      setSelectedFile(null)
      setFileInputKey((current) => current + 1)
      articleAction.setSuccess('Зураг амжилттай орлоо.')
    } catch (error) {
      articleAction.setError(
        error instanceof Error ? error.message : 'Зураг оруулах үед алдаа гарлаа.'
      )
    } finally {
      setUploadPending(false)
    }
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <AdminPageHeader
        eyebrow="Блог"
        title="Блогийн нийтлэл ба үзэлтийн хяналт"
        description="Нийтлэл бүрийн нийтлэгч, нийт үзэлт, хамгийн их уншигдсан ангилал болон нүүр хуудсанд харагдах контентыг эндээс удирдана."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Нийт нийтлэл" value={articles.length} />
        <AdminStatCard label="Нийт үзэлт" value={formatViewCount(totalViews)} tone="green" />
        <AdminStatCard label="Нийтэлсэн" value={publishedCount} tone="yellow" />
        <AdminStatCard label="Ноорог" value={articles.length - publishedCount} tone="red" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminSectionCard
          title="Тэргүүлэх нийтлэл"
          description="Хамгийн их уншигдсан нийтлэл болон тэргүүлэх ангиллын товч статистик."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#D8E6F6] bg-[#F7FAFF] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E63B5]">
                Хамгийн их уншигдсан нийтлэл
              </p>
              {topArticles[0] ? (
                <div className="mt-3 space-y-3">
                  <p className="text-lg font-black text-[#10233B]">{topArticles[0].title}</p>
                  <div className="space-y-2 text-sm text-[#5B6877]">
                    <div className="flex items-center gap-2">
                      <Eye size={16} className="text-[#1E63B5]" />
                      <span>{formatViewCount(topArticles[0].view_count)} үзэлт</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserRound size={16} className="text-[#1E63B5]" />
                      <span>{topArticles[0].publisher_name ?? 'Супернова баг'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FolderOpen size={16} className="text-[#1E63B5]" />
                      <span>{topArticles[0].categories?.name ?? 'Ангилалгүй'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#5B6877]">Одоогоор нийтлэл бүртгэгдээгүй байна.</p>
              )}
            </div>

            <div className="rounded-2xl border border-[#D8E6F6] bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E63B5]">
                Хамгийн их үзэлттэй ангилал
              </p>
              {categoryStats[0] ? (
                <div className="mt-3 space-y-3">
                  <p className="text-lg font-black text-[#10233B]">{categoryStats[0].name}</p>
                  <div className="space-y-2 text-sm text-[#5B6877]">
                    <div className="flex items-center gap-2">
                      <Eye size={16} className="text-[#1E63B5]" />
                      <span>{formatViewCount(categoryStats[0].totalViews)} нийт үзэлт</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FolderOpen size={16} className="text-[#1E63B5]" />
                      <span>{categoryStats[0].articleCount} нийтлэлтэй</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#5B6877]">Ангиллын статистик хараахан үүсээгүй байна.</p>
              )}
            </div>
          </div>
        </AdminSectionCard>

        <AdminSectionCard
          title="Ангиллын үзэлтийн жагсаалт"
          description="Ангилал бүр нийт хэдэн нийтлэлтэй, хэдэн үзэлт авсныг харуулна."
        >
          {categoryStats.length === 0 ? (
            <AdminEmptyState
              title="Статистик хараахан үүсээгүй байна"
              description="Нийтлэлүүд нэмэгдэж, уншигдаж эхлэхэд ангиллын үзэлт энд гарч ирнэ."
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

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminSectionCard
          title={selectedCategoryId ? 'Ангилал засах' : 'Шинэ ангилал нэмэх'}
          description="Нийтлэлүүдийг ангилж, блогийн жагсаалтыг эмхэлнэ."
          action={
            <button
              type="button"
              onClick={() => openCategory(null)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#154D8F]"
            >
              <Plus size={14} />
              Шинэ ангилал
            </button>
          }
        >
          <div className="space-y-4">
            {categoryAction.error ? (
              <AdminMessage tone="error">{categoryAction.error}</AdminMessage>
            ) : null}
            {categoryAction.success ? (
              <AdminMessage tone="success">{categoryAction.success}</AdminMessage>
            ) : null}

            <AdminField label="Ангиллын нэр" required>
              <AdminInput
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </AdminField>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="Slug">
                <AdminInput
                  value={categoryForm.slug}
                  onChange={(event) =>
                    setCategoryForm((current) => ({ ...current, slug: event.target.value }))
                  }
                />
              </AdminField>

              <AdminField label="Дараалал">
                <AdminInput
                  type="number"
                  min={0}
                  value={categoryForm.sort_order}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      sort_order: Number(event.target.value),
                    }))
                  }
                />
              </AdminField>
            </div>

            <AdminField label="Тайлбар">
              <AdminTextArea
                rows={3}
                value={categoryForm.description}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </AdminField>

            <AdminToggle
              label="Идэвхтэй"
              active={categoryForm.is_active}
              onClick={() =>
                setCategoryForm((current) => ({
                  ...current,
                  is_active: !current.is_active,
                }))
              }
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={categoryAction.pending}
                onClick={() =>
                  categoryAction.runAction(() => saveBlogCategory(categoryForm), {
                    successMessage: selectedCategoryId
                      ? 'Ангилал шинэчлэгдлээ.'
                      : 'Ангилал бүртгэгдлээ.',
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#154D8F] disabled:opacity-60"
              >
                <Save size={16} />
                Хадгалах
              </button>

              {selectedCategoryId ? (
                <button
                  type="button"
                  disabled={categoryAction.pending}
                  onClick={() => {
                    if (!window.confirm('Энэ ангиллыг устгах уу?')) {
                      return
                    }

                    categoryAction.runAction(() => deleteBlogCategory(selectedCategoryId), {
                      successMessage: 'Ангилал устгагдлаа.',
                    })
                    openCategory(null)
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#F7D5D9] bg-[#FFF1F2] px-4 py-3 text-sm font-semibold text-[#F23645]"
                >
                  <Trash2 size={16} />
                  Устгах
                </button>
              ) : null}
            </div>
          </div>
        </AdminSectionCard>

        <AdminSectionCard
          title="Ангиллын жагсаалт"
          description="Идэвхтэй эсэх, slug болон нийтлэлд ашиглагдаж буй ангиллууд."
        >
          {categories.length === 0 ? (
            <AdminEmptyState
              title="Ангилал алга"
              description="Эхний блог ангиллаа үүсгээд нийтлэлүүдээ ангилаарай."
              actionLabel="Шинэ ангилал"
              onAction={() => openCategory(null)}
            />
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => openCategory(category)}
                  className={[
                    'w-full rounded-2xl border p-4 text-left transition',
                    selectedCategoryId === category.id
                      ? 'border-[#B8D5FB] bg-[#F7FAFF]'
                      : 'border-[#E5E7EB] bg-white',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-[#1F2937]">{category.name}</p>
                      <p className="mt-1 text-sm text-[#6B7280]">{category.slug}</p>
                    </div>
                    <span
                      className={[
                        'rounded-full px-3 py-1 text-xs font-semibold',
                        category.is_active
                          ? 'bg-[#EAF8EF] text-[#15803D]'
                          : 'bg-[#F3F4F6] text-[#6B7280]',
                      ].join(' ')}
                    >
                      {category.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                    </span>
                  </div>
                  {category.description ? (
                    <p className="mt-3 text-sm leading-6 text-[#4B5563]">
                      {truncate(category.description, 120)}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </AdminSectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.95fr]">
        <AdminSectionCard
          title={selectedArticleId ? 'Нийтлэл засах' : 'Шинэ нийтлэл нэмэх'}
          description="Нийтлэгчийн нэр, үзэлтийн тоо, зураг, ангилал болон нийтлэлийн товчны холбоосыг эндээс удирдана."
          action={
            <button
              type="button"
              onClick={() => openArticle(null)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#154D8F]"
            >
              <Plus size={14} />
              Шинэ нийтлэл
            </button>
          }
        >
          <div className="space-y-4">
            {articleAction.error ? (
              <AdminMessage tone="error">{articleAction.error}</AdminMessage>
            ) : null}
            {articleAction.success ? (
              <AdminMessage tone="success">{articleAction.success}</AdminMessage>
            ) : null}

            {selectedArticleId ? (
              <div className="grid gap-3 rounded-2xl border border-[#D8E6F6] bg-[#F7FAFF] p-4 md:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1E63B5]">
                    Нийтлэгч
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#1F2937]">
                    {selectedArticle?.publisher_name ?? 'Супернова баг'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1E63B5]">
                    Нийт үзэлт
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#1F2937]">
                    {formatViewCount(selectedArticle?.view_count ?? 0)} удаа
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1E63B5]">
                    Нийтэлсэн огноо
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#1F2937]">
                    {formatDateLabel(selectedArticle?.published_at)}
                  </p>
                </div>
              </div>
            ) : null}

            <AdminField label="Гарчиг" required>
              <AdminInput
                value={articleForm.title}
                onChange={(event) =>
                  setArticleForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </AdminField>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="Slug">
                <AdminInput
                  value={articleForm.slug}
                  onChange={(event) =>
                    setArticleForm((current) => ({ ...current, slug: event.target.value }))
                  }
                />
              </AdminField>

              <AdminField label="Ангилал">
                <AdminSelect
                  value={articleForm.category_id ?? ''}
                  onChange={(event) =>
                    setArticleForm((current) => ({
                      ...current,
                      category_id: event.target.value || null,
                    }))
                  }
                >
                  <option value="">Ангилалгүй</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>
            </div>

            <AdminField label="Товч агуулга">
              <AdminTextArea
                rows={3}
                value={articleForm.excerpt}
                onChange={(event) =>
                  setArticleForm((current) => ({ ...current, excerpt: event.target.value }))
                }
              />
            </AdminField>

            <AdminField label="Нийтлэлийн текст" required>
              <AdminTextArea
                rows={10}
                value={articleForm.content}
                onChange={(event) =>
                  setArticleForm((current) => ({ ...current, content: event.target.value }))
                }
              />
            </AdminField>

            <div className="rounded-2xl border border-[#D8E6F6] bg-[#F7FAFF] p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <AdminField label="Зургийн холбоос" hint="Оруулсан зураг автоматаар энд орно.">
                  <AdminInput
                    value={articleForm.image_url}
                    onChange={(event) =>
                      setArticleForm((current) => ({
                        ...current,
                        image_url: event.target.value,
                      }))
                    }
                  />
                </AdminField>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#1F2937]">
                    Зураг оруулах
                  </label>
                  <input
                    key={fileInputKey}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                    className="block w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1F2937]"
                  />
                  <button
                    type="button"
                    disabled={uploadPending}
                    onClick={handleUpload}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#BCD4F4] bg-white px-4 py-3 text-sm font-semibold text-[#1E63B5] transition hover:bg-[#EAF3FF] disabled:opacity-60"
                  >
                    <Upload size={16} />
                    {uploadPending ? 'Зураг оруулж байна...' : 'Зураг оруулах'}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="Товчны текст">
                <AdminInput
                  value={articleForm.cta_label}
                  onChange={(event) =>
                    setArticleForm((current) => ({
                      ...current,
                      cta_label: event.target.value,
                    }))
                  }
                />
              </AdminField>

              <AdminField label="Товчны холбоос" hint="`/appointment` эсвэл `https://...`">
                <AdminInput
                  value={articleForm.cta_link}
                  onChange={(event) =>
                    setArticleForm((current) => ({
                      ...current,
                      cta_link: event.target.value,
                    }))
                  }
                />
              </AdminField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="Нийтэлсэн огноо">
                <AdminInput
                  type="datetime-local"
                  value={articleForm.published_at}
                  onChange={(event) =>
                    setArticleForm((current) => ({
                      ...current,
                      published_at: event.target.value,
                    }))
                  }
                />
              </AdminField>

              <div className="space-y-2">
                <span className="block text-sm font-semibold text-[#1F2937]">Төлөв</span>
                <AdminToggle
                  label="Нийтэлсэн"
                  active={articleForm.is_published}
                  onClick={() =>
                    setArticleForm((current) => ({
                      ...current,
                      is_published: !current.is_published,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={articleAction.pending}
                onClick={() =>
                  articleAction.runAction(() => saveBlogArticle(articleForm), {
                    successMessage: selectedArticleId
                      ? 'Нийтлэл шинэчлэгдлээ.'
                      : 'Нийтлэл бүртгэгдлээ.',
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#154D8F] disabled:opacity-60"
              >
                <Save size={16} />
                Хадгалах
              </button>

              {selectedArticleId ? (
                <button
                  type="button"
                  disabled={articleAction.pending}
                  onClick={() => {
                    if (!window.confirm('Энэ нийтлэлийг устгах уу?')) {
                      return
                    }

                    articleAction.runAction(() => deleteBlogArticle(selectedArticleId), {
                      successMessage: 'Нийтлэл устгагдлаа.',
                    })
                    openArticle(null)
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#F7D5D9] bg-[#FFF1F2] px-4 py-3 text-sm font-semibold text-[#F23645]"
                >
                  <Trash2 size={16} />
                  Устгах
                </button>
              ) : null}
            </div>
          </div>
        </AdminSectionCard>

        <AdminSectionCard
          title="Нийтлэлийн жагсаалт"
          description="Нүүр хуудсан дээр нийтэлсэн огноогоор хамгийн сүүлийн нийтлэлүүд автоматаар харагдана."
        >
          <div className="space-y-4">
            <AdminInput
              placeholder="Гарчиг, текст, ангилал эсвэл нийтлэгчээр хайх"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {filteredArticles.length === 0 ? (
              <AdminEmptyState
                title="Нийтлэл алга"
                description="Эхний блог нийтлэлээ үүсгээд нүүр хуудсан дээр сүүлийн мэдээнүүдээ харуулаарай."
                actionLabel="Шинэ нийтлэл"
                onAction={() => openArticle(null)}
              />
            ) : (
              <div className="space-y-3">
                {filteredArticles.map((article) => (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => openArticle(article)}
                    className={[
                      'w-full rounded-2xl border p-4 text-left transition',
                      selectedArticleId === article.id
                        ? 'border-[#B8D5FB] bg-[#F7FAFF]'
                        : 'border-[#E5E7EB] bg-white',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-bold text-[#1F2937]">{article.title}</p>
                        <p className="mt-1 text-sm text-[#6B7280]">
                          {article.categories?.name ??
                            (article.category_id
                              ? categoryNameById[article.category_id] ?? 'Ангилалгүй'
                              : 'Ангилалгүй')}
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
                      {truncate(article.excerpt || article.content, 150)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#6B7280]">
                      <span>{formatDateLabel(article.published_at)}</span>
                      <span>Нийтлэгч: {article.publisher_name ?? 'Супернова баг'}</span>
                      <span>{formatViewCount(article.view_count)} үзэлт</span>
                      <span>Slug: {article.slug}</span>
                      {article.image_url ? <span>Зурагтай</span> : <span>Зураггүй</span>}
                      {article.cta_link ? <span>Товчтой</span> : <span>Товчгүй</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </AdminSectionCard>
      </div>
    </div>
  )
}

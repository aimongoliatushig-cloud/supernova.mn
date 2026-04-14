import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, UserRound } from 'lucide-react'
import ArticleViewCounter from '@/components/blog/ArticleViewCounter'
import Footer from '@/components/layout/Footer'
import Navbar from '@/components/layout/Navbar'
import {
  DEFAULT_CONTACT_ADDRESS,
  DEFAULT_CONTACT_EMAIL,
  DEFAULT_CONTACT_PHONE,
  sanitizeContactSettings,
} from '@/lib/public/contact'
import { formatArticleLongDate } from '@/lib/public/articles'
import { getPublicBlogArticleBySlug, getPublicCmsContent } from '@/lib/public/data'
import { notFound } from 'next/navigation'

type BlogArticlePageParams = Promise<{
  slug: string
}>

function isExternalUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

export default async function BlogArticlePage({
  params,
}: {
  params: BlogArticlePageParams
}) {
  const { slug } = await params
  const [article, cms] = await Promise.all([
    getPublicBlogArticleBySlug(slug),
    getPublicCmsContent(),
  ])

  if (!article) {
    notFound()
  }

  const safeContact = sanitizeContactSettings(cms.contact)
  const phone = safeContact?.phone ?? DEFAULT_CONTACT_PHONE
  const address = safeContact?.address ?? DEFAULT_CONTACT_ADDRESS
  const email = safeContact?.email ?? DEFAULT_CONTACT_EMAIL
  const paragraphs = article.content
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return (
    <>
      <Navbar phone={phone} />

      <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(30,99,181,0.12),_transparent_30%),linear-gradient(180deg,#F7FAFF_0%,#FFFFFF_100%)] pb-20 pt-6 md:pb-28">
        <div className="mx-auto max-w-5xl px-4">
          <Link
            href="/#articles"
            className="inline-flex items-center gap-2 rounded-full border border-[#D8E6F6] bg-white px-4 py-2 text-sm font-semibold text-[#1E63B5] shadow-sm transition hover:bg-[#EAF3FF]"
          >
            <ArrowLeft size={16} />
            Нүүр хуудас руу буцах
          </Link>

          <article className="mt-6 overflow-hidden rounded-[2.25rem] border border-[#D8E6F6] bg-white shadow-[0_28px_90px_rgba(17,37,68,0.1)]">
            <div className="relative aspect-[16/8] bg-[linear-gradient(135deg,#EAF3FF_0%,#D6E6FA_100%)]">
              <Image
                src={article.image_url || '/logo.png'}
                alt={article.title}
                fill
                unoptimized
                className="object-cover"
              />
            </div>

            <div className="px-6 py-8 md:px-10 md:py-10">
              {article.categories?.name ? (
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
                  {article.categories.name}
                </p>
              ) : null}

              <h1 className="mt-4 text-3xl font-black leading-tight text-[#10233B] md:text-5xl">
                {article.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#7C8B99]">
                <span className="inline-flex items-center gap-2">
                  <Calendar size={16} className="text-[#1E63B5]" />
                  {formatArticleLongDate(article.published_at)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <UserRound size={16} className="text-[#1E63B5]" />
                  {article.publisher_name ?? 'Супернова баг'}
                </span>
                <ArticleViewCounter
                  slug={article.slug}
                  initialViews={article.view_count}
                />
                {address ? <span>{address}</span> : null}
              </div>

              {article.excerpt ? (
                <p className="mt-6 rounded-[1.5rem] bg-[#F7FAFF] px-5 py-4 text-base leading-8 text-[#35506C]">
                  {article.excerpt}
                </p>
              ) : null}

              <div className="mt-8 space-y-5 text-base leading-8 text-[#425466]">
                {paragraphs.map((paragraph, index) => (
                  <p key={`${article.id}-${index}`}>{paragraph}</p>
                ))}
              </div>

              {article.cta_label && article.cta_link ? (
                <div className="mt-10 border-t border-[#E6EEF8] pt-8">
                  {isExternalUrl(article.cta_link) ? (
                    <a
                      href={article.cta_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#1E63B5] px-5 py-3 text-sm font-bold text-white shadow-[0_18px_40px_rgba(30,99,181,0.24)] transition hover:bg-[#154D8F]"
                    >
                      {article.cta_label}
                      <ArrowRight size={16} />
                    </a>
                  ) : (
                    <Link
                      href={article.cta_link}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#1E63B5] px-5 py-3 text-sm font-bold text-white shadow-[0_18px_40px_rgba(30,99,181,0.24)] transition hover:bg-[#154D8F]"
                    >
                      {article.cta_label}
                      <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
              ) : null}
            </div>
          </article>

          <div className="mt-6 rounded-[1.75rem] border border-[#D8E6F6] bg-white px-6 py-5 text-sm leading-7 text-[#5B6877] shadow-sm">
            Асуух зүйл байвал <a href={`tel:${phone.replaceAll('-', '')}`} className="font-bold text-[#1E63B5]">{phone}</a>
            {' '}дугаараар холбогдох эсвэл <a href={`mailto:${email}`} className="font-bold text-[#1E63B5]">{email}</a>
            {' '}хаяг руу бичиж болно.
          </div>
        </div>
      </main>

      <Footer
        contact={safeContact}
        socials={cms.socials}
        workingHours={cms.workingHours}
        privacyText={
          cms.entries.privacy_notice ||
          'Таны мэдээлэл аюулгүй хадгалагдаж, зөвхөн эмнэлгийн үйлчилгээний зорилгоор ашиглагдана.'
        }
      />
    </>
  )
}

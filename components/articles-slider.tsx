'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useState } from 'react'
import type { PublicBlogArticle } from '@/lib/public/types'

type SliderArticle = PublicBlogArticle & {
  displayDate: string
}

function truncateWords(value: string, wordLimit: number) {
  const words = value.trim().split(/\s+/).filter(Boolean)

  if (words.length <= wordLimit) {
    return words.join(' ')
  }

  return `${words.slice(0, wordLimit).join(' ')}...`
}

function getArticlePreview(article: PublicBlogArticle) {
  return truncateWords(article.excerpt?.trim() || article.content, 60)
}

function getArticleHref(slug: string) {
  return `/blog/${slug}`
}

function formatArticleViews(value: number) {
  return `${value.toLocaleString('en-US')} үзэлт`
}

export default function ArticlesSlider({
  articles,
}: {
  articles: SliderArticle[]
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchCurrentX = useRef<number | null>(null)

  const articleCount = articles.length

  function goTo(index: number) {
    if (articleCount === 0) {
      return
    }

    setActiveIndex((index + articleCount) % articleCount)
  }

  function goToPrevious() {
    goTo(activeIndex - 1)
  }

  function goToNext() {
    goTo(activeIndex + 1)
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null
    touchCurrentX.current = touchStartX.current
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    touchCurrentX.current = event.touches[0]?.clientX ?? null
  }

  function handleTouchEnd() {
    if (touchStartX.current == null || touchCurrentX.current == null) {
      touchStartX.current = null
      touchCurrentX.current = null
      return
    }

    const deltaX = touchCurrentX.current - touchStartX.current

    if (Math.abs(deltaX) >= 50) {
      if (deltaX < 0) {
        goToNext()
      } else {
        goToPrevious()
      }
    }

    touchStartX.current = null
    touchCurrentX.current = null
  }

  return (
    <section id="articles" className="scroll-mt-28 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="overflow-hidden rounded-[2.25rem] border border-[#D8E6F6] bg-white p-6 shadow-[0_28px_90px_rgba(17,37,68,0.1)] md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
                Сүүлийн мэдээ
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-[#10233B] md:text-4xl">
                Эмнэлгийн блог ба зөвлөмж
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#5B6877] md:text-base">
                Сүүлийн нийтлэгдсэн зөвлөмжүүдийг том дэлгэц дээр зурагтай, гар утсан дээр
                уншихад амар бүтэцтэйгээр үзүүлнэ.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <span className="rounded-full bg-[#EAF3FF] px-3 py-1 text-xs font-bold text-[#1E63B5]">
                {articleCount === 0 ? '0/0' : `${activeIndex + 1}/${articleCount}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPrevious}
                  disabled={articleCount <= 1}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#D8E6F6] bg-white text-[#1E63B5] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Previous article"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  disabled={articleCount <= 1}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#D8E6F6] bg-white text-[#1E63B5] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Next article"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {articleCount === 0 ? (
            <div className="mt-8 rounded-[1.75rem] border border-dashed border-[#D6E6FA] bg-[#F7FAFF] p-8">
              <p className="text-lg font-black text-[#10233B]">Нийтлэл одоогоор байхгүй байна</p>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5B6877]">
                Супер админ хэсэгт нийтлэл нэмэгдэхэд энэ хэсэг автоматаар дүүрнэ.
              </p>
            </div>
          ) : (
            <div
              className="mt-8 overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {articles.map((article) => (
                  <div key={article.id} className="min-w-full">
                    <Link
                      href={getArticleHref(article.slug)}
                      className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-[#E6EEF8] bg-[linear-gradient(180deg,#FFFFFF_0%,#F7FAFF_100%)] md:min-h-[28rem] md:flex-row"
                    >
                      <div className="relative h-64 w-full overflow-hidden bg-[linear-gradient(135deg,#EAF3FF_0%,#D6E6FA_100%)] md:h-auto md:w-[45%]">
                        <Image
                          src={article.image_url || '/logo.png'}
                          alt={article.title}
                          fill
                          unoptimized
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      </div>

                      <div className="flex flex-1 flex-col p-6 md:w-[55%] md:p-8">
                        {article.categories?.name ? (
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E63B5]">
                            {article.categories.name}
                          </p>
                        ) : null}
                        <p className="mt-3 text-sm font-medium text-[#7C8B99]">
                          {article.displayDate}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[#6E7F91]">
                          <span>{article.publisher_name ?? 'Супернова баг'}</span>
                          <span>{formatArticleViews(article.view_count)}</span>
                        </div>
                        <h3 className="mt-4 text-2xl font-black leading-tight text-[#10233B] md:text-[2.1rem]">
                          {article.title}
                        </h3>
                        <p className="mt-5 text-sm leading-8 text-[#5B6877] md:text-base">
                          {getArticlePreview(article)}
                        </p>

                        <div className="mt-auto pt-8">
                          <span className="inline-flex items-center gap-2 rounded-2xl bg-[#1E63B5] px-5 py-3 text-sm font-bold text-white shadow-[0_18px_40px_rgba(30,99,181,0.24)] transition group-hover:bg-[#154D8F]">
                            Дэлгэрэнгүй унших
                            <ArrowRight size={16} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

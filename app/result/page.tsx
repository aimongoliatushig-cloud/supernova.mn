import Link from 'next/link'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Gift,
  Phone,
  Shield,
} from 'lucide-react'
import FlowHeader from '@/components/public/FlowHeader'
import { getResultPageData } from '@/lib/public/data'
import {
  getCategoryMatchScore,
  normalizeCategoryText,
} from '@/lib/public/category-matching'
import type { RiskLevel } from '@/lib/admin/types'

type ResultSearchParams = Promise<{
  assessment?: string
}>

type RecommendationCard =
  | {
      id: string
      kind: 'package'
      title: string
      description: string | null
      price: number
      oldPrice: number | null
      badgeText: string | null
      badgeColor: string
      extraLabel: string | null
      score: number
    }
  | {
      id: string
      kind: 'service'
      title: string
      description: string | null
      price: number
      oldPrice: null
      badgeText: string | null
      badgeColor: string
      extraLabel: string | null
      score: number
      durationMinutes: number
    }

function formatCurrency(value: number) {
  return new Intl.NumberFormat('mn-MN').format(value)
}

function getRiskContent(level: RiskLevel, entries: Record<string, string>) {
  if (level === 'high') {
    return {
      label: entries.result_high_label || 'Өндөр эрсдэл',
      message:
        entries.result_high_message ||
        'Таны хариулт эмчийн үнэлгээ, нэмэлт шинжилгээ шаардлагатайг илтгэж байна.',
      urgency: entries.result_high_urgency || 'Өнөөдөр эсвэл маргааш',
      accent: '#F23645',
      background: '#FEE9EB',
      border: '#FCD0D2',
      icon: <AlertTriangle size={34} className="text-[#F23645]" />,
    }
  }

  if (level === 'medium') {
    return {
      label: entries.result_medium_label || 'Дунд эрсдэл',
      message:
        entries.result_medium_message ||
        'Эрт үзлэг, нарийвчилсан оношилгоо хийлгэвэл эрсдэлийг эрт хянах боломжтой.',
      urgency: entries.result_medium_urgency || 'Ойрын 3-7 хоногт',
      accent: '#D97706',
      background: '#FEF9C3',
      border: '#FDE68A',
      icon: <AlertTriangle size={34} className="text-[#D97706]" />,
    }
  }

  return {
    label: entries.result_low_label || 'Бага эрсдэл',
    message:
      entries.result_low_message ||
      'Одоогийн байдлаар яаралтай эрсдэл харагдсангүй. Урьдчилан сэргийлэх үзлэгээ тогтмол хийлгээрэй.',
    urgency: entries.result_low_urgency || 'Ойрын 1-2 долоо хоногт',
    accent: '#16A34A',
    background: '#DCFCE7',
    border: '#BBF7D0',
    icon: <CheckCircle2 size={34} className="text-[#16A34A]" />,
  }
}

export default async function ResultPage({
  searchParams,
}: {
  searchParams: ResultSearchParams
}) {
  const params = await searchParams
  const assessmentId = params.assessment

  if (!assessmentId) {
    return (
      <div className="min-h-screen bg-[#F7FAFF] px-4 py-20">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#E5E7EB] bg-white p-8 text-center">
          <h1 className="text-2xl font-black text-[#1F2937]">Үр дүн олдсонгүй</h1>
          <p className="mt-3 text-sm leading-6 text-[#6B7280]">
            Шалгалтын урсгалаа дахин эхлүүлж, үнэлгээг CRM рүү хадгалсны дараа үр дүнгээ
            эндээс харах боломжтой.
          </p>
          <Link
            href="/check"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#1E63B5] px-6 py-3 text-sm font-bold text-white"
          >
            Шалгалт эхлэх
          </Link>
        </div>
      </div>
    )
  }

  const data = await getResultPageData(assessmentId)

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F7FAFF] px-4 py-20">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#E5E7EB] bg-white p-8 text-center">
          <h1 className="text-2xl font-black text-[#1F2937]">Үнэлгээний мэдээлэл олдсонгүй</h1>
          <p className="mt-3 text-sm leading-6 text-[#6B7280]">
            Assessment ID хүчингүй эсвэл CRM бүртгэл үүсээгүй байна.
          </p>
          <Link
            href="/check"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#1E63B5] px-6 py-3 text-sm font-bold text-white"
          >
            Шалгалт руу буцах
          </Link>
        </div>
      </div>
    )
  }

  const risk = getRiskContent(data.assessment.risk_level, data.entries)
  const privacyText =
    data.entries.privacy_notice ||
    'Таны мэдээлэл аюулгүй хадгалагдаж, зөвхөн эмнэлгийн үйлчилгээний зорилгоор ашиглагдана.'

  const promotionByServiceId = new Map(
    data.promotions.filter((promotion) => promotion.service_id).map((promotion) => [
      promotion.service_id as string,
      promotion,
    ])
  )

  const promotionByPackageId = new Map(
    data.promotions.filter((promotion) => promotion.package_id).map((promotion) => [
      promotion.package_id as string,
      promotion,
    ])
  )

  const recommendationCards: RecommendationCard[] = [
    ...data.packages
      .map((pkg) => {
        const searchText = normalizeCategoryText(
          [
            pkg.title,
            pkg.description,
            pkg.promotion_text,
            ...(pkg.package_services ?? []).map((relation) => relation.services?.name ?? ''),
          ].join(' ')
        )

        return {
          id: pkg.id,
          kind: 'package' as const,
          title: pkg.title,
          description: pkg.description,
          price: pkg.price,
          oldPrice: pkg.old_price,
          badgeText: promotionByPackageId.get(pkg.id)?.badge_text || pkg.badge_text,
          badgeColor: promotionByPackageId.get(pkg.id)?.badge_color || pkg.badge_color,
          extraLabel: promotionByPackageId.get(pkg.id)?.free_gift || null,
          score: getCategoryMatchScore(searchText, data.assessment.categories_selected),
        }
      })
      .filter((item) => item.score > 0),
    ...data.services
      .map((service) => {
        const searchText = normalizeCategoryText(
          [service.name, service.description, service.categories?.name].join(' ')
        )

        return {
          id: service.id,
          kind: 'service' as const,
          title: service.name,
          description: service.description,
          price: service.price,
          oldPrice: null,
          badgeText: promotionByServiceId.get(service.id)?.badge_text || null,
          badgeColor: promotionByServiceId.get(service.id)?.badge_color || '#1E63B5',
          extraLabel: service.categories?.name ?? null,
          durationMinutes: service.duration_minutes,
          score: getCategoryMatchScore(searchText, data.assessment.categories_selected),
        }
      })
      .filter((item) => item.score > 0),
  ]
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      if (left.kind !== right.kind) {
        return left.kind === 'package' ? -1 : 1
      }

      return left.title.localeCompare(right.title, 'mn')
    })
    .slice(0, 5)

  const sharedParams = new URLSearchParams({
    lead: data.assessment.lead_id,
    assessment: data.assessment.assessment_id,
    name: data.assessment.full_name,
    phone: data.assessment.phone,
    email: data.assessment.email ?? '',
  })

  if (data.assessment.categories_selected.length > 0) {
    sharedParams.set('categories', data.assessment.categories_selected.join('|'))
  }

  const appointmentLink = `/appointment?${sharedParams.toString()}`
  const consultationLink = `/consultation?${sharedParams.toString()}`
  const quickActionCards = (
    <>
      <section className="rounded-[2rem] bg-[#1E63B5] p-6 text-white shadow-[0_28px_80px_rgba(30,99,181,0.20)]">
        <div className="flex items-start gap-3">
          <Calendar size={24} className="mt-1 shrink-0" />
          <div>
            <h2 className="text-xl font-black">Эмчийн цаг захиалах</h2>
            <p className="mt-3 text-sm leading-6 text-blue-100">
              Эрсдэлийн үнэлгээ CRM дээр хадгалагдсан. Одоо танд тохирох үйлчилгээ, эмчээ
              сонгоод цагийн хүсэлт илгээнэ.
            </p>
          </div>
        </div>
        <Link
          href={appointmentLink}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#1E63B5] transition hover:bg-[#EAF3FF]"
        >
          Цаг захиалах
          <ChevronRight size={16} />
        </Link>
      </section>

      <section className="rounded-[2rem] border border-[#E5E7EB] bg-white p-6">
        <div className="flex items-start gap-3">
          <Phone size={24} className="mt-1 shrink-0 text-[#1E63B5]" />
          <div>
            <span className="inline-flex rounded-full bg-[#FEE9EB] px-3 py-1 text-xs font-bold text-[#F23645]">
              ҮНЭГҮЙ
            </span>
            <h2 className="mt-3 text-xl font-black text-[#1F2937]">15 минутын утасны зөвлөгөө</h2>
            <p className="mt-3 text-sm leading-6 text-[#6B7280]">
              Эмчийн урьдчилсан хариуг оффисын баг CRM дээрээс харж, сонгосон хугацаанд тан руу
              холбогдоно.
            </p>
          </div>
        </div>
        <Link
          href={consultationLink}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#B8D5FB] bg-[#EAF3FF] px-5 py-4 text-sm font-bold text-[#1E63B5] transition hover:bg-[#DCEBFF]"
        >
          Үнэгүй зөвлөгөө авах
        </Link>
      </section>
    </>
  )

  return (
    <div className="min-h-screen bg-[#F7FAFF]">
      <FlowHeader
        title="Үр дүн"
        backHref="/check"
        backLabel="Шалгалт"
        maxWidthClassName="max-w-4xl"
      />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <section
              className="rounded-[2rem] border-2 p-6"
              style={{ backgroundColor: risk.background, borderColor: risk.border }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-white p-3 shadow-sm">{risk.icon}</div>
                  <div>
                    <span
                      className="inline-flex rounded-full border bg-white px-4 py-1 text-xs font-black"
                      style={{ color: risk.accent, borderColor: risk.border }}
                    >
                      {risk.label}
                    </span>
                    <h1 className="mt-4 text-2xl font-black text-[#1F2937]">
                      {data.assessment.full_name}-ийн эрсдэлийн үнэлгээ
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-[#4B5563]">{risk.message}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                    Эрсдэлийн индекс
                  </p>
                  <p className="mt-2 text-4xl font-black" style={{ color: risk.accent }}>
                    {data.assessment.risk_score}%
                  </p>
                </div>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/80">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${data.assessment.risk_score}%`, backgroundColor: risk.accent }}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {data.assessment.categories_selected.map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1F2937]"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-[#E5E7EB] bg-white p-5">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-[#1E63B5]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    Эмчид хандах хугацаа
                  </p>
                  <p className="mt-1 text-lg font-black text-[#1F2937]">{risk.urgency}</p>
                </div>
              </div>
            </section>

            <div className="space-y-4 xl:hidden">{quickActionCards}</div>

            {recommendationCards.length > 0 ? (
              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-black text-[#1F2937]">Танд тохирох багц, үйлчилгээ</h2>
                  <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                    Сонгосон чиглэлтэй холбоотой саналуудаас хамгийн ойрыг нь нэг дор харуулж
                    байна.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {recommendationCards.map((item) => (
                    <div
                      key={`${item.kind}-${item.id}`}
                      className="rounded-[1.75rem] border border-[#D6E6FA] bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={[
                                'inline-flex rounded-full px-3 py-1 text-xs font-bold text-white',
                                item.kind === 'package' ? 'bg-[#F23645]' : 'bg-[#1E63B5]',
                              ].join(' ')}
                              style={
                                item.badgeText && item.badgeColor
                                  ? { backgroundColor: item.badgeColor }
                                  : undefined
                              }
                            >
                              {item.badgeText || (item.kind === 'package' ? 'Багц' : 'Үйлчилгээ')}
                            </span>
                            {item.kind === 'service' && item.extraLabel ? (
                              <span className="rounded-full bg-[#F7FAFF] px-3 py-1 text-[11px] font-semibold text-[#1E63B5]">
                                {item.extraLabel}
                              </span>
                            ) : null}
                          </div>
                          <h3 className="mt-4 text-xl font-black text-[#1F2937]">{item.title}</h3>
                          {item.description ? (
                            <p className="mt-3 text-sm leading-6 text-[#6B7280]">{item.description}</p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          {item.oldPrice ? (
                            <p className="text-sm text-[#9CA3AF] line-through">
                              ₮{formatCurrency(item.oldPrice)}
                            </p>
                          ) : null}
                          <p className="text-2xl font-black text-[#1E63B5]">
                            ₮{formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-3">
                        {item.kind === 'service' ? (
                          <span className="rounded-full bg-[#F7FAFF] px-3 py-1 text-sm font-semibold text-[#1E63B5]">
                            {item.durationMinutes} минут
                          </span>
                        ) : null}
                        {item.kind === 'package' && item.extraLabel ? (
                          <div className="rounded-2xl bg-[#FFF5F5] px-4 py-3 text-sm font-semibold text-[#F23645]">
                            Бэлэг: {item.extraLabel}
                          </div>
                        ) : null}
                        {item.kind === 'service' && promotionByServiceId.get(item.id)?.free_gift ? (
                          <Gift size={18} className="text-[#F23645]" />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-3xl border border-[#E5E7EB] bg-white p-5 xl:hidden">
              <div className="flex items-start gap-2 text-xs leading-5 text-[#9CA3AF]">
                <Shield size={14} className="mt-0.5 shrink-0 text-[#1E63B5]" />
                <span>{privacyText}</span>
              </div>
            </section>
          </div>

          <aside className="hidden space-y-6 xl:sticky xl:top-6 xl:block xl:self-start">
            {quickActionCards}

            <section className="rounded-3xl border border-[#E5E7EB] bg-white p-5">
              <div className="flex items-start gap-2 text-xs leading-5 text-[#9CA3AF]">
                <Shield size={14} className="mt-0.5 shrink-0 text-[#1E63B5]" />
                <span>{privacyText}</span>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}

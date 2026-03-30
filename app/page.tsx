import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  HeartPulse,
  MapPin,
  Microscope,
  Phone,
  Shield,
  Sparkles,
  Stethoscope,
} from 'lucide-react'
import Footer from '@/components/layout/Footer'
import Navbar from '@/components/layout/Navbar'
import DoctorsSection from '@/components/sections/DoctorsSection'
import { getLandingPageData } from '@/lib/public/data'

const fallbackHours = [
  {
    id: 'fallback-weekday',
    day_label: 'Даваа - Баасан',
    open_time: '08:30',
    close_time: '18:00',
    sort_order: 1,
  },
  {
    id: 'fallback-saturday',
    day_label: 'Бямба',
    open_time: '09:00',
    close_time: '15:00',
    sort_order: 2,
  },
]

function currency(value: number) {
  return new Intl.NumberFormat('mn-MN').format(value)
}

function readText(value: string | undefined, fallback: string) {
  return value?.trim() ? value : fallback
}

function shorten(value: string | null | undefined, maxLength: number) {
  if (!value) {
    return ''
  }

  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value
}

export default async function HomePage() {
  const data = await getLandingPageData()
  const cms = data.entries
  const primaryPromotion = data.promotions[0] ?? null

  const heroBadge = readText(cms.hero_badge, 'Япон стандартын эрт илрүүлэг')
  const heroTitle = readText(
    cms.hero_title,
    'Эрүүл мэндийн эрсдэлээ эрт илрүүлж, зөв эмчдээ хурдан холбогдоорой'
  )
  const heroSubtitle = readText(
    cms.hero_subtitle,
    'СУПЕРНОВА эмнэлгийн дижитал шалгалтаар зовиурын ангиллаа сонгож, эрсдэлийн түвшнээ үнэлээд цаг захиалга эсвэл 15 минутын утасны зөвлөгөөг шууд үргэлжлүүлнэ.'
  )
  const heroCta = readText(cms.hero_cta_text, 'Эрсдэлийн шалгалт эхлэх')
  const aboutTitle = readText(cms.about_title, 'Япон жишиг, Монгол хүний хэрэгцээнд ойр дижитал эмнэлэг')
  const aboutText = readText(
    cms.about_text,
    'Оношилгоо, зөвлөгөө, цаг захиалга, CRM холболт бүхий урсгалыг нэгтгэж, өвчтөнд ойлгомжтой, тайван, мэргэжлийн туршлага бий болгохоор бүтээгдсэн үйлчилгээний орчин.'
  )
  const visionTitle = readText(cms.vision_title, 'Алсын хараа')
  const visionBody = readText(
    cms.vision_body,
    'Эрт илрүүлэг, зөв оношилгоо, хүний төвтэй үйлчилгээний стандартыг өдөр тутмын эмнэлгийн ажиллагааны нэг хэсэг болгоно.'
  )
  const techTitle = readText(cms.tech_title, 'Технологи ба хяналттай урсгал')
  const techSubtitle = readText(
    cms.tech_subtitle,
    'Оношилгооны мэдээлэл, цаг захиалга, зөвлөгөөний хүсэлт, CRM тэмдэглэлийг нэг логикоор холбосон найдвартай систем.'
  )
  const techBrands = readText(
    cms.tech_brands,
    'Эмнэлгийн үйлчилгээний бүх цэгт нэг ижил мэдээлэл харагдаж, хэрэглэгчээс авсан өгөгдөл алдагдахгүй дамжина.'
  )
  const privacyText = readText(
    cms.privacy_notice,
    'Таны мэдээлэл аюулгүй хадгалагдаж, зөвхөн эмнэлгийн үйлчилгээний зорилгоор ашиглагдана.'
  )

  const phone = data.contact?.phone ?? '7000 0303'
  const email = data.contact?.email ?? 'marketing@supernova.mn'
  const address =
    data.contact?.address ??
    'БЗД 14-р хороо ХӨСҮТ-ийн замын урд ВSB-тэй байрны баруун талаар байран дундуур ороход 1 давхартаа СU-тэй 4 давхар барилга, "СУПЕРНОВА ЭМНЭЛЭГ", Ulaanbaatar, Mongolia'
  const workingHours = data.workingHours.length > 0 ? data.workingHours : fallbackHours

  const valueCards = [
    {
      title: readText(cms.value_1_title, 'Японы стандарт'),
      body: readText(
        cms.value_1_body,
        'Үйлчилгээний алхам бүр хяналттай, тайлбар нь ойлгомжтой, урсгал нь цэгцтэй байна.'
      ),
    },
    {
      title: readText(cms.value_2_title, 'Нууцлал ба аюулгүй байдал'),
      body: readText(
        cms.value_2_body,
        'Эрүүл мэндийн мэдээлэл зөвшөөрөлтэй хэрэглэгчдэд л харагдаж, бүтэцтэй хадгалагдана.'
      ),
    },
    {
      title: readText(cms.value_3_title, 'Хүний төвтэй үйлчилгээ'),
      body: readText(
        cms.value_3_body,
        'Шалгалт, зөвлөгөө, цаг захиалгыг хамгийн бага алхамтайгаар ойлгомжтой гүйцэтгэнэ.'
      ),
    },
  ]

  const processCards = [
    {
      title: '1. Зовиур сонгох',
      body: 'Зүрх, даралт, ходоод, элэг зэрэг ангиллаас өөрт хамаарах хэсгээ сонгоно.',
    },
    {
      title: '2. Асуулгад хариулах',
      body: 'Сонгосон ангилал тус бүрт динамик асуулга гарч, хариулт нь аюулгүй хадгалагдана.',
    },
    {
      title: '3. Эрсдэлээ үнэлэх',
      body: 'Low, Medium, High түвшний зөвлөмж авч, цааш цаг эсвэл зөвлөгөөг шууд үргэлжлүүлнэ.',
    },
  ]

  const trustHighlights = [
    'Мобайлд ойлгомжтой, 3 алхамт шалгалт',
    '15 минутын утасны зөвлөгөө хүсэх боломж',
    'Цаг захиалга, CRM, оношилгоо нэг урсгалд холбогдоно',
  ]

  const featuredPackages = data.packages.slice(0, 2)
  const featuredServices = data.services.slice(0, 6)
  const featuredCategories = data.serviceCategories.slice(0, 6)

  return (
    <>
      <Navbar phone={phone} />

      <main className="overflow-hidden">
        <section className="relative pb-16 pt-10 md:pb-24 md:pt-16">
          <div className="absolute inset-x-0 top-0 h-[540px] bg-[radial-gradient(circle_at_top_left,_rgba(30,99,181,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(232,50,63,0.08),_transparent_22%)]" />
          <div className="relative mx-auto max-w-6xl px-4">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#C8DCF5] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5] shadow-sm">
                  <Sparkles size={13} className="text-[#E8323F]" />
                  {heroBadge}
                </div>

                <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.04] tracking-tight text-[#10233B] md:text-6xl">
                  {heroTitle}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-[#5B6877]">
                  {heroSubtitle}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/check"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1E63B5] px-6 py-4 text-sm font-bold text-white shadow-[0_18px_40px_rgba(30,99,181,0.24)] transition hover:bg-[#154D8F]"
                  >
                    <Activity size={17} />
                    {heroCta}
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/appointment"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#BCD4F4] bg-white px-6 py-4 text-sm font-bold text-[#1E63B5] transition hover:bg-[#EAF3FF]"
                  >
                    <Calendar size={16} />
                    Шууд цаг захиалах
                  </Link>
                  <Link
                    href="/consultation"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FEE9EB] px-6 py-4 text-sm font-bold text-[#E8323F] transition hover:bg-[#FFDDE1]"
                  >
                    <Phone size={16} />
                    15 минутын зөвлөгөө
                  </Link>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {trustHighlights.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-[#E6EEF8] bg-white px-4 py-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-[#EAF3FF] p-1.5 text-[#1E63B5]">
                          <CheckCircle2 size={14} />
                        </div>
                        <p className="text-sm font-semibold leading-6 text-[#223548]">{item}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[2rem] border border-[#D6E6FA] bg-white p-6 shadow-[0_24px_80px_rgba(18,55,102,0.12)] md:p-7">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
                        Дижитал эрүүл мэндийн шалгалт
                      </p>
                      <h2 className="mt-3 text-2xl font-black leading-tight text-[#10233B]">
                        3 алхмаар эрсдлээ үнэлж, дараагийн алхмаа тодорхойлно
                      </h2>
                    </div>
                    <div className="hidden rounded-2xl bg-[#EAF3FF] p-3 text-[#1E63B5] md:block">
                      <HeartPulse size={24} />
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {processCards.map((card) => (
                      <div
                        key={card.title}
                        className="rounded-2xl border border-[#E6EEF8] bg-[#FBFDFF] px-4 py-4"
                      >
                        <p className="text-sm font-bold text-[#10233B]">{card.title}</p>
                        <p className="mt-2 text-sm leading-6 text-[#5B6877]">{card.body}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-[#EAF3FF] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
                        Хугацаа
                      </p>
                      <p className="mt-2 text-lg font-black text-[#10233B]">3-5 минут</p>
                      <p className="mt-1 text-sm text-[#587087]">Шалгалтыг мобайлаас хурдан бөглөнө.</p>
                    </div>
                    <div className="rounded-2xl bg-[#FFF5F6] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#E8323F]">
                        Зөвлөгөө
                      </p>
                      <p className="mt-2 text-lg font-black text-[#10233B]">15 минут</p>
                      <p className="mt-1 text-sm text-[#587087]">Буцаан холбогдох цагийн сонголттой.</p>
                    </div>
                    <div className="rounded-2xl border border-[#E6EEF8] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7C8B99]">
                        Нууцлал
                      </p>
                      <p className="mt-2 text-lg font-black text-[#10233B]">Хамгаалалттай</p>
                      <p className="mt-1 text-sm text-[#587087]">{shorten(privacyText, 64)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.75rem] bg-[#0F2947] p-5 text-white shadow-[0_20px_55px_rgba(15,41,71,0.18)]">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">
                      Холбоо барих
                    </p>
                    <a
                      href={`tel:${phone.replaceAll('-', '')}`}
                      className="mt-4 flex items-center gap-3 text-lg font-black"
                    >
                      <Phone size={18} className="text-[#78B3F6]" />
                      {phone}
                    </a>
                    <p className="mt-3 text-sm leading-6 text-blue-100">{address}</p>
                  </div>

                  <div className="rounded-[1.75rem] border border-[#E6EEF8] bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
                      {primaryPromotion ? 'Идэвхтэй санал' : 'Ажлын цаг'}
                    </p>
                    {primaryPromotion ? (
                      <>
                        <p className="mt-4 text-lg font-black text-[#10233B]">
                          {primaryPromotion.title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#5B6877]">
                          {primaryPromotion.description || 'Result болон booking урсгалд автоматаар харагдана.'}
                        </p>
                        <div className="mt-4 inline-flex rounded-full bg-[#FEE9EB] px-3 py-1 text-xs font-bold text-[#E8323F]">
                          {primaryPromotion.badge_text}
                        </div>
                      </>
                    ) : (
                      <div className="mt-4 space-y-2">
                        {workingHours.slice(0, 2).map((item) => (
                          <div key={item.id} className="flex items-center gap-2 text-sm text-[#5B6877]">
                            <Clock3 size={15} className="text-[#1E63B5]" />
                            <span>
                              {item.day_label}: {item.open_time} - {item.close_time}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-[#D6E6FA] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
                  <Stethoscope size={13} />
                  Эмнэлгийн тухай
                </p>
                <h2 className="mt-5 max-w-2xl text-3xl font-black leading-tight tracking-tight text-[#10233B] md:text-4xl">
                  {aboutTitle}
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-8 text-[#5B6877] md:text-base">
                  {aboutText}
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#E6EEF8] bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E63B5]">
                      Шалгалт
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#5B6877]">
                      Зовиурт тулгуурласан асуулга, эрсдэлийн оноо, тайлбар.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#E6EEF8] bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E63B5]">
                      Цаг захиалга
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#5B6877]">
                      Үйлчилгээ, эмч, өдөр, цагийн сонголтыг нэг дэлгэцэнд хийнэ.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#E6EEF8] bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E63B5]">
                      CRM
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#5B6877]">
                      Лид, зөвлөгөө, тэмдэглэл, статусын мэдээлэл нэг дор дамжина.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] bg-[linear-gradient(160deg,#0F2947_0%,#123B67_100%)] p-7 text-white shadow-[0_28px_80px_rgba(15,41,71,0.22)] md:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">
                  {visionTitle}
                </p>
                <p className="mt-4 text-xl font-black leading-tight md:text-2xl">
                  {visionBody}
                </p>

                <div className="mt-8 space-y-3">
                  {valueCards.map((value) => (
                    <div
                      key={value.title}
                      className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4"
                    >
                      <p className="text-sm font-bold">{value.title}</p>
                      <p className="mt-2 text-sm leading-6 text-blue-100">{value.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <DoctorsSection doctors={data.doctors} />

        <section id="services" className="bg-[#F7FAFF] py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="inline-flex items-center gap-2 rounded-full border border-[#D6E6FA] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
                  <Microscope size={13} />
                  Үйлчилгээ ба багц
                </p>
                <h2 className="mt-5 text-3xl font-black tracking-tight text-[#10233B] md:text-4xl">
                  Таны эрсдэлийн үр дүнтэй холбоотой үйлчилгээний санал
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#5B6877] md:text-base">
                  Landing, result, booking урсгалд харагдах бүх үйлчилгээ, багц, урамшуулал нь
                  админ самбараас удирдагдана.
                </p>
              </div>
              <Link
                href="/appointment"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#1E63B5]"
              >
                Бүх үйлчилгээний дагуу цаг захиалах
                <ArrowRight size={16} />
              </Link>
            </div>

            {featuredCategories.length > 0 ? (
              <div className="mt-8 flex flex-wrap gap-2">
                {featuredCategories.map((category) => (
                  <span
                    key={category.id}
                    className="rounded-full border border-[#D8E6F6] bg-white px-4 py-2 text-sm font-semibold text-[#35506C]"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            ) : null}

            {featuredPackages.length > 0 ? (
              <div className="mt-8 grid gap-4 lg:grid-cols-2">
                {featuredPackages.map((pkg) => (
                  <article
                    key={pkg.id}
                    className="rounded-[2rem] border border-[#D6E6FA] bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        {pkg.badge_text ? (
                          <span
                            className="inline-flex rounded-full px-3 py-1 text-xs font-bold text-white"
                            style={{ backgroundColor: pkg.badge_color }}
                          >
                            {pkg.badge_text}
                          </span>
                        ) : null}
                        <h3 className="mt-4 text-2xl font-black text-[#10233B]">{pkg.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-[#5B6877]">
                          {pkg.description || 'Олон үйлчилгээ багцалсан урьдчилан сэргийлэх шийдэл.'}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#F7FAFF] px-4 py-3 text-left md:text-right">
                        {pkg.old_price ? (
                          <p className="text-sm text-[#8B98A5] line-through">
                            ₮{currency(pkg.old_price)}
                          </p>
                        ) : null}
                        <p className="text-2xl font-black text-[#1E63B5]">₮{currency(pkg.price)}</p>
                      </div>
                    </div>

                    {pkg.package_services?.length ? (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {pkg.package_services.map((item) => (
                          <span
                            key={`${pkg.id}-${item.service_id}`}
                            className="rounded-full bg-[#EAF3FF] px-3 py-1 text-xs font-semibold text-[#1E63B5]"
                          >
                            {item.services?.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}

            {featuredServices.length > 0 ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {featuredServices.map((service) => (
                  <article
                    key={service.id}
                    className="rounded-[1.75rem] border border-[#E4EDF8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {service.categories?.name ? (
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8191A1]">
                            {service.categories.name}
                          </p>
                        ) : null}
                        <h3 className="mt-2 text-xl font-black text-[#10233B]">{service.name}</h3>
                      </div>
                      {service.promotion_flag ? (
                        <span className="rounded-full bg-[#FEE9EB] px-3 py-1 text-xs font-bold text-[#E8323F]">
                          Promo
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 text-sm leading-7 text-[#5B6877]">
                      {service.description || 'Шинжилгээний тайлбар админ дээрээс шинэчлэгдэнэ.'}
                    </p>

                    <div className="mt-5 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8B98A5]">
                          Үнэ
                        </p>
                        <p className="mt-1 text-2xl font-black text-[#1E63B5]">
                          ₮{currency(service.price)}
                        </p>
                      </div>
                      <Link
                        href="/appointment"
                        className="inline-flex items-center gap-2 rounded-2xl border border-[#BCD4F4] px-4 py-3 text-sm font-bold text-[#1E63B5] transition hover:bg-[#EAF3FF]"
                      >
                        Цаг захиалах
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-[2rem] border border-dashed border-[#C9DCF4] bg-white p-8 text-center shadow-sm">
                <h3 className="text-2xl font-black text-[#10233B]">
                  Үйлчилгээний мэдээлэл шинэчлэгдэж байна
                </h3>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#5B6877]">
                  Админ дээрээс үйлчилгээ, багц, урамшууллын өгөгдөл нэмэгдэх үед энэ хэсэг
                  автоматаар дүүрнэ. Одоогоор та эрсдэлийн шалгалтаа эхлүүлж болно.
                </p>
                <Link
                  href="/check"
                  className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#1E63B5] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#154D8F]"
                >
                  Шалгалт эхлүүлэх
                </Link>
              </div>
            )}
          </div>
        </section>

        <section id="technology" className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="rounded-[2rem] bg-[linear-gradient(160deg,#0F2947_0%,#123B67_100%)] px-6 py-8 text-white shadow-[0_28px_80px_rgba(15,41,71,0.22)] md:px-8 md:py-10">
              <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">
                    {techTitle}
                  </p>
                  <h2 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                    {techSubtitle}
                  </h2>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-blue-100">{techBrands}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                    <p className="text-sm font-bold">Нэгтгэсэн өгөгдөл</p>
                    <p className="mt-2 text-sm leading-6 text-blue-100">
                      Асуулга, хариулт, цаг, зөвлөгөөний хүсэлт CRM рүү нэг мөр дамжина.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                    <p className="text-sm font-bold">Рольд суурилсан хандалт</p>
                    <p className="mt-2 text-sm leading-6 text-blue-100">
                      Super admin, эмч, оффисын ажилтан тус бүр зөвхөн өөрийн мэдээлэлд нэвтэрнэ.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                    <p className="text-sm font-bold">Найдвартай UX</p>
                    <p className="mt-2 text-sm leading-6 text-blue-100">
                      Мобайлд том touch target, ойлгомжтой CTA, богино бөглөх урсгалтай.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 md:pb-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="rounded-[2rem] bg-[linear-gradient(135deg,#E8323F_0%,#C82638_100%)] px-6 py-8 text-white shadow-[0_24px_70px_rgba(232,50,63,0.24)] md:px-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100">
                    {primaryPromotion ? 'Идэвхтэй санал' : 'Дараагийн алхам'}
                  </p>
                  <h2 className="mt-4 text-3xl font-black tracking-tight">
                    {primaryPromotion
                      ? primaryPromotion.title
                      : 'Өнөөдөр эрсдлээ үнэлээд, хэрэгтэй бол эмчийн цаг эсвэл үнэгүй зөвлөгөөг үргэлжлүүлээрэй'}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-red-50">
                    {primaryPromotion?.description ||
                      'High эрсдэл гарвал шууд эмчийн цаг захиалах, Medium эсвэл Low түвшинд зөвлөгөө авах урсгал руу шилжинэ.'}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/check"
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-bold text-[#E8323F] transition hover:bg-[#FFF5F6]"
                  >
                    Шалгалт эхлэх
                  </Link>
                  <Link
                    href="/appointment"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-4 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    Цаг захиалах
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-24 md:pb-28">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[2rem] border border-[#DCE9F8] bg-white p-6 shadow-sm md:p-8">
                <p className="inline-flex items-center gap-2 rounded-full bg-[#EAF3FF] px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
                  <MapPin size={13} />
                  Холбоо барих
                </p>
                <h2 className="mt-5 text-3xl font-black tracking-tight text-[#10233B]">
                  Хэрэглэгчийн шийдвэрийг богино алхмаар дэмжинэ
                </h2>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <a
                    href={`tel:${phone.replaceAll('-', '')}`}
                    className="rounded-2xl border border-[#E6EEF8] bg-[#FBFDFF] p-4 transition hover:border-[#BCD4F4]"
                  >
                    <Phone size={18} className="text-[#1E63B5]" />
                    <p className="mt-3 text-sm font-bold text-[#10233B]">Утас</p>
                    <p className="mt-1 text-sm text-[#5B6877]">{phone}</p>
                  </a>
                  <a
                    href={`mailto:${email}`}
                    className="rounded-2xl border border-[#E6EEF8] bg-[#FBFDFF] p-4 transition hover:border-[#BCD4F4]"
                  >
                    <Calendar size={18} className="text-[#1E63B5]" />
                    <p className="mt-3 text-sm font-bold text-[#10233B]">И-мэйл</p>
                    <p className="mt-1 text-sm text-[#5B6877]">{email}</p>
                  </a>
                  <div className="rounded-2xl border border-[#E6EEF8] bg-[#FBFDFF] p-4">
                    <MapPin size={18} className="text-[#1E63B5]" />
                    <p className="mt-3 text-sm font-bold text-[#10233B]">Хаяг</p>
                    <p className="mt-1 text-sm text-[#5B6877]">{shorten(address, 72)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[#DCE9F8] bg-white p-6 shadow-sm md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="inline-flex items-center gap-2 rounded-full bg-[#F7FAFF] px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
                      <Shield size={13} />
                      Итгэл ба нууцлал
                    </p>
                    <h3 className="mt-5 text-2xl font-black tracking-tight text-[#10233B]">
                      Мэдээлэл хамгаалалттай, урсгал тодорхой
                    </h3>
                  </div>
                  <Link href="/login" className="text-sm font-bold text-[#1E63B5]">
                    Нэвтрэх
                  </Link>
                </div>

                <p className="mt-4 text-sm leading-7 text-[#5B6877]">{privacyText}</p>

                <div className="mt-6 space-y-3">
                  {workingHours.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl border border-[#E6EEF8] bg-[#FBFDFF] px-4 py-3 text-sm text-[#35506C]"
                    >
                      <Clock3 size={16} className="text-[#1E63B5]" />
                      <span>
                        {item.day_label}: {item.open_time} - {item.close_time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-4 bottom-4 z-40 md:hidden">
        <div className="rounded-2xl border border-[#D8E6F6] bg-white/95 p-3 shadow-[0_18px_50px_rgba(17,37,68,0.18)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1E63B5]">
                Эрсдэлийн шалгалт
              </p>
              <p className="mt-1 text-xs leading-5 text-[#5B6877]">
                3-5 минутанд урьдчилсан зөвлөмж аваарай
              </p>
            </div>
            <Link
              href="/check"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#1E63B5] px-4 py-3 text-sm font-bold text-white"
            >
              Эхлэх
            </Link>
          </div>
        </div>
      </div>

      <Footer
        contact={data.contact}
        socials={data.socials}
        workingHours={data.workingHours}
        privacyText={privacyText}
      />
    </>
  )
}

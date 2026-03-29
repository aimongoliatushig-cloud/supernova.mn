import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  Microscope,
  Phone,
  Shield,
  Sparkles,
  Stethoscope,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import DoctorsSection from '@/components/sections/DoctorsSection'
import { getLandingPageData } from '@/lib/public/data'

function currency(value: number) {
  return new Intl.NumberFormat('mn-MN').format(value)
}

export default async function HomePage() {
  const data = await getLandingPageData()
  const cms = data.entries
  const primaryPromotion = data.promotions[0] ?? null
  const privacyText = cms.privacy_notice || 'Таны мэдээлэл аюулгүй хадгалагдаж, зөвхөн эмнэлгийн үйлчилгээний зорилгоор ашиглагдана.'

  const valueCards = [
    {
      title: cms.value_1_title,
      body: cms.value_1_body,
      icon: <Award size={18} />,
    },
    {
      title: cms.value_2_title,
      body: cms.value_2_body,
      icon: <Shield size={18} />,
    },
    {
      title: cms.value_3_title,
      body: cms.value_3_body,
      icon: <Sparkles size={18} />,
    },
  ].filter((item) => item.title || item.body)

  return (
    <>
      <Navbar phone={data.contact?.phone} />
      <main className="bg-white">
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(30,99,181,0.12),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(242,54,69,0.08),_transparent_28%)] pb-20 pt-14 md:pb-28 md:pt-20">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B8D5FB] to-transparent" />
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
              <div>
                {cms.hero_badge ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#B8D5FB] bg-white px-4 py-2 text-xs font-bold text-[#1E63B5] shadow-sm">
                    <Sparkles size={12} className="text-[#F23645]" />
                    {cms.hero_badge}
                  </div>
                ) : null}

                <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-[#1F2937] md:text-6xl">
                  {cms.hero_title}
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-[#6B7280] md:text-lg">
                  {cms.hero_subtitle}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/check"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1E63B5] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-[#1E63B5]/20 transition hover:bg-[#154D8F]"
                  >
                    <Activity size={17} />
                    {cms.hero_cta_text || 'Шинжилгээ эхлэх'}
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/appointment"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#B8D5FB] bg-white px-7 py-4 text-sm font-bold text-[#1E63B5] transition hover:bg-[#EAF3FF]"
                  >
                    <Calendar size={16} />
                    Цаг захиалах
                  </Link>
                  {data.contact?.phone ? (
                    <a
                      href={`tel:${data.contact.phone.replaceAll('-', '')}`}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-4 text-sm font-semibold text-[#6B7280] transition hover:text-[#1E63B5]"
                    >
                      <Phone size={16} />
                      {data.contact.phone}
                    </a>
                  ) : null}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  {[
                    `${data.doctors.length}+ эмч`,
                    `${data.services.length}+ үйлчилгээ`,
                    `${data.packages.length}+ багц`,
                    primaryPromotion?.badge_text,
                  ]
                    .filter(Boolean)
                    .map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#4B5563] shadow-sm"
                      >
                        <CheckCircle2 size={14} className="text-[#16A34A]" />
                        {item}
                      </span>
                    ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-[#D6E6FA] bg-white p-6 shadow-[0_24px_80px_rgba(30,99,181,0.12)]">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-[#EAF3FF] p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#1E63B5]">
                      Эмчийн баг
                    </p>
                    <p className="mt-3 text-3xl font-black text-[#1F2937]">
                      {data.doctors.length}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                      Landing дээр харуулах идэвхтэй эмчийн профайлууд.
                    </p>
                  </div>
                  <div className="rounded-3xl bg-[#FFF5F5] p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#F23645]">
                      Идэвхтэй урамшуулал
                    </p>
                    <p className="mt-3 text-3xl font-black text-[#1F2937]">
                      {data.promotions.length}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                      Result болон landing хуудсанд харагдах санал.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-[#E5E7EB] p-5 sm:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#9CA3AF]">
                      Нууцлал
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[#4B5563]">{privacyText}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-[#EAF3FF] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#1E63B5]">
                <Stethoscope size={12} />
                Эмнэлгийн тухай
              </p>
              <h2 className="mt-5 text-3xl font-black leading-tight text-[#1F2937] md:text-4xl">
                {cms.about_title}
              </h2>
              <p className="mt-5 text-sm leading-7 text-[#4B5563] md:text-base">
                {cms.about_text}
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#0F2947] p-8 text-white shadow-[0_28px_80px_rgba(15,41,71,0.24)]">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-200">
                {cms.vision_title || 'Алсын хараа'}
              </p>
              <p className="mt-4 text-lg font-black leading-tight">
                {cms.about_vision || cms.vision_body}
              </p>

              {valueCards.length > 0 ? (
                <div className="mt-8 space-y-3">
                  {valueCards.map((value) => (
                    <div
                      key={value.title}
                      className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-white">{value.icon}</div>
                        <div>
                          <p className="text-sm font-bold">{value.title}</p>
                          <p className="mt-1 text-xs leading-5 text-blue-100">{value.body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <DoctorsSection doctors={data.doctors} />

        <section id="services" className="bg-[#F7FAFF] py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#1E63B5]">
                <Microscope size={12} />
                Үйлчилгээ ба багц
              </p>
              <h2 className="mt-5 text-3xl font-black text-[#1F2937] md:text-4xl">
                Админ дээрээс удирддаг үйлчилгээний сан
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#4B5563]">
                Landing, result, booking урсгалд харагдах бүх үйлчилгээ, багц, урамшуулал
                доорх админ өгөгдлөөс уншигдана.
              </p>
            </div>

            {data.packages.length > 0 ? (
              <div className="mt-10 grid gap-4 lg:grid-cols-2">
                {data.packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="rounded-[1.75rem] border border-[#D6E6FA] bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {pkg.badge_text ? (
                          <span
                            className="inline-flex rounded-full px-3 py-1 text-xs font-bold text-white"
                            style={{ backgroundColor: pkg.badge_color }}
                          >
                            {pkg.badge_text}
                          </span>
                        ) : null}
                        <h3 className="mt-4 text-xl font-black text-[#1F2937]">{pkg.title}</h3>
                        {pkg.description ? (
                          <p className="mt-3 text-sm leading-6 text-[#6B7280]">{pkg.description}</p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        {pkg.old_price ? (
                          <p className="text-sm text-[#9CA3AF] line-through">
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
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-[1.75rem] border border-[#E5E7EB] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {service.categories?.name ? (
                        <p className="text-xs font-bold uppercase tracking-wide text-[#9CA3AF]">
                          {service.categories.name}
                        </p>
                      ) : null}
                      <h3 className="mt-2 text-lg font-black text-[#1F2937]">{service.name}</h3>
                    </div>
                    {service.promotion_flag ? (
                      <span className="rounded-full bg-[#FEE9EB] px-3 py-1 text-xs font-bold text-[#F23645]">
                        Promo
                      </span>
                    ) : null}
                  </div>
                  {service.description ? (
                    <p className="mt-3 text-sm leading-6 text-[#6B7280]">{service.description}</p>
                  ) : null}
                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-[#9CA3AF]">Үнэ</p>
                      <p className="text-xl font-black text-[#1E63B5]">
                        ₮{currency(service.price)}
                      </p>
                    </div>
                    <Link
                      href="/appointment"
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#B8D5FB] px-4 py-3 text-sm font-bold text-[#1E63B5] transition hover:bg-[#EAF3FF]"
                    >
                      Цаг захиалах
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="technology" className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="rounded-[2rem] bg-[#0F2947] px-6 py-10 text-white md:px-10">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-200">
                {cms.tech_title || 'Технологи'}
              </p>
              <h2 className="mt-4 text-3xl font-black md:text-4xl">{cms.tech_subtitle}</h2>
              {cms.tech_brands ? (
                <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100">{cms.tech_brands}</p>
              ) : null}

              {data.serviceCategories.length > 0 ? (
                <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {data.serviceCategories.slice(0, 8).map((category) => (
                    <div
                      key={category.id}
                      className="rounded-2xl border border-white/10 bg-white/10 p-4"
                    >
                      <p className="text-2xl">{category.icon}</p>
                      <p className="mt-3 text-sm font-bold">{category.name}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {primaryPromotion ? (
          <section className="pb-16 md:pb-24">
            <div className="mx-auto max-w-6xl px-4">
              <div className="rounded-[2rem] bg-gradient-to-r from-[#F23645] to-[#C6283E] px-6 py-8 text-white shadow-[0_28px_80px_rgba(242,54,69,0.22)] md:px-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                      {primaryPromotion.badge_text}
                    </span>
                    <h2 className="mt-4 text-2xl font-black md:text-3xl">{primaryPromotion.title}</h2>
                    {primaryPromotion.description ? (
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-red-100">
                        {primaryPromotion.description}
                      </p>
                    ) : null}
                  </div>
                  <Link
                    href="/check"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-bold text-[#F23645] transition hover:bg-[#FFF1F2]"
                  >
                    Шалгалт эхлэх
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <Footer
        contact={data.contact}
        socials={data.socials}
        workingHours={data.workingHours}
        privacyText={privacyText}
      />
    </>
  )
}

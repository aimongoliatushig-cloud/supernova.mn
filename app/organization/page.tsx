import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Mail,
  Phone,
  Shield,
  Users,
} from 'lucide-react'
import Footer from '@/components/layout/Footer'
import Navbar from '@/components/layout/Navbar'
import OrganizationQuoteCalculator from '@/components/public/OrganizationQuoteCalculator'
import { getLandingPageData } from '@/lib/public/data'
import { organizationPackages } from '@/lib/public/organization'

export const metadata: Metadata = {
  title: 'Байгууллагын багц | СУПЕРНОВА',
  description:
    'Байгууллагын ажилтны тоо болон компанийн чиглэлд тохирсон шинжилгээний багц, урьдчилсан үнийн тооцоолол.',
}

function currency(value: number) {
  return new Intl.NumberFormat('mn-MN').format(value)
}

export default async function OrganizationPage() {
  const data = await getLandingPageData()
  const phone = data.contact?.phone ?? '7000 0303'
  const email = data.contact?.email ?? 'marketing@supernova.mn'
  const privacyText =
    data.entries.privacy_notice ||
    'Таны мэдээлэл аюулгүй хадгалагдаж, зөвхөн эмнэлгийн үйлчилгээний зорилгоор ашиглагдана.'
  const additionalPackages = data.packages.slice(0, 3)

  return (
    <>
      <Navbar phone={phone} />

      <main className="overflow-hidden">
        <section className="relative pb-16 pt-6 md:pb-24 md:pt-8">
          <div className="absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(circle_at_top_left,_rgba(30,99,181,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(232,50,63,0.08),_transparent_22%)]" />
          <div className="relative mx-auto max-w-6xl px-4">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#C8DCF5] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5] shadow-sm">
                  <Building2 size={14} className="text-[#E8323F]" />
                  Байгууллагын эрүүл мэндийн шийдэл
                </div>

                <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.04] tracking-tight text-[#10233B] md:text-6xl">
                  Ажилтны тоо болон компанийн чиглэлд таарсан шинжилгээний багц
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-[#5B6877]">
                  Оффис, үйлдвэрлэл, барилга, үйлчилгээ гээд байгууллагын онцлог бүрт тохируулсан
                  урьдчилан сэргийлэх багц, on-site зохион байгуулалт, дижитал тайланг нэг дороос
                  санал болгоно.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#calculator"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1E63B5] px-6 py-4 text-sm font-bold text-white shadow-[0_18px_40px_rgba(30,99,181,0.24)] transition hover:bg-[#154D8F]"
                  >
                    Үнийн тооцоо гаргах
                    <ArrowRight size={16} />
                  </a>
                  <a
                    href="#packages"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#BCD4F4] bg-white px-6 py-4 text-sm font-bold text-[#1E63B5] transition hover:bg-[#EAF3FF]"
                  >
                    Байгууллагын багцууд
                  </a>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#E6EEF8] bg-white px-4 py-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-[#EAF3FF] p-1.5 text-[#1E63B5]">
                        <Users size={14} />
                      </div>
                      <p className="text-sm font-semibold leading-6 text-[#223548]">
                        15+ ажилтантай багт зориулсан уян санал
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#E6EEF8] bg-white px-4 py-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-[#EAF3FF] p-1.5 text-[#1E63B5]">
                        <CheckCircle2 size={14} />
                      </div>
                      <p className="text-sm font-semibold leading-6 text-[#223548]">
                        On-site урсгал, дижитал тайлан, менежментийн дүгнэлт
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#E6EEF8] bg-white px-4 py-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-[#EAF3FF] p-1.5 text-[#1E63B5]">
                        <Shield size={14} />
                      </div>
                      <p className="text-sm font-semibold leading-6 text-[#223548]">
                        Байгууллагын мэдээллийг ангилсан, аюулгүй тайлагнана
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[#D6E6FA] bg-white p-6 shadow-[0_24px_80px_rgba(18,55,102,0.12)] md:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
                  Байгууллагын onboarding
                </p>
                <h2 className="mt-3 text-2xl font-black leading-tight text-[#10233B]">
                  3 алхмаар багц сонгож, урьдчилсан төсөв, зохион байгуулалтын санал авна
                </h2>

                <div className="mt-6 space-y-3">
                  {[
                    '1. Хүний тоо болон компанийн чиглэлээ оруулна.',
                    '2. Тохирох багц, нэг ажилтны үнэ, нийт төсөв автоматаар гарна.',
                    '3. Холбоо барих сувгаар эцсийн багц, хуваарь, тайлангийн формат баталгаажуулна.',
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-[#E6EEF8] bg-[#FBFDFF] px-4 py-4 text-sm font-semibold leading-6 text-[#223548]"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <a
                    href={`tel:${phone.replaceAll('-', '')}`}
                    className="rounded-[1.5rem] bg-[#0F2947] px-5 py-4 text-white transition hover:bg-[#0C223A]"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                      Холбоо барих
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-lg font-black">
                      <Phone size={17} />
                      {phone}
                    </p>
                  </a>
                  <a
                    href={`mailto:${email}`}
                    className="rounded-[1.5rem] border border-[#D6E6FA] bg-[#F8FBFF] px-5 py-4 text-[#10233B] transition hover:border-[#1E63B5]"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E63B5]">
                      И-мэйл
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-lg font-black">
                      <Mail size={17} />
                      {email}
                    </p>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="packages" className="bg-[#FBFDFF] py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
                Байгууллагын багцууд
              </p>
              <h2 className="mt-4 text-3xl font-black text-[#10233B] md:text-4xl">
                Багийн хэмжээ, эрсдэл, урсгалд тааруулсан 3 түвшний санал
              </h2>
              <p className="mt-4 text-base leading-8 text-[#5B6877]">
                Дараах багцууд нь урьдчилсан бүтэц бөгөөд компанийн чиглэл, ажилтны тоо,
                ажлын байрны эрсдэлээс хамааран нарийвчилж тохируулна.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {organizationPackages.map((pkg, index) => (
                <article
                  key={pkg.id}
                  className={[
                    'rounded-[2rem] border p-6 shadow-sm',
                    index === 1
                      ? 'border-[#B7D4F6] bg-[#F8FBFF]'
                      : 'border-[#D6E6FA] bg-white',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-[#EAF3FF] px-3 py-1 text-xs font-bold text-[#1E63B5]">
                      {pkg.headcountLabel}
                    </span>
                    <span className="text-sm font-bold text-[#E8323F]">{pkg.priceLabel}</span>
                  </div>
                  <h3 className="mt-5 text-2xl font-black text-[#10233B]">{pkg.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#5B6877]">{pkg.description}</p>
                  <p className="mt-4 text-sm font-semibold text-[#223548]">Илүү тохирох байгууллага:</p>
                  <p className="mt-1 text-sm leading-6 text-[#5B6877]">{pkg.bestFor}</p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {pkg.highlights.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#35506C] ring-1 ring-[#D6E6FA]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <OrganizationQuoteCalculator />

        {additionalPackages.length > 0 ? (
          <section className="bg-[#FBFDFF] py-16 md:py-24">
            <div className="mx-auto max-w-6xl px-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
                    Нэмэлтээр хослуулж болох багцууд
                  </p>
                  <h2 className="mt-4 text-3xl font-black text-[#10233B] md:text-4xl">
                    Байгууллагын саналдаа эмнэлгийн бэлэн багцуудыг давхар холбож болно
                  </h2>
                </div>
                <Link
                  href="/appointment"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#1E63B5]"
                >
                  Шууд цаг захиалах
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-3">
                {additionalPackages.map((pkg) => (
                  <article
                    key={pkg.id}
                    className="rounded-[2rem] border border-[#D6E6FA] bg-white p-6 shadow-sm"
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
                        <h3 className="mt-4 text-2xl font-black text-[#10233B]">{pkg.title}</h3>
                      </div>
                      <div className="rounded-2xl bg-[#F7FAFF] px-4 py-3 text-right">
                        {pkg.old_price ? (
                          <p className="text-sm text-[#8B98A5] line-through">₮{currency(pkg.old_price)}</p>
                        ) : null}
                        <p className="text-2xl font-black text-[#1E63B5]">₮{currency(pkg.price)}</p>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-7 text-[#5B6877]">
                      {pkg.description ||
                        'Оношилгооны бэлэн багцыг байгууллагын урсгалтай хослуулах боломжтой.'}
                    </p>

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

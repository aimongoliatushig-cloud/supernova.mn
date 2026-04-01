import type { Metadata } from 'next'
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

export const metadata: Metadata = {
  title: 'Байгууллагын багц | СУПЕРНОВА',
  description:
    'Байгууллагын ажилтны тоо болон компанийн чиглэлд тохирсон шинжилгээний багц, урьдчилсан үнийн тооцоолол.',
}

export default async function OrganizationPage() {
  const data = await getLandingPageData()
  const phone = data.contact?.phone ?? '7000 0303'
  const email = data.contact?.email ?? 'marketing@supernova.mn'
  const privacyText =
    data.entries.privacy_notice ||
    'Таны мэдээлэл аюулгүй хадгалагдаж, зөвхөн эмнэлгийн үйлчилгээний зорилгоор ашиглагдана.'

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
                  Оффис, үйлдвэрлэл, барилга, үйлчилгээ гээд байгууллагын онцлог бүрт
                  тохируулсан урьдчилан сэргийлэх багц, on-site зохион байгуулалт, дижитал
                  тайланг нэг дороос санал болгоно.
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

        <OrganizationQuoteCalculator />
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

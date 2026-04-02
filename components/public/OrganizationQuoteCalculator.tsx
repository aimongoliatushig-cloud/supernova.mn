'use client'

import { useState, useTransition } from 'react'
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  Sparkles,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { submitOrganizationQuoteRequest } from '@/app/actions/public'
import Button from '@/components/ui/Button'
import { organizationPackages } from '@/lib/public/organization'

const benefitCards: Array<{
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
}> = [
  {
    icon: Sparkles,
    eyebrow: 'Урамшуулалтай санал',
    title: 'Компанидаа тохирсон үнийн санал авна',
    description:
      'Танай компанийн салбар, ажилтны тоо, хэрэгцээнд таарсан багц, нөхцөлийг манай баг санал болгоно.',
  },
  {
    icon: Clock3,
    eyebrow: 'Шуурхай хариу',
    title: '24 цагийн дотор эргэн холбогдоно',
    description:
      'Формоо илгээсний дараа манай баг ажлын 24 цагийн дотор хамгийн тохиромжтой үнийн саналыг танилцуулна.',
  },
  {
    icon: Building2,
    eyebrow: 'Дараагийн шат',
    title: 'Хөтөлбөр, зохион байгуулалтыг баталгаажуулна',
    description:
      'Санал таарвал on-site үзлэг, эмчийн тайлбар, тайлангийн форматыг хамт төлөвлөнө.',
  },
]

const industryOptions = [
  'Мэдээллийн технологи',
  'Санхүү, даатгал',
  'Уул уурхай, эрчим хүч',
  'Үйлдвэрлэл',
  'Худалдаа, үйлчилгээ',
  'Барилга, үл хөдлөх',
  'Боловсрол',
  'Эрүүл мэнд',
  'Ложистик, тээвэр',
  'Бусад',
]

const nextSteps = [
  'Манай баг хүсэлтийг хүлээж аваад ажлын 24 цагийн дотор танай багтай холбогдоно.',
  'Компанийн салбар, ажилтны тоонд тохирсон урамшуулалтай үнийн саналыг боловсруулж илгээнэ.',
  'Санал таарвал үзлэгийн зохион байгуулалт, тайлан, дараагийн алхмуудыг хамт баталгаажуулна.',
]

type SubmittedRequest = {
  organizationName: string
  industry: string
  contactName: string
  phone: string
  email: string
  employeeCount: number
}

function scrollToConsultationForm() {
  document.getElementById('organization-consultation-form')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

export default function OrganizationConsultationSection() {
  const [organizationName, setOrganizationName] = useState('')
  const [organizationIndustry, setOrganizationIndustry] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [employeeCount, setEmployeeCount] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submittedRequest, setSubmittedRequest] = useState<SubmittedRequest | null>(null)
  const [pending, startTransition] = useTransition()

  function resetMessages() {
    if (error) {
      setError('')
    }

    if (successMessage) {
      setSuccessMessage('')
    }

    if (submittedRequest) {
      setSubmittedRequest(null)
    }
  }

  function handleSubmit() {
    const normalizedOrganizationName = organizationName.trim()
    const normalizedIndustry = organizationIndustry.trim()
    const normalizedContactName = contactName.trim()
    const normalizedPhone = phone.trim()
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedEmployeeCount = Number.parseInt(employeeCount, 10)

    if (
      !normalizedOrganizationName ||
      !normalizedIndustry ||
      !normalizedContactName ||
      !normalizedPhone ||
      !normalizedEmail ||
      !employeeCount.trim()
    ) {
      setError('Компанийн нэр, салбар, ажилтны тоо, холбоо барих мэдээллээ бүрэн оруулна уу.')
      return
    }

    if (normalizedPhone.replace(/\D/g, '').length < 8) {
      setError('Утасны дугаараа зөв оруулна уу.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Имэйл хаягаа зөв оруулна уу.')
      return
    }

    if (!Number.isFinite(normalizedEmployeeCount) || normalizedEmployeeCount < 1) {
      setError('Ажилтны тоог зөв оруулна уу.')
      return
    }

    setError('')
    setSuccessMessage('')

    startTransition(async () => {
      const result = await submitOrganizationQuoteRequest({
        organization_name: normalizedOrganizationName,
        organization_industry: normalizedIndustry,
        contact_name: normalizedContactName,
        phone: normalizedPhone,
        email: normalizedEmail,
        employee_count: normalizedEmployeeCount,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      setSubmittedRequest({
        organizationName: normalizedOrganizationName,
        industry: normalizedIndustry,
        contactName: normalizedContactName,
        phone: normalizedPhone,
        email: normalizedEmail,
        employeeCount: normalizedEmployeeCount,
      })
      setSuccessMessage(
        'Хүсэлтийг хүлээн авлаа. Манай баг ажлын 24 цагийн дотор танай компанид тохирсон хамгийн сайн үнийн саналыг хүргэнэ.'
      )
    })
  }

  return (
    <section className="bg-[#FBFDFF] pb-20 pt-16 md:pb-28 md:pt-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D6E6FA] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1E63B5] shadow-sm">
            <Building2 size={14} />
            Байгууллагын үнийн санал
          </span>

          <h1 className="mt-6 text-4xl font-black leading-[0.98] text-[#10233B] md:text-6xl">
            Компанидаа тохирсон урамшуулалтай үнийн санал аваарай
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#5B6877]">
            Танай компанийн салбар, ажилтны тоо, хэрэгцээнд тохирсон үйлчилгээний багц,
            урамшуулалтай үнийн саналыг эндээс хүсээрэй. Формоо илгээсний дараа манай баг
            ажлын 24 цагийн дотор хамгийн тохиромжтой саналаар эргэн холбогдоно.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button type="button" size="lg" onClick={scrollToConsultationForm}>
              Үнийн санал хүсэх
              <ArrowRight size={16} />
            </Button>
            <div className="inline-flex items-center rounded-2xl border border-[#D6E6FA] bg-white px-5 py-4 text-sm font-semibold text-[#35506C]">
              24 цагийн дотор хамгийн сайн санал хүргэнэ
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {benefitCards.map((item) => {
            const Icon = item.icon

            return (
              <div
                key={item.title}
                className="rounded-[1.75rem] border border-[#D6E6FA] bg-white p-5 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF3FF] text-[#1E63B5]">
                  <Icon size={18} />
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#1E63B5]">
                  {item.eyebrow}
                </p>
                <h2 className="mt-2 text-lg font-black text-[#10233B]">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#5B6877]">{item.description}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {organizationPackages.map((pkg) => (
            <article
              key={pkg.id}
              className="flex h-full flex-col rounded-[2rem] border border-[#D6E6FA] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(18,55,102,0.08)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span className="inline-flex rounded-full bg-[#EAF3FF] px-3 py-1 text-xs font-bold text-[#1E63B5]">
                  {pkg.headcountLabel}
                </span>
                <span className="rounded-full border border-[#D6E6FA] px-3 py-1 text-xs font-semibold text-[#35506C]">
                  Тохируулах боломжтой
                </span>
              </div>

              <div className="mt-5 min-h-[9rem]">
                <h2 className="text-[1.9rem] font-black leading-[1.08] text-[#10233B]">
                  {pkg.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#5B6877]">{pkg.description}</p>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-[#CFE1F7] bg-[#F8FBFF] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E63B5]">
                  Багтсан үйлчилгээ
                </p>
                <ul className="mt-4 space-y-3">
                  {pkg.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[#223548]">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#1E63B5]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 rounded-[1.5rem] bg-[#10233B] p-4 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                  Хэнд тохиромжтой
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-200">{pkg.bestFor}</p>
              </div>

              <div className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={scrollToConsultationForm}
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#1E63B5] transition hover:text-[#154d8f]"
                >
                  Энэ багцаар санал авах
                  <ArrowRight size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>

        <div
          id="organization-consultation-form"
          className="mt-10 grid gap-6 xl:grid-cols-[1.04fr_0.96fr] xl:items-start"
        >
          <div className="rounded-[2rem] border border-[#D6E6FA] bg-white p-6 shadow-sm md:p-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#EAF3FF] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#1E63B5]">
                <Building2 size={14} />
                Байгууллагын үнийн санал
              </span>
            </div>

            <h3 className="mt-5 text-3xl font-black leading-tight text-[#10233B]">
              Та өөрийн компанидаа тохирсон урамшуулалтай үнийн санал авмаар байна уу?
            </h3>
            <p className="mt-3 text-sm leading-7 text-[#5B6877]">
              Тэгвэл доорх формыг бөглөөрэй. Танай компанийн салбар, ажилтны тоо, холбоо
              барих хүний мэдээлэлд үндэслэн манай баг ажлын 24 цагийн дотор хамгийн сайн
              үнийн саналыг хүргэнэ.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-bold text-[#223548]">
                  Компанийн нэр
                </span>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(event) => {
                    resetMessages()
                    setOrganizationName(event.target.value)
                  }}
                  placeholder="Жишээ: ABC LLC"
                  className="min-h-14 w-full rounded-2xl border border-[#D6E6FA] bg-[#FBFDFF] px-4 py-4 text-base font-semibold text-[#10233B] outline-none transition focus:border-[#1E63B5] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#223548]">Компанийн салбар</span>
                <div className="relative">
                  <BriefcaseBusiness
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#1E63B5]"
                  />
                  <select
                    value={organizationIndustry}
                    onChange={(event) => {
                      resetMessages()
                      setOrganizationIndustry(event.target.value)
                    }}
                    className="min-h-14 w-full appearance-none rounded-2xl border border-[#D6E6FA] bg-[#FBFDFF] py-4 pl-12 pr-4 text-base font-semibold text-[#10233B] outline-none transition focus:border-[#1E63B5] focus:bg-white"
                  >
                    <option value="">Салбараа сонгоно уу</option>
                    {industryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#223548]">Ажилтны тоо</span>
                <div className="relative">
                  <Users
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#1E63B5]"
                  />
                  <input
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={employeeCount}
                    onChange={(event) => {
                      resetMessages()
                      setEmployeeCount(event.target.value.replace(/[^\d]/g, ''))
                    }}
                    placeholder="Жишээ: 120"
                    className="min-h-14 w-full rounded-2xl border border-[#D6E6FA] bg-[#FBFDFF] py-4 pl-12 pr-4 text-base font-semibold text-[#10233B] outline-none transition focus:border-[#1E63B5] focus:bg-white"
                  />
                </div>
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-bold text-[#223548]">Холбоо барих хүн</span>
                <div className="relative">
                  <UserRound
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#1E63B5]"
                  />
                  <input
                    type="text"
                    value={contactName}
                    onChange={(event) => {
                      resetMessages()
                      setContactName(event.target.value)
                    }}
                    placeholder="Жишээ: Г. Энхтуяа"
                    className="min-h-14 w-full rounded-2xl border border-[#D6E6FA] bg-[#FBFDFF] py-4 pl-12 pr-4 text-base font-semibold text-[#10233B] outline-none transition focus:border-[#1E63B5] focus:bg-white"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#223548]">Имэйл</span>
                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#1E63B5]"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      resetMessages()
                      setEmail(event.target.value)
                    }}
                    placeholder="contact@company.mn"
                    className="min-h-14 w-full rounded-2xl border border-[#D6E6FA] bg-[#FBFDFF] py-4 pl-12 pr-4 text-base font-semibold text-[#10233B] outline-none transition focus:border-[#1E63B5] focus:bg-white"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#223548]">Утасны дугаар</span>
                <div className="relative">
                  <Phone
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#1E63B5]"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => {
                      resetMessages()
                      setPhone(event.target.value.replace(/[^\d+\s-]/g, ''))
                    }}
                    placeholder="9911 2233"
                    className="min-h-14 w-full rounded-2xl border border-[#D6E6FA] bg-[#FBFDFF] py-4 pl-12 pr-4 text-base font-semibold text-[#10233B] outline-none transition focus:border-[#1E63B5] focus:bg-white"
                  />
                </div>
              </label>
            </div>

            {error ? <p className="mt-5 text-sm font-semibold text-[#E8323F]">{error}</p> : null}

            {successMessage ? (
              <div className="mt-5 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4">
                <p className="text-sm font-bold text-emerald-800">Хүсэлт амжилттай илгээгдлээ.</p>
                <p className="mt-1 text-sm leading-6 text-emerald-700">{successMessage}</p>
              </div>
            ) : null}

            <div className="mt-8">
              <Button type="button" size="lg" fullWidth loading={pending} onClick={handleSubmit}>
                Үнийн санал хүсэх
              </Button>
            </div>
          </div>

          <aside className="rounded-[2rem] bg-[#10233B] p-6 text-white shadow-[0_24px_80px_rgba(16,35,59,0.18)] md:p-7 xl:sticky xl:top-24">
            {submittedRequest ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
                    Хүсэлт илгээгдсэн
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                    <CheckCircle2 size={12} />
                    24 цагийн дотор санал хүргэнэ
                  </span>
                </div>

                <h3 className="mt-4 text-3xl font-black leading-tight">
                  {submittedRequest.organizationName}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Танай хүсэлтийг хүлээн авлаа. Манай баг компанийн тань салбар болон
                  ажилтны тоонд тохирсон хамгийн сайн үнийн саналыг бэлдээд ажлын 24 цагийн
                  дотор холбоо барина.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    ['Компанийн нэр', submittedRequest.organizationName],
                    ['Компанийн салбар', submittedRequest.industry],
                    ['Ажилтны тоо', `${new Intl.NumberFormat('mn-MN').format(submittedRequest.employeeCount)} ажилтан`],
                    ['Холбоо барих хүн', submittedRequest.contactName],
                    ['Имэйл', submittedRequest.email],
                    ['Утас', submittedRequest.phone],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-start justify-between gap-4 rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-3"
                    >
                      <span className="text-sm text-slate-300">{label}</span>
                      <span className="max-w-[14rem] text-right text-sm font-semibold text-white">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  {nextSteps.map((step) => (
                    <div key={step} className="flex items-start gap-3 rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-3">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-blue-200" />
                      <p className="text-sm leading-6 text-slate-200">{step}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
                  Хүсэлт илгээсний дараа
                </p>
                <h3 className="mt-4 text-3xl font-black leading-tight">
                  Үнийн санал авах дараагийн алхам
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Формоо илгээсний дараа манай баг танай салбар, ажилтны тоо, хэрэгцээнд
                  тохирсон урамшуулалтай үнийн саналыг ажлын 24 цагийн дотор хүргэнэ.
                </p>

                <div className="mt-6 space-y-3">
                  {nextSteps.map((step) => (
                    <div key={step} className="flex items-start gap-3 rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-3">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-blue-200" />
                      <p className="text-sm leading-6 text-slate-200">{step}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </section>
  )
}

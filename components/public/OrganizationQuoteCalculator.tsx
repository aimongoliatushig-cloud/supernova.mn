'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { submitOrganizationQuoteRequest } from '@/app/actions/public'
import Button from '@/components/ui/Button'
import {
  calculateOrganizationQuote,
  organizationHeadcountOptions,
  organizationPackages,
  organizationSectors,
  type OrganizationPackageId,
  type OrganizationSectorId,
} from '@/lib/public/organization'

const defaultHeadcountByPackage: Record<OrganizationPackageId, string> = {
  core: '31-60',
  growth: '61-120',
  industry: '121-250',
}

const trustPoints = [
  'Ажлын цагаар эргэн холбогдоно',
  'Нууцлал хамгаална',
  'Тохируулсан санал бэлдэнэ',
]

const nextSteps = [
  'Манай баг ажлын цагаар тантай холбогдоно.',
  'Эцсийн багц, хуваарь, on-site зохион байгуулалтыг баталгаажуулна.',
  'Менежментийн тайлан, хэрэгжилтийн төлөвлөгөөг санал болгоно.',
]

function currency(value: number) {
  return new Intl.NumberFormat('mn-MN').format(value)
}

function scrollToRequestForm() {
  document.getElementById('organization-request')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

export default function OrganizationQuoteCalculator() {
  const [selectedPackageId, setSelectedPackageId] = useState<OrganizationPackageId | null>(null)
  const [headcountOptionId, setHeadcountOptionId] = useState('61-120')
  const [sectorId, setSectorId] = useState<OrganizationSectorId>('office')
  const [organizationName, setOrganizationName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startSubmitTransition] = useTransition()

  const selectedHeadcountOption = useMemo(
    () =>
      organizationHeadcountOptions.find((option) => option.id === headcountOptionId) ??
      organizationHeadcountOptions[2],
    [headcountOptionId]
  )

  const quote = useMemo(() => {
    if (!selectedPackageId) {
      return null
    }

    return calculateOrganizationQuote(
      selectedHeadcountOption.estimateHeadcount,
      sectorId,
      selectedPackageId
    )
  }, [sectorId, selectedHeadcountOption.estimateHeadcount, selectedPackageId])

  function handleSelectPackage(packageId: OrganizationPackageId) {
    setSelectedPackageId(packageId)
    setSubmitted(false)
    setFormError(null)

    if (!selectedPackageId) {
      setHeadcountOptionId(defaultHeadcountByPackage[packageId])
    }

    requestAnimationFrame(scrollToRequestForm)
  }

  function handleBack() {
    setSubmitted(false)
    setFormError(null)
    setSelectedPackageId(null)
    document.getElementById('packages')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedPackageId || !quote) {
      setFormError('Эхлээд багцаа сонгоно уу.')
      return
    }

    if (!organizationName.trim() || !contactName.trim() || !phone.trim()) {
      setFormError('Байгууллагын нэр, холбоо барих хүний нэр, утсаа бөглөнө үү.')
      return
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('И-мэйл хаягаа зөв оруулна уу.')
      return
    }

    setFormError(null)

    startSubmitTransition(async () => {
      const result = await submitOrganizationQuoteRequest({
        organization_name: organizationName,
        contact_name: contactName,
        phone,
        email,
        employee_count: selectedHeadcountOption.estimateHeadcount,
        employee_band_label: selectedHeadcountOption.label,
        sector_id: sectorId,
        package_id: selectedPackageId,
      })

      if (!result.ok) {
        setFormError(result.error)
        return
      }

      setSubmitted(true)
      scrollToRequestForm()
    })
  }

  return (
    <section id="packages" className="bg-[#FBFDFF] py-16 md:py-24">
      <div id="calculator" className="scroll-mt-24" />
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
            Байгууллагын санал
          </p>
          <h2 className="mt-4 text-3xl font-black text-[#10233B] md:text-4xl">
            Танай байгууллагад тохирох багцаа сонгоно уу
          </h2>
          <p className="mt-4 text-base leading-8 text-[#5B6877]">
            Эхлээд багцаа сонгоод, дараа нь байгууллагын мэдээллээ үлдээнэ үү. Манай баг
            ажлын цагаар эргэн холбогдож эцсийн санал, хуваарь, зохион байгуулалтыг баталгаажуулна.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {trustPoints.map((item) => (
            <div
              key={item}
              className="inline-flex items-center gap-2 rounded-full border border-[#D6E6FA] bg-white px-4 py-2 text-sm font-semibold text-[#223548] shadow-sm"
            >
              <CheckCircle2 size={15} className="text-[#1E63B5]" />
              {item}
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {organizationPackages.map((pkg) => {
            const isSelected = selectedPackageId === pkg.id

            return (
              <article
                key={pkg.id}
                className={[
                  'flex h-full flex-col rounded-[2rem] border p-6 shadow-sm transition',
                  isSelected
                    ? 'border-[#1E63B5] bg-[#F7FAFF] shadow-[0_24px_60px_rgba(30,99,181,0.14)]'
                    : 'border-[#D6E6FA] bg-white hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(18,55,102,0.08)]',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="rounded-full bg-[#EAF3FF] px-3 py-1 text-xs font-bold text-[#1E63B5]">
                    {pkg.headcountLabel}
                  </span>
                  <span className="text-right text-sm font-bold text-[#E8323F]">
                    {pkg.priceLabel}
                  </span>
                </div>

                <h3 className="mt-5 text-2xl font-black text-[#10233B]">{pkg.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#5B6877]">{pkg.description}</p>

                <ul className="mt-5 space-y-3">
                  {pkg.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[#223548]">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#1E63B5]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 rounded-[1.5rem] bg-[#FBFDFF] p-4 ring-1 ring-[#E6EEF8]">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1E63B5]">
                    Тохиромжтой байгууллага
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#5B6877]">{pkg.bestFor}</p>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8B98A5]">
                      {pkg.pricingMode === 'custom' ? 'Захиалгат үнэ' : 'Эхлэх үнэ'}
                    </p>
                    <p className="mt-2 text-xl font-black text-[#10233B]">{pkg.priceLabel}</p>
                  </div>

                  <Button
                    type="button"
                    variant={isSelected ? 'primary' : 'outline'}
                    size="lg"
                    className="min-w-[132px]"
                    onClick={() => handleSelectPackage(pkg.id)}
                  >
                    {isSelected ? 'Сонгосон' : 'Сонгох'}
                  </Button>
                </div>
              </article>
            )
          })}
        </div>

        {selectedPackageId && quote && !submitted ? (
          <div
            id="organization-request"
            className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start"
          >
            <form
              onSubmit={handleSubmit}
              className="rounded-[2rem] border border-[#D6E6FA] bg-white p-6 shadow-sm md:p-7"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#EAF3FF] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#1E63B5]">
                  <Building2 size={14} />
                  2-р алхам
                </span>
                <span className="rounded-full border border-[#D6E6FA] px-3 py-1 text-sm font-semibold text-[#223548]">
                  {quote.selectedPackage.title}
                </span>
              </div>

              <h3 className="mt-5 text-3xl font-black leading-tight text-[#10233B]">
                Байгууллагын мэдээллээ оруулна уу
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#5B6877]">
                2 минут хүрэхгүй. Бид мэдээллийг зөвхөн санал боловсруулахад ашиглана.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-[#223548]">Байгууллагын нэр</span>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(event) => setOrganizationName(event.target.value)}
                    placeholder="Жишээ: Supernova LLC"
                    className="mt-2 min-h-14 w-full rounded-2xl border border-[#D6E6FA] bg-[#FBFDFF] px-4 py-4 text-base font-semibold text-[#10233B] outline-none transition focus:border-[#1E63B5] focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-[#223548]">Холбогдох хүний нэр</span>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    placeholder="Нэрээ оруулна уу"
                    className="mt-2 min-h-14 w-full rounded-2xl border border-[#D6E6FA] bg-[#FBFDFF] px-4 py-4 text-base font-semibold text-[#10233B] outline-none transition focus:border-[#1E63B5] focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-[#223548]">Утасны дугаар</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="9911 2233"
                    className="mt-2 min-h-14 w-full rounded-2xl border border-[#D6E6FA] bg-[#FBFDFF] px-4 py-4 text-base font-semibold text-[#10233B] outline-none transition focus:border-[#1E63B5] focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-[#223548]">И-мэйл</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@company.mn"
                    className="mt-2 min-h-14 w-full rounded-2xl border border-[#D6E6FA] bg-[#FBFDFF] px-4 py-4 text-base font-semibold text-[#10233B] outline-none transition focus:border-[#1E63B5] focus:bg-white"
                  />
                </label>

                <div className="md:col-span-2">
                  <span className="text-sm font-bold text-[#223548]">Ажилтны тоо</span>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {organizationHeadcountOptions.map((option) => {
                      const isActive = headcountOptionId === option.id

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setHeadcountOptionId(option.id)}
                          className={[
                            'rounded-2xl border px-4 py-4 text-left transition',
                            isActive
                              ? 'border-[#1E63B5] bg-[#EAF3FF] text-[#10233B]'
                              : 'border-[#D6E6FA] bg-[#FBFDFF] text-[#5B6877] hover:border-[#1E63B5]/60',
                          ].join(' ')}
                        >
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-[#1E63B5]" />
                            <span className="text-base font-bold">{option.label}</span>
                          </div>
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8B98A5]">
                            ажилтан
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <label className="block md:col-span-2">
                  <span className="text-sm font-bold text-[#223548]">Салбар</span>
                  <div className="mt-2 relative">
                    <Building2
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#1E63B5]"
                    />
                    <select
                      value={sectorId}
                      onChange={(event) => setSectorId(event.target.value as OrganizationSectorId)}
                      className="min-h-14 w-full appearance-none rounded-2xl border border-[#D6E6FA] bg-[#FBFDFF] py-4 pl-12 pr-4 text-base font-semibold text-[#10233B] outline-none transition focus:border-[#1E63B5] focus:bg-white"
                    >
                      {organizationSectors.map((sector) => (
                        <option key={sector.id} value={sector.id}>
                          {sector.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-[#6C7C8D]">{quote.sector.description}</p>
                </label>
              </div>

              {formError ? (
                <div className="mt-5 rounded-2xl border border-[#F8C7CD] bg-[#FFF5F6] px-4 py-3 text-sm font-semibold text-[#C0272D]">
                  {formError}
                </div>
              ) : null}

              <div className="sticky bottom-3 mt-6 rounded-[1.5rem] border border-[#D6E6FA] bg-white/95 p-3 shadow-[0_-16px_40px_rgba(18,55,102,0.08)] backdrop-blur md:static md:mt-8 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="min-h-14 sm:w-auto"
                    onClick={handleBack}
                  >
                    <ArrowLeft size={16} />
                    Буцах
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    loading={isPending}
                    className="min-h-14"
                  >
                    Хүсэлт илгээх
                  </Button>
                </div>
              </div>
            </form>

            <aside className="rounded-[2rem] bg-[#10233B] p-6 text-white shadow-[0_24px_80px_rgba(16,35,59,0.18)] md:p-7 xl:sticky xl:top-24">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
                Урьдчилсан санал
              </p>
              <h3 className="mt-4 text-3xl font-black leading-tight">{quote.selectedPackage.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {quote.selectedPackage.description}
              </p>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                  Тооцоолсон үнэ
                </p>
                <p className="mt-3 text-3xl font-black text-white">
                  {currency(quote.totalPrice)}₮
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Нэг ажилтанд {currency(quote.perEmployeePrice)}₮
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  ['Ажилтны тоо', `${selectedHeadcountOption.label} ажилтан`],
                  ['Салбар', quote.sector.label],
                  ['Тохирох хэмжээ', quote.selectedPackage.headcountLabel],
                  ['Тайлан', quote.reportWindow],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-4 rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-3"
                  >
                    <span className="text-sm text-slate-300">{label}</span>
                    <span className="text-right text-sm font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>

              {quote.recommendedPackage.id !== quote.selectedPackage.id ? (
                <div className="mt-6 rounded-[1.5rem] border border-[#2A4668] bg-[#0B1A2E] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                    Системийн зөвлөмж
                  </p>
                  <p className="mt-2 text-lg font-black text-white">
                    {quote.recommendedPackage.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Ажилтны тоо болон салбарын эрсдэлийг харгалзаад энэ багц илүү тохиромжтой байж
                    магадгүй.
                  </p>
                </div>
              ) : null}

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/6 p-5">
                <p className="text-sm font-bold text-white">Дараагийн алхам</p>
                <div className="mt-4 space-y-3">
                  {nextSteps.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <Clock3 size={16} className="mt-0.5 shrink-0 text-blue-200" />
                      <p className="text-sm leading-6 text-slate-300">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-3">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-blue-200" />
                <p className="text-sm leading-6 text-slate-300">
                  Мэдээллийг зөвхөн санал боловсруулах болон холбоо барих зорилгоор ашиглана.
                </p>
              </div>
            </aside>
          </div>
        ) : null}

        {selectedPackageId && submitted ? (
          <div id="organization-request" className="mt-8 rounded-[2rem] border border-[#CDEDD8] bg-white p-8 shadow-sm">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF8EF] text-[#15803D]">
                <CheckCircle2 size={30} />
              </div>
              <h3 className="mt-6 text-3xl font-black text-[#10233B]">
                Баярлалаа. Танай байгууллагын мэдээллийг хүлээн авлаа.
              </h3>
              <p className="mt-4 text-base leading-8 text-[#5B6877]">
                Манай баг тантай ажлын цагаар эргэн холбогдоно.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

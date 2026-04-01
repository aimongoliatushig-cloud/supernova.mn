'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, Building2, CheckCircle2, Clock3, Users } from 'lucide-react'
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
  '15+ ажилтантай багт тохирно',
  'On-site зохион байгуулалт боломжтой',
  'Дижитал тайлан, менежментийн дүгнэлттэй',
]

const nextSteps = [
  'Хүний тоо, чиглэл өөрчлөгдөх бүрт үнэ автоматаар шинэчлэгдэнэ.',
  'Тохирох багцыг хурдан харьцуулж шийднэ.',
  'Шаардлагатай бол дараагийн алхмаар манай багтай холбогдож болно.',
]

function currency(value: number) {
  return new Intl.NumberFormat('mn-MN').format(value)
}

function scrollToCalculator() {
  document.getElementById('organization-calculator')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

export default function OrganizationQuoteCalculator() {
  const [selectedPackageId, setSelectedPackageId] = useState<OrganizationPackageId | null>(null)
  const [headcountOptionId, setHeadcountOptionId] = useState('61-120')
  const [sectorId, setSectorId] = useState<OrganizationSectorId>('office')

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

  function handleCalculate(packageId: OrganizationPackageId) {
    setSelectedPackageId(packageId)
    setHeadcountOptionId(defaultHeadcountByPackage[packageId])
    requestAnimationFrame(scrollToCalculator)
  }

  function handleBack() {
    setSelectedPackageId(null)
    document.getElementById('packages')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <section id="packages" className="bg-[#FBFDFF] py-16 md:py-24">
      <div id="calculator" className="scroll-mt-24" />
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
            Байгууллагын багц үйлчилгээ
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-[#10233B] md:text-5xl">
            Байгууллагад тохирсон 3 багц
          </h1>
          <p className="mt-4 text-base leading-8 text-[#5B6877]">
            Эхлээд багцаа харна. Дараа нь `Үнийн тооцоо гаргах` дээр дарж ажилтны тоо,
            чиглэлээ сонгоод урьдчилсан үнийг шууд бодно.
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
            const isActive = selectedPackageId === pkg.id

            return (
              <article
                key={pkg.id}
                className={[
                  'flex h-full flex-col rounded-[2rem] border p-6 shadow-sm transition',
                  isActive
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

                <h2 className="mt-5 text-2xl font-black text-[#10233B]">{pkg.title}</h2>
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

                <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8B98A5]">
                      {pkg.pricingMode === 'custom' ? 'Захиалгат үнэ' : 'Эхлэх үнэ'}
                    </p>
                    <p className="mt-2 text-xl font-black text-[#10233B]">{pkg.priceLabel}</p>
                  </div>

                  <Button
                    type="button"
                    variant={isActive ? 'primary' : 'outline'}
                    size="lg"
                    className="min-w-[170px]"
                    onClick={() => handleCalculate(pkg.id)}
                  >
                    Үнийн тооцоо гаргах
                  </Button>
                </div>
              </article>
            )
          })}
        </div>

        {selectedPackageId && quote ? (
          <div
            id="organization-calculator"
            className="mt-8 grid gap-6 xl:grid-cols-[1.02fr_0.98fr] xl:items-start"
          >
            <div className="rounded-[2rem] border border-[#D6E6FA] bg-white p-6 shadow-sm md:p-7">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#EAF3FF] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#1E63B5]">
                  <Building2 size={14} />
                  Үнийн тооцоолол
                </span>
                <span className="rounded-full border border-[#D6E6FA] px-3 py-1 text-sm font-semibold text-[#223548]">
                  {quote.selectedPackage.title}
                </span>
              </div>

              <h3 className="mt-5 text-3xl font-black leading-tight text-[#10233B]">
                Байгууллагын хүний тоо, чиглэлээ сонгоно уу
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#5B6877]">
                Сонголтоо өөрчлөх бүрт урьдчилсан үнэ автоматаар бодогдоно.
              </p>

              <div className="mt-6 space-y-6">
                <div>
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

                <div>
                  <span className="text-sm font-bold text-[#223548]">Чиглэл</span>
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
                </div>
              </div>

              <div className="mt-8">
                <Button type="button" variant="secondary" size="lg" onClick={handleBack}>
                  <ArrowLeft size={16} />
                  Буцах
                </Button>
              </div>
            </div>

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
                <p className="mt-3 text-3xl font-black text-white">{currency(quote.totalPrice)}₮</p>
                <p className="mt-2 text-sm text-slate-300">
                  Нэг ажилтанд {currency(quote.perEmployeePrice)}₮
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  ['Сонгосон багц', quote.selectedPackage.title],
                  ['Ажилтны тоо', `${selectedHeadcountOption.label} ажилтан`],
                  ['Чиглэл', quote.sector.label],
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
                    Зөвлөмж
                  </p>
                  <p className="mt-2 text-lg font-black text-white">
                    {quote.recommendedPackage.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Хүний тоо болон чиглэлээс шалтгаалаад энэ багц илүү тохиромжтой байж
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
            </aside>
          </div>
        ) : null}
      </div>
    </section>
  )
}

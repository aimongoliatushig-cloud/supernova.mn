'use client'

import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  Sparkles,
  Users,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import {
  calculateOrganizationQuote,
  organizationPackages,
  organizationSectors,
  type OrganizationPackageId,
  type OrganizationSectorId,
} from '@/lib/public/organization'

const defaultHeadcountByPackage: Record<OrganizationPackageId, string> = {
  core: '45',
  growth: '90',
  industry: '180',
}

const trustPoints = [
  'Яг ажилтны тоогоор үнэ бодно',
  'On-site зохион байгуулалт боломжтой',
  'Дижитал тайлан, менежментийн дүгнэлттэй',
]

const nextSteps = [
  'Хүний тоо, чиглэлээ өөрчлөх бүрт үнэ автоматаар шинэчлэгдэнэ.',
  'Багцуудын хооронд хурдан харьцуулж шийдвэр гаргаж болно.',
  'Шаардлагатай бол дараагийн алхмаар манай багтай холбогдоно.',
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
  const [headcountInput, setHeadcountInput] = useState('90')
  const [sectorId, setSectorId] = useState<OrganizationSectorId>('office')
  const [customSectorLabel, setCustomSectorLabel] = useState('')

  const parsedHeadcount = Number.parseInt(headcountInput, 10)
  const effectiveHeadcount = Number.isNaN(parsedHeadcount) ? 15 : parsedHeadcount

  const quote = useMemo(() => {
    if (!selectedPackageId) {
      return null
    }

    return calculateOrganizationQuote(effectiveHeadcount, sectorId, selectedPackageId)
  }, [effectiveHeadcount, sectorId, selectedPackageId])

  const displayedSectorLabel =
    sectorId === 'custom' && customSectorLabel.trim().length > 0
      ? customSectorLabel.trim()
      : quote?.sector.label ?? ''

  function handleCalculate(packageId: OrganizationPackageId) {
    setSelectedPackageId(packageId)
    setHeadcountInput(defaultHeadcountByPackage[packageId])
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
    <section id="packages" className="bg-[#FBFDFF] pb-20 pt-16 md:pb-28 md:pt-24">
      <div id="calculator" className="scroll-mt-24" />
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
            Байгууллагын багц үйлчилгээ
          </p>
          <h1 className="mt-4 text-5xl font-black leading-[0.98] text-[#10233B] md:text-6xl">
            Байгууллагын багц үйлчилгээ
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#5B6877]">
            Багцаа эхлээд харьцуулна. Дараа нь &quot;Үнийн тооцоо гаргах&quot; дээр дарж
            ажилтны тоогоо яг өөрөөр нь оруулаад, чиглэлээ сонгон урьдчилсан үнийг шууд бодно.
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

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {organizationPackages.map((pkg) => {
            const isActive = selectedPackageId === pkg.id

            return (
              <article
                key={pkg.id}
                className={[
                  'flex h-full flex-col rounded-[2rem] border p-6 shadow-sm transition',
                  isActive
                    ? 'border-[#1E63B5] bg-[#F7FAFF] shadow-[0_28px_70px_rgba(30,99,181,0.14)]'
                    : 'border-[#D6E6FA] bg-white hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(18,55,102,0.08)]',
                ].join(' ')}
              >
                <div className="flex min-h-[3.5rem] items-start justify-between gap-3">
                  <span className="inline-flex max-w-[14rem] rounded-full bg-[#EAF3FF] px-3 py-1 text-xs font-bold text-[#1E63B5]">
                    {pkg.headcountLabel}
                  </span>
                  {isActive ? (
                    <span className="inline-flex rounded-full bg-[#10233B] px-3 py-1 text-xs font-bold text-white">
                      Сонгосон
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 min-h-[9rem]">
                  <h2 className="text-[1.9rem] font-black leading-[1.08] text-[#10233B]">
                    {pkg.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[#5B6877]">{pkg.description}</p>
                </div>

                <div className="mt-5 rounded-[1.5rem] bg-[#F8FBFF] p-4 ring-1 ring-[#E6EEF8]">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E63B5]">
                    Гол давуу тал
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

                <div className="mt-5 min-h-[7.5rem] rounded-[1.5rem] bg-white p-4 ring-1 ring-[#E6EEF8]">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E63B5]">
                    Илүү тохирох хэрэглээ
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#5B6877]">{pkg.bestFor}</p>
                </div>

                <div className="mt-auto pt-6">
                  <div className="rounded-[1.5rem] border border-[#D6E6FA] bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8B98A5]">
                      {pkg.pricingMode === 'custom' ? 'Үнэ' : 'Эхлэх үнэ'}
                    </p>
                    <div className="mt-2 flex min-h-[3.5rem] items-end">
                      <p className="text-2xl font-black text-[#10233B]">{pkg.priceLabel}</p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant={isActive ? 'primary' : 'outline'}
                    size="lg"
                    fullWidth
                    className="mt-4 min-h-[3.5rem]"
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
            className="mt-10 grid gap-6 xl:grid-cols-[1.04fr_0.96fr] xl:items-start"
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
                Ажилтны тоог яг өөрөөр нь оруулна. Үнийн тооцоо тэр тоон дээр үндэслэнэ.
              </p>

              <div className="mt-7 space-y-7">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-[#223548]">Ажилтны тоо</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8B98A5]">
                      Яг тоо
                    </span>
                  </div>

                  <div className="mt-3 rounded-[1.75rem] border border-[#D6E6FA] bg-[#F8FBFF] p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1E63B5] shadow-sm">
                        <Users size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-black text-[#10233B]">Яг ажилтны тоогоо оруулна уу</p>
                        <p className="mt-1 text-sm leading-6 text-[#5B6877]">
                          Жишээ: 87, 126, 245. Хамгийн багадаа 15 ажилтнаас тооцно.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                      <label className="block flex-1">
                        <span className="sr-only">Ажилтны яг тоо</span>
                        <input
                          type="number"
                          min={15}
                          step={1}
                          inputMode="numeric"
                          value={headcountInput}
                          onChange={(event) =>
                            setHeadcountInput(event.target.value.replace(/[^\d]/g, ''))
                          }
                          placeholder="Жишээ: 87"
                          className="min-h-16 w-full rounded-2xl border border-[#C8DCF5] bg-white px-5 py-4 text-2xl font-black text-[#10233B] outline-none transition focus:border-[#1E63B5]"
                        />
                      </label>
                      <div className="rounded-2xl border border-[#D6E6FA] bg-white px-5 py-4 text-sm font-bold text-[#1E63B5]">
                        ажилтан
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                      <span className="rounded-full bg-white px-3 py-1 font-semibold text-[#35506C] ring-1 ring-[#D6E6FA]">
                        Тооцоонд ашиглах тоо: {quote.headcount}
                      </span>
                      <span className="text-[#6C7C8D]">
                        15-аас бага утга оруулбал автоматаар 15 гэж бодно.
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-bold text-[#223548]">Чиглэл</span>
                  <div className="mt-3 relative">
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

                  {sectorId === 'custom' ? (
                    <div className="mt-3 rounded-[1.5rem] border border-[#D6E6FA] bg-[#F8FBFF] p-4">
                      <label className="block">
                        <span className="text-sm font-bold text-[#223548]">
                          Custom чиглэлээ бичнэ үү
                        </span>
                        <input
                          type="text"
                          value={customSectorLabel}
                          onChange={(event) => setCustomSectorLabel(event.target.value)}
                          placeholder="Жишээ: Уул уурхай, медиа, эрчим хүч..."
                          className="mt-3 min-h-14 w-full rounded-2xl border border-[#D6E6FA] bg-white px-4 py-4 text-base font-semibold text-[#10233B] outline-none transition focus:border-[#1E63B5]"
                        />
                      </label>
                      <p className="mt-2 text-xs leading-6 text-[#6C7C8D]">
                        Энэ нь урьдчилсан тооцоонд ерөнхий коэффициент ашиглана. Дараагийн шатанд
                        илүү нарийвчилж тохируулна.
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs leading-6 text-[#6C7C8D]">{quote.sector.description}</p>
                  )}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" variant="secondary" size="lg" onClick={handleBack}>
                  <ArrowLeft size={16} />
                  Өөр багц харах
                </Button>
                <p className="text-sm font-medium text-[#6C7C8D]">
                  Сонгосон багц:{' '}
                  <span className="font-bold text-[#10233B]">{quote.selectedPackage.title}</span>
                </p>
              </div>
            </div>

            <aside className="rounded-[2rem] bg-[#10233B] p-6 text-white shadow-[0_24px_80px_rgba(16,35,59,0.18)] md:p-7 xl:sticky xl:top-24">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
                  Урьдчилсан санал
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
                  <Sparkles size={12} />
                  {quote.recommendedPackage.id === quote.selectedPackage.id
                    ? 'Тохирсон сонголт'
                    : 'Нэмэлт зөвлөмжтэй'}
                </span>
              </div>

              <h3 className="mt-4 text-3xl font-black leading-tight">{quote.selectedPackage.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {quote.selectedPackage.description}
              </p>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/6 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                  Тооцоолсон үнэ
                </p>
                <p className="mt-3 text-4xl font-black text-white">{currency(quote.totalPrice)}₮</p>
                <p className="mt-2 text-sm text-slate-300">
                  Нэг ажилтанд {currency(quote.perEmployeePrice)}₮
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  ['Сонгосон багц', quote.selectedPackage.title],
                  ['Ажилтны тоо', `${quote.headcount} ажилтан`],
                  ['Чиглэл', displayedSectorLabel],
                  ['Тайлан', quote.reportWindow],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-4 rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-3"
                  >
                    <span className="text-sm text-slate-300">{label}</span>
                    <span className="max-w-[13rem] text-right text-sm font-semibold text-white">
                      {value}
                    </span>
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
                    Хүний тоо болон чиглэлийн эрсдэлийг харгалзаад энэ багц илүү тохиромжтой
                    байж магадгүй.
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

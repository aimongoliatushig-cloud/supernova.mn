'use client'

import { useState } from 'react'
import { Building2, Calculator, Users } from 'lucide-react'
import {
  calculateOrganizationQuote,
  organizationSectors,
  type OrganizationSectorId,
} from '@/lib/public/organization'

function currency(value: number) {
  return new Intl.NumberFormat('mn-MN').format(value)
}

export default function OrganizationQuoteCalculator() {
  const [headcountInput, setHeadcountInput] = useState('45')
  const [sectorId, setSectorId] = useState<OrganizationSectorId>('office')
  const parsedHeadcount = Number.parseInt(headcountInput, 10)
  const quote = calculateOrganizationQuote(
    Number.isNaN(parsedHeadcount) ? 15 : parsedHeadcount,
    sectorId
  )

  return (
    <section id="calculator" className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-[#D6E6FA] bg-white p-6 shadow-sm md:p-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#EAF3FF] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#1E63B5]">
              <Calculator size={14} />
              Урьдчилсан үнэ тооцох
            </div>
            <h2 className="mt-5 text-3xl font-black leading-tight text-[#10233B]">
              Ажилтны тоо болон компанийн чиглэлээ оруулаад байгууллагын санал аваарай
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#5B6877]">
              Энэ тооцоо нь урьдчилсан төсөв гаргах зориулалттай. Нарийвчилсан саналд ажлын байрны
              эрсдэл, багийн бүтэц, үзлэгийн жагсаалт тусгагдана.
            </p>

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="text-sm font-bold text-[#223548]">Байгууллагын хүний тоо</span>
                <div className="mt-2 relative">
                  <Users
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#1E63B5]"
                  />
                  <input
                    type="number"
                    min={15}
                    step={1}
                    inputMode="numeric"
                    value={headcountInput}
                    onChange={(event) => setHeadcountInput(event.target.value.replace(/[^\d]/g, ''))}
                    className="w-full rounded-2xl border border-[#D6E6FA] bg-[#FBFDFF] py-3 pl-12 pr-4 text-base font-semibold text-[#10233B] outline-none transition focus:border-[#1E63B5] focus:bg-white"
                    placeholder="Жишээ нь: 85"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#223548]">Компанийн чиглэл</span>
                <div className="mt-2 relative">
                  <Building2
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#1E63B5]"
                  />
                  <select
                    value={sectorId}
                    onChange={(event) => setSectorId(event.target.value as OrganizationSectorId)}
                    className="w-full appearance-none rounded-2xl border border-[#D6E6FA] bg-[#FBFDFF] py-3 pl-12 pr-4 text-base font-semibold text-[#10233B] outline-none transition focus:border-[#1E63B5] focus:bg-white"
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
          </div>

          <div className="rounded-[2rem] bg-[#10233B] p-6 text-white shadow-[0_24px_80px_rgba(16,35,59,0.18)] md:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
              Таны урьдчилсан санал
            </p>
            <h3 className="mt-4 text-3xl font-black leading-tight">{quote.recommendedPackage.title}</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              {quote.recommendedPackage.description}
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] bg-white/8 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                  Нэг ажилтанд
                </p>
                <p className="mt-3 text-2xl font-black text-white">₮{currency(quote.perEmployeePrice)}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white/8 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                  Нийт төсөв
                </p>
                <p className="mt-3 text-2xl font-black text-white">₮{currency(quote.totalPrice)}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white/8 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                  Тайлан гарах
                </p>
                <p className="mt-3 text-2xl font-black text-white">{quote.reportWindow}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                <p className="text-sm font-bold text-white">Тохирох ажилтны хэмжээ</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {quote.recommendedPackage.headcountLabel}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                <p className="text-sm font-bold text-white">On-site зохион байгуулалт</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{quote.onsiteWindow}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-[#2A4668] bg-[#0B1A2E] p-5">
              <p className="text-sm font-bold text-white">Багцад багтах гол зүйлс</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {quote.recommendedPackage.highlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-[#17385E] px-3 py-1 text-xs font-semibold text-blue-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                {quote.sector.label} чиглэлд зориулж урьдчилсан үнэ тооцоологдлоо. Илүү нарийн
                саналд баг тус бүрийн эрсдэлийн ялгааг нэмэлтээр тохируулна.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { PublicDoctor } from '@/lib/public/types'

function DoctorCard({ d }: { d: PublicDoctor }) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#E5E7EB] hover:border-[#1E63B5]/30 hover:shadow-md transition-all group">
      {/* Photo */}
      <div className="relative w-full aspect-[3/4] bg-[#D6E6FA]">
        {!imgError && (
          <Image
            src={d.photo_url ?? '/logo.png'}
            alt={d.full_name}
            fill
            className="object-cover object-top group-hover:scale-[1.02] transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        )}
        {/* Fallback avatar */}
        {imgError && (
          <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white">
            {d.full_name.slice(0, 1)}
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-4">
        <div className="text-sm font-black text-[#1F2937] leading-tight">{d.full_name}</div>
        <div className="text-xs text-[#1E63B5] font-semibold mt-0.5">{d.title}</div>
        <div className="text-xs text-[#6B7280] mt-1 leading-snug">{d.specialization}</div>
        <div className="mt-2.5 inline-block text-xs bg-[#EAF3FF] text-[#1E63B5] px-2.5 py-0.5 rounded-full font-semibold">
          {d.experience_years}+ жил
        </div>
      </div>
    </div>
  )
}

export default function DoctorsSection({ doctors }: { doctors: PublicDoctor[] }) {
  return (
    <section id="doctors" className="py-16 md:py-24 bg-[#F7FAFF]">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-block text-xs font-bold text-[#1E63B5] uppercase tracking-widest bg-[#EAF3FF] px-3 py-1 rounded-full mb-3">
            Эмч нар
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#1F2937]">Мэргэшсэн эмч нарын баг</h2>
          <p className="text-[#6B7280] mt-2 max-w-lg mx-auto text-sm">
            Манай эмч нар олон улсын сургалтад хамрагдан, тасралтгүй мэдлэгоо дээшлүүлж байдаг.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {doctors.map((d) => (
            <DoctorCard key={d.id} d={d} />
          ))}
        </div>
      </div>
    </section>
  )
}

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Calendar, CheckCircle2, Shield, Stethoscope } from 'lucide-react'
import { useState } from 'react'
import type { PublicDoctor } from '@/lib/public/types'

function truncate(text: string | null | undefined, maxLength: number) {
  if (!text) {
    return ''
  }

  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text
}

function DoctorCard({ doctor }: { doctor: PublicDoctor }) {
  const [imgError, setImgError] = useState(false)

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-[#DCE9F8] bg-white shadow-[0_18px_50px_rgba(18,55,102,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(18,55,102,0.14)]">
      <div className="relative aspect-[4/5] bg-[linear-gradient(180deg,#EAF3FF_0%,#CFE0F8_100%)]">
        {!imgError ? (
          <Image
            src={doctor.photo_url ?? '/logo.png'}
            alt={doctor.full_name}
            fill
            className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1E63B5] text-4xl font-black text-white">
            {doctor.full_name.slice(0, 1)}
          </div>
        )}

        <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/92 p-3 backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
            {doctor.title || 'Эмч'}
          </p>
          <h3 className="mt-1 text-lg font-black text-[#10233B]">{doctor.full_name}</h3>
          <p className="mt-1 text-sm text-[#526071]">{doctor.specialization}</p>
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF3FF] px-3 py-1 text-xs font-semibold text-[#1E63B5]">
            <CheckCircle2 size={13} />
            {doctor.experience_years}+ жил
          </span>
          {doctor.schedule_summary ? (
            <span className="rounded-full border border-[#E5E7EB] px-3 py-1 text-xs font-semibold text-[#5D6A79]">
              {doctor.schedule_summary}
            </span>
          ) : null}
        </div>

        {doctor.bio ? (
          <p className="mt-4 text-sm leading-6 text-[#5B6877]">{truncate(doctor.bio, 140)}</p>
        ) : (
          <p className="mt-4 text-sm leading-6 text-[#5B6877]">
            Оношилгоо, эрт илрүүлэг, урьдчилан сэргийлэх үзлэгийн чиглэлээр үйлчилгээ үзүүлнэ.
          </p>
        )}

        <Link
          href="/appointment"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#BCD4F4] px-4 py-3 text-sm font-bold text-[#1E63B5] transition hover:bg-[#EAF3FF]"
        >
          <Calendar size={16} />
          Энэ эмчид цаг захиалах
        </Link>
      </div>
    </article>
  )
}

export default function DoctorsSection({ doctors }: { doctors: PublicDoctor[] }) {
  const hasDoctors = doctors.length > 0

  return (
    <section id="doctors" className="py-18 bg-white md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#DCE9F8] bg-[#F6FAFF] px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#1E63B5]">
            <Stethoscope size={13} />
            Эмч нар
          </p>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-[#10233B] md:text-4xl">
            Мэргэшсэн эмч нарын баг
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#607080] md:text-base">
            Япон стандартын хяналттай урсгал, ойлгомжтой тайлбар, оношилгооны дараах
            зөвлөмжийг нэг дороос авах боломжтой.
          </p>
        </div>

        {hasDoctors ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-[2rem] border border-dashed border-[#C9DCF4] bg-[linear-gradient(180deg,#FFFFFF_0%,#F6FAFF_100%)] p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#1E63B5]">
              <Shield size={22} />
            </div>
            <h3 className="mt-5 text-2xl font-black text-[#10233B]">
              Эмчийн танилцуулга шинэчлэгдэж байна
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#607080]">
              Эмч нарын профайл админ талаас идэвхжих үед энэ хэсэг автоматаар дүүрнэ.
              Одоогоор та эрүүл мэндийн урьдчилсан шалгалтаа эхлүүлж эсвэл шууд цаг захиалах боломжтой.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/consultation"
                className="inline-flex items-center justify-center rounded-2xl bg-[#1E63B5] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#154D8F]"
              >
                Үнэгүй зөвлөгөө авах
              </Link>
              <Link
                href="/appointment"
                className="inline-flex items-center justify-center rounded-2xl border border-[#BCD4F4] px-6 py-3 text-sm font-bold text-[#1E63B5] transition hover:bg-[#EAF3FF]"
              >
                Цаг захиалах
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

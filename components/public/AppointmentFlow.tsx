'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, CheckCircle2, Clock, Shield, User } from 'lucide-react'
import { submitAppointment } from '@/app/actions/public'
import Button from '@/components/ui/Button'
import type { PublicDoctor, PublicService } from '@/lib/public/types'

interface AppointmentFlowProps {
  doctors: PublicDoctor[]
  services: PublicService[]
  privacyText: string
  initialLeadId?: string | null
  initialName?: string
  initialPhone?: string
  initialEmail?: string
}

const TIME_SLOTS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat('mn-MN').format(value)
}

function getDateOptions() {
  const options: Array<{ value: string; label: string }> = []
  const today = new Date()

  for (let index = 1; index <= 14; index += 1) {
    const nextDate = new Date(today)
    nextDate.setDate(today.getDate() + index)
    if (nextDate.getDay() === 0) {
      continue
    }

    options.push({
      value: nextDate.toISOString().slice(0, 10),
      label: nextDate.toLocaleDateString('mn-MN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    })
  }

  return options
}

export default function AppointmentFlow({
  doctors,
  services,
  privacyText,
  initialLeadId,
  initialName = '',
  initialPhone = '',
  initialEmail = '',
}: AppointmentFlowProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [fullName, setFullName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  const dateOptions = useMemo(() => getDateOptions(), [])
  const selectedService = services.find((service) => service.id === selectedServiceId) ?? null

  const doctorsWithRelations = doctors.some(
    (doctor) => (doctor.doctor_services?.length ?? 0) > 0
  )

  const availableDoctors = useMemo(() => {
    if (!selectedServiceId || !doctorsWithRelations) {
      return doctors
    }

    return doctors.filter((doctor) =>
      doctor.doctor_services?.some((relation) => relation.service_id === selectedServiceId)
    )
  }, [doctors, doctorsWithRelations, selectedServiceId])

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitAppointment({
        lead_id: initialLeadId,
        full_name: fullName,
        phone,
        email,
        service_id: selectedServiceId,
        doctor_id: selectedDoctorId,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      setError('')
      setSuccess(true)
    })
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F7FAFF] px-4 py-20">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#E5E7EB] bg-white p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#DCFCE7]">
            <CheckCircle2 size={32} className="text-[#16A34A]" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-[#1F2937]">Цагийн хүсэлт илгээгдлээ</h1>
          <p className="mt-3 text-sm leading-6 text-[#6B7280]">
            Манай ажилтан {phone} дугаарт эргэн холбогдож, сонгосон өдөр цагийг баталгаажуулна.
          </p>
          {selectedService?.preparation_notice ? (
            <div className="mt-6 rounded-2xl border border-[#FDE3C3] bg-[#FFFBF4] p-4 text-left">
              <p className="text-xs font-bold uppercase tracking-wide text-[#B45309]">Бэлтгэл</p>
              <p className="mt-2 text-sm leading-6 text-[#92400E]">
                {selectedService.preparation_notice}
              </p>
            </div>
          ) : null}
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#1E63B5] px-6 py-3 text-sm font-bold text-white"
          >
            Нүүр хуудас руу буцах
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7FAFF]">
      <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
          <Link href="/result" className="text-[#6B7280] hover:text-[#1E63B5]">
            <ArrowLeft size={18} />
          </Link>
          <span className="text-sm font-bold text-[#1F2937]">Эмчийн цаг захиалах</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section>
              <h2 className="text-sm font-black uppercase tracking-wide text-[#1F2937]">
                Үйлчилгээ сонгох
              </h2>
              <div className="mt-3 space-y-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      setSelectedServiceId(service.id)
                      setSelectedDoctorId('')
                    }}
                    className={[
                      'w-full rounded-2xl border-2 px-4 py-4 text-left transition-all',
                      selectedServiceId === service.id
                        ? 'border-[#1E63B5] bg-[#EAF3FF]'
                        : 'border-[#E5E7EB] bg-white hover:border-[#1E63B5]/40',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p
                          className={[
                            'text-sm font-black',
                            selectedServiceId === service.id ? 'text-[#1E63B5]' : 'text-[#1F2937]',
                          ].join(' ')}
                        >
                          {service.name}
                        </p>
                        {service.description ? (
                          <p className="mt-1 text-xs leading-5 text-[#6B7280]">{service.description}</p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-[#1E63B5]">
                          ₮{formatCurrency(service.price)}
                        </p>
                        <p className="mt-1 text-xs text-[#9CA3AF]">{service.duration_minutes} мин</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-black uppercase tracking-wide text-[#1F2937]">
                Эмч сонгох
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {availableDoctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() => setSelectedDoctorId(doctor.id)}
                    className={[
                      'rounded-2xl border-2 p-4 text-left transition-all',
                      selectedDoctorId === doctor.id
                        ? 'border-[#1E63B5] bg-[#EAF3FF]'
                        : 'border-[#E5E7EB] bg-white hover:border-[#1E63B5]/40',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative h-14 w-14 overflow-hidden rounded-full bg-[#D6E6FA]">
                        {doctor.photo_url ? (
                          <Image
                            src={doctor.photo_url}
                            alt={doctor.full_name}
                            fill
                            className="object-cover object-top"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg font-black text-[#1E63B5]">
                            {doctor.full_name.slice(0, 1)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p
                          className={[
                            'text-sm font-black',
                            selectedDoctorId === doctor.id ? 'text-[#1E63B5]' : 'text-[#1F2937]',
                          ].join(' ')}
                        >
                          {doctor.full_name}
                        </p>
                        <p className="mt-1 text-xs text-[#6B7280]">{doctor.specialization}</p>
                        <p className="mt-2 text-xs font-semibold text-[#9CA3AF]">
                          {doctor.experience_years}+ жил
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#1F2937]">
                  <Calendar size={14} />
                  Өдөр
                </h2>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {dateOptions.map((option) => {
                    const parts = option.label.split(' ')

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedDate(option.value)}
                        className={[
                          'min-w-[90px] rounded-2xl border-2 px-3 py-3 text-center transition-all',
                          selectedDate === option.value
                            ? 'border-[#1E63B5] bg-[#EAF3FF]'
                            : 'border-[#E5E7EB] bg-white hover:border-[#1E63B5]/40',
                        ].join(' ')}
                      >
                        <p className="text-xs font-semibold text-[#9CA3AF]">{parts[0]}</p>
                        <p className="mt-1 text-lg font-black text-[#1F2937]">{parts[2]}</p>
                        <p className="text-xs text-[#6B7280]">{parts[1]}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#1F2937]">
                  <Clock size={14} />
                  Цаг
                </h2>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      className={[
                        'rounded-2xl border-2 px-3 py-2.5 text-sm font-semibold transition-all',
                        selectedTime === slot
                          ? 'border-[#1E63B5] bg-[#EAF3FF] text-[#1E63B5]'
                          : 'border-[#E5E7EB] bg-white text-[#1F2937] hover:border-[#1E63B5]/40',
                      ].join(' ')}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-[#E5E7EB] bg-white p-5">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#1F2937]">
                <User size={14} />
                Холбоо барих мэдээлэл
              </h2>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1F2937]">
                    Нэр <span className="text-[#F23645]">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1F2937]">
                    Утасны дугаар <span className="text-[#F23645]">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1F2937]">
                    Имэйл <span className="text-xs font-normal text-[#9CA3AF]">(заавал биш)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                  />
                </div>
              </div>

              {selectedService?.preparation_notice ? (
                <div className="mt-5 rounded-2xl border border-[#FDE3C3] bg-[#FFFBF4] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#B45309]">Бэлтгэл</p>
                  <p className="mt-2 text-sm leading-6 text-[#92400E]">
                    {selectedService.preparation_notice}
                  </p>
                </div>
              ) : null}

              {error ? <p className="mt-4 text-sm font-medium text-[#F23645]">{error}</p> : null}

              <div className="mt-5">
                <Button fullWidth size="xl" loading={pending} onClick={handleSubmit}>
                  Цаг захиалах
                </Button>
              </div>

              <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#9CA3AF]">
                <Shield size={14} className="mt-0.5 shrink-0 text-[#1E63B5]" />
                <span>{privacyText}</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

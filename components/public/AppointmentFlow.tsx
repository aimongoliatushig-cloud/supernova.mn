'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Shield,
  Sparkles,
  User,
} from 'lucide-react'
import { submitAppointment } from '@/app/actions/public'
import FlowHeader from '@/components/public/FlowHeader'
import Button from '@/components/ui/Button'
import {
  findBestCategoryMatch,
  getCategoryMatchScore,
} from '@/lib/public/category-matching'
import type { PublicDoctor, PublicService } from '@/lib/public/types'

interface AppointmentFlowProps {
  doctors: PublicDoctor[]
  services: PublicService[]
  privacyText: string
  initialLeadId?: string | null
  initialAssessmentId?: string | null
  initialName?: string
  initialPhone?: string
  initialEmail?: string
  initialSelectedCategories?: string[]
}

const TIME_GROUPS = [
  { label: 'Өглөө', slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'] },
  { label: 'Үдээс хойш', slots: ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
] as const

function formatCurrency(value: number) {
  return new Intl.NumberFormat('mn-MN').format(value)
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDateOptions() {
  const options: Array<{
    value: string
    weekday: string
    month: string
    day: string
    isoLabel: string
  }> = []
  const today = new Date()

  for (let index = 1; index <= 14; index += 1) {
    const nextDate = new Date(today)
    nextDate.setDate(today.getDate() + index)
    if (nextDate.getDay() === 0) {
      continue
    }

    options.push({
      value: toDateInputValue(nextDate),
      weekday: nextDate.toLocaleDateString('mn-MN', { weekday: 'short' }),
      month: nextDate.toLocaleDateString('mn-MN', { month: 'short' }),
      day: nextDate.toLocaleDateString('mn-MN', { day: 'numeric' }),
      isoLabel: nextDate.toLocaleDateString('mn-MN', {
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      }),
    })
  }

  return options
}

function normalizeCategoryName(name: string | null | undefined) {
  return name?.trim() || 'Бусад'
}

export default function AppointmentFlow({
  doctors,
  services,
  privacyText,
  initialLeadId,
  initialAssessmentId,
  initialName = '',
  initialPhone = '',
  initialEmail = '',
  initialSelectedCategories = [],
}: AppointmentFlowProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const serviceCategories = Array.from(
      new Set(services.map((service) => normalizeCategoryName(service.categories?.name)))
    )

    return findBestCategoryMatch(serviceCategories, initialSelectedCategories) ?? 'all'
  })
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [fullName, setFullName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  const dateOptions = useMemo(() => getDateOptions(), [])
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(services.map((service) => normalizeCategoryName(service.categories?.name)))
    )
    return ['all', ...uniqueCategories]
  }, [services])

  const matchedServiceCategories = useMemo(() => {
    if (initialSelectedCategories.length === 0) {
      return []
    }

    return categories.filter(
      (category) =>
        category !== 'all' && getCategoryMatchScore(category, initialSelectedCategories) > 0
    )
  }, [categories, initialSelectedCategories])

  const hasAssessmentFilter = matchedServiceCategories.length > 0

  const recommendedServices = useMemo(() => {
    if (!hasAssessmentFilter) {
      return services
    }

    return services.filter((service) => {
      const searchText = [
        service.name,
        service.description,
        normalizeCategoryName(service.categories?.name),
      ].join(' ')

      return getCategoryMatchScore(searchText, initialSelectedCategories) > 0
    })
  }, [hasAssessmentFilter, initialSelectedCategories, services])

  const categoryTabs = hasAssessmentFilter ? matchedServiceCategories : categories

  const filteredServices = useMemo(() => {
    const servicePool = recommendedServices

    if (selectedCategory === 'all') {
      return servicePool
    }

    return servicePool.filter(
      (service) => normalizeCategoryName(service.categories?.name) === selectedCategory
    )
  }, [recommendedServices, selectedCategory])

  const selectedService = services.find((service) => service.id === selectedServiceId) ?? null
  const selectedDoctor = doctors.find((doctor) => doctor.id === selectedDoctorId) ?? null
  const selectedDateOption = dateOptions.find((option) => option.value === selectedDate) ?? null
  const matchedCategoryLabel = findBestCategoryMatch(
    matchedServiceCategories,
    initialSelectedCategories
  )

  const resultHref = initialAssessmentId
    ? `/result?assessment=${encodeURIComponent(initialAssessmentId)}`
    : '/check'

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

  const progressCount = [
    Boolean(selectedServiceId),
    Boolean(selectedDoctorId),
    Boolean(selectedDate && selectedTime),
    Boolean(fullName.trim() && phone.trim()),
  ].filter(Boolean).length

  const canSubmit =
    Boolean(selectedServiceId) &&
    Boolean(selectedDoctorId) &&
    Boolean(selectedDate) &&
    Boolean(selectedTime) &&
    Boolean(fullName.trim()) &&
    Boolean(phone.trim())

  const bookingSummaryItems = [
    {
      label: 'Үйлчилгээ',
      value: selectedService?.name ?? 'Сонгоогүй',
    },
    {
      label: 'Эмч',
      value: selectedDoctor?.full_name ?? 'Сонгоогүй',
    },
    {
      label: 'Хуваарь',
      value:
        selectedDateOption && selectedTime
          ? `${selectedDateOption.isoLabel} · ${selectedTime}`
          : 'Сонгоогүй',
    },
  ]

  function renderSummaryCard(className: string) {
    return (
      <div
        className={`${className} min-w-0 w-full overflow-hidden rounded-[2rem] border border-[#10233B] bg-[linear-gradient(180deg,#10233B_0%,#163456_100%)] p-5 text-white shadow-[0_24px_80px_rgba(16,35,59,0.28)] md:p-6`}
      >
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-100">
          Booking summary
        </p>
        <h2 className="mt-3 text-2xl font-black">Захиалгын хураангуй</h2>

        <div className="mt-5 space-y-4">
          {bookingSummaryItems.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-100/80">
                {item.label}
              </p>
              <p className="mt-2 break-words text-sm font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>

        {selectedService ? (
          <div className="mt-5 rounded-3xl bg-white px-4 py-4 text-[#10233B]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Үнэ</p>
            <p className="mt-2 text-3xl font-black text-[#1E63B5]">
              ₮{formatCurrency(selectedService.price)}
            </p>
            <p className="mt-1 text-sm text-[#5B6877]">
              {selectedService.duration_minutes} минут үргэлжилнэ
            </p>
          </div>
        ) : null}

        {selectedService?.preparation_notice ? (
          <div className="mt-5 rounded-3xl border border-[#FDE3C3] bg-[#FFFBF4] p-4 text-[#92400E]">
            <p className="text-xs font-bold uppercase tracking-wide text-[#B45309]">Бэлтгэл</p>
            <p className="mt-3 text-sm leading-7">{selectedService.preparation_notice}</p>
          </div>
        ) : null}
      </div>
    )
  }

  function renderContactCard(className: string) {
    return (
      <div className={`${className} min-w-0 w-full overflow-hidden rounded-[2rem] border border-[#E5E7EB] bg-white p-5 shadow-sm md:p-6`}>
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#1F2937]">
          <User size={14} />
          Алхам 4. Холбоо барих мэдээлэл
        </div>

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

        {error ? (
          <div className="mt-4 rounded-2xl border border-[#FFD7DC] bg-[#FFF4F5] px-4 py-3 text-sm text-[#D63045]">
            {error}
          </div>
        ) : null}

        <div className="mt-5">
          <Button fullWidth size="xl" loading={pending} onClick={handleSubmit}>
            Цаг захиалах
          </Button>
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs leading-6 text-[#6B7280]">
          <Shield size={14} className="mt-1 shrink-0 text-[#1E63B5]" />
          <span>{privacyText}</span>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (selectedServiceId && !filteredServices.some((service) => service.id === selectedServiceId)) {
      setSelectedServiceId('')
      setSelectedDoctorId('')
    }
  }, [filteredServices, selectedServiceId])

  useEffect(() => {
    if (!selectedDoctorId && availableDoctors.length === 1) {
      setSelectedDoctorId(availableDoctors[0].id)
    }

    if (
      selectedDoctorId &&
      !availableDoctors.some((doctor) => doctor.id === selectedDoctorId)
    ) {
      setSelectedDoctorId('')
    }
  }, [availableDoctors, selectedDoctorId])

  useEffect(() => {
    if (hasAssessmentFilter && selectedCategory === 'all') {
      setSelectedCategory(matchedCategoryLabel ?? matchedServiceCategories[0])
      return
    }

    if (selectedCategory !== 'all' && !categoryTabs.includes(selectedCategory)) {
      setSelectedCategory(hasAssessmentFilter ? (matchedCategoryLabel ?? matchedServiceCategories[0]) : 'all')
    }
  }, [
    categoryTabs,
    hasAssessmentFilter,
    matchedCategoryLabel,
    matchedServiceCategories,
    selectedCategory,
  ])

  function handleSubmit() {
    setError('')

    if (!canSubmit) {
      setError('Үйлчилгээ, эмч, өдөр, цаг болон холбоо барих мэдээллээ бүрэн сонгоно уу.')
      return
    }

    startTransition(async () => {
      const result = await submitAppointment({
        lead_id: initialLeadId,
        assessment_id: initialAssessmentId,
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
      <div className="min-h-screen bg-[#F7FAFF] px-4 py-16 md:py-20">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#E5E7EB] bg-white p-6 text-center shadow-[0_24px_80px_rgba(17,37,68,0.08)] md:p-10">
          <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-[#DCFCE7]">
            <CheckCircle2 size={34} className="text-[#16A34A]" />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.24em] text-[#16A34A]">
            Appointment received
          </p>
          <h1 className="mt-3 text-2xl font-black text-[#10233B] md:text-3xl">
            Цагийн хүсэлт амжилттай бүртгэгдлээ
          </h1>
          <p className="mt-4 text-sm leading-7 text-[#5B6877] md:text-base">
            Манай ажилтан {phone} дугаарт эргэн холбогдож, сонгосон өдөр цаг болон эмчийн
            уулзалтыг баталгаажуулна.
          </p>

          <div className="mt-8 grid gap-4 rounded-3xl border border-[#D8E6F6] bg-[#F7FAFF] p-5 text-left md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                Үйлчилгээ
              </p>
              <p className="mt-2 text-sm font-bold text-[#1F2937]">
                {selectedService?.name ?? 'Сонгоогүй'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Эмч</p>
              <p className="mt-2 text-sm font-bold text-[#1F2937]">
                {selectedDoctor?.full_name ?? 'Сонгоогүй'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Хуваарь</p>
              <p className="mt-2 text-sm font-bold text-[#1F2937]">
                {selectedDateOption?.isoLabel ?? selectedDate} {selectedTime}
              </p>
            </div>
          </div>

          {selectedService?.preparation_notice ? (
            <div className="mt-6 rounded-3xl border border-[#FDE3C3] bg-[#FFFBF4] p-5 text-left">
              <p className="text-xs font-bold uppercase tracking-wide text-[#B45309]">Бэлтгэл</p>
              <p className="mt-3 text-sm leading-7 text-[#92400E]">
                {selectedService.preparation_notice}
              </p>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl bg-[#1E63B5] px-6 py-3 text-sm font-bold text-white"
            >
              Нүүр хуудас руу буцах
            </Link>
            <Link
              href={resultHref}
              className="inline-flex items-center justify-center rounded-2xl border border-[#D8E6F6] bg-white px-6 py-3 text-sm font-bold text-[#1E63B5]"
            >
              Үр дүн рүү буцах
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7FAFF]">
      <FlowHeader
        title="Эмчийн цаг захиалах"
        backHref={resultHref}
        backLabel="Үр дүн"
        maxWidthClassName="max-w-6xl"
      />

      <main className="mx-auto max-w-6xl overflow-x-hidden px-4 pb-36 pt-4 md:pb-8 md:pt-6">
        <section className="min-w-0 overflow-hidden rounded-[1.75rem] border border-[#D8E6F6] bg-white p-4 shadow-[0_20px_70px_rgba(17,37,68,0.06)] md:rounded-[2rem] md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 space-y-3">
              <p className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#EFF6FF] px-4 py-2 text-xs font-bold tracking-[0.2em] text-[#1E63B5]">
                <Sparkles size={14} />
                MOBILE-FIRST BOOKING
              </p>
              <div className="min-w-0">
                <h1 className="text-2xl font-black text-[#10233B] md:text-3xl">
                  Танд тохирох эмчийн цагийг 2 минутанд сонгоно уу
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5B6877] md:text-base">
                  Үйлчилгээ, эмч, өдөр цаг, холбоо барих мэдээллээ сонгоход хангалттай. Үлдсэн
                  баталгаажуулалтыг манай баг шууд хийж өгнө.
                </p>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 rounded-3xl bg-[#F7FAFF] p-2 sm:grid-cols-4 lg:max-w-[26rem]">
              {[
                'Үйлчилгээ',
                'Эмч',
                'Хуваарь',
                'Холбоо барих',
              ].map((step, index) => (
                <div
                  key={step}
                  className={[
                    'rounded-2xl px-3 py-3 text-center',
                    index < progressCount ? 'bg-[#1E63B5] text-white' : 'bg-white text-[#6B7280]',
                  ].join(' ')}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Алхам {index + 1}</p>
                  <p className="mt-1 text-xs font-semibold md:text-sm">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {renderSummaryCard('mt-4 xl:hidden')}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <section className="min-w-0 overflow-hidden rounded-[2rem] border border-[#E5E7EB] bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
                    Алхам 1
                  </p>
                  <h2 className="mt-2 text-xl font-black text-[#10233B]">Үйлчилгээ сонгох</h2>
                  <p className="mt-2 text-sm leading-6 text-[#5B6877]">
                    Шинжилгээ эсвэл үзлэгийн төрлөө сонгоход тохирох эмч нар автоматаар шүүгдэнэ.
                  </p>
                </div>
              </div>

              {hasAssessmentFilter ? (
                <div className="mt-4 rounded-3xl border border-[#D8E6F6] bg-[#F7FAFF] px-4 py-3 text-sm leading-6 text-[#5B6877] break-words">
                  <span className="font-bold text-[#1E63B5]">Таны шалгалтын дагуу:</span>{' '}
                  {initialSelectedCategories.join(', ')} чиглэлтэй холбоотой оношилгоонуудыг
                  шүүж харуулж байна.
                </div>
              ) : null}

              <div className="mt-4 flex min-w-0 gap-2 overflow-x-auto pb-1">
                {categoryTabs.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={[
                      'shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition',
                      selectedCategory === category
                        ? 'border-[#1E63B5] bg-[#EAF3FF] text-[#1E63B5]'
                        : 'border-[#E5E7EB] bg-white text-[#6B7280]',
                    ].join(' ')}
                  >
                    {category === 'all' ? 'Бүх ангилал' : category}
                  </button>
                ))}
              </div>

              {filteredServices.length === 0 ? (
                <div className="mt-5 rounded-3xl border border-dashed border-[#D6E6FA] bg-[#F7FAFF] px-5 py-8 text-sm leading-7 text-[#5B6877]">
                  Сонгосон шүүлтэд тохирох үйлчилгээ алга байна. Өөр ангилал сонгох эсвэл
                  оффисоос баталгаажуулах урсгалаар үргэлжлүүлж болно.
                </div>
              ) : (
                <div className="mt-5 min-w-0 grid gap-3 md:grid-cols-2">
                  {filteredServices.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        setSelectedServiceId(service.id)
                        setSelectedDoctorId('')
                      }}
                      className={[
                        'w-full min-w-0 overflow-hidden rounded-3xl border-2 p-4 text-left transition',
                        selectedServiceId === service.id
                          ? 'border-[#1E63B5] bg-[#F7FAFF]'
                          : 'border-[#E5E7EB] bg-white hover:border-[#B8D5FB]',
                      ].join(' ')}
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                            {normalizeCategoryName(service.categories?.name)}
                          </p>
                          <h3 className="mt-2 break-words text-base font-black text-[#1F2937]">
                            {service.name}
                          </h3>
                        </div>
                        {service.promotion_flag ? (
                          <span className="shrink-0 rounded-full bg-[#FFF1F2] px-3 py-1 text-xs font-bold text-[#F23645]">
                            Онцлох
                          </span>
                        ) : null}
                      </div>
                      {service.description ? (
                        <p className="mt-3 break-words text-sm leading-6 text-[#5B6877]">
                          {service.description}
                        </p>
                      ) : null}
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-xs text-[#9CA3AF]">Үнэ</p>
                          <p className="mt-1 text-xl font-black text-[#1E63B5]">
                            ₮{formatCurrency(service.price)}
                          </p>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-xs text-[#9CA3AF]">Үргэлжлэх хугацаа</p>
                          <p className="mt-1 text-sm font-semibold text-[#1F2937]">
                            {service.duration_minutes} минут
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="min-w-0 overflow-hidden rounded-[2rem] border border-[#E5E7EB] bg-white p-5 shadow-sm md:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">Алхам 2</p>
              <h2 className="mt-2 text-xl font-black text-[#10233B]">Эмч сонгох</h2>
              <p className="mt-2 text-sm leading-6 text-[#5B6877]">
                {selectedService
                  ? `"${selectedService.name}" үйлчилгээтэй холбогдох эмч нар харагдаж байна.`
                  : 'Эхлээд үйлчилгээ сонгоход тохирох эмч нар энд гарч ирнэ.'}
              </p>

              {availableDoctors.length === 0 ? (
                <div className="mt-4 rounded-3xl border border-dashed border-[#D6E6FA] bg-[#F7FAFF] px-5 py-8 text-sm leading-7 text-[#5B6877]">
                  Сонгосон үйлчилгээтэй холбогдсон эмч одоогоор алга байна. Өөр үйлчилгээ сонгох
                  эсвэл оффисоос баталгаажуулах урсгалаар үргэлжлүүлж болно.
                </div>
              ) : (
                <div className="mt-5 min-w-0 grid gap-3 md:grid-cols-2">
                  {availableDoctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      type="button"
                      onClick={() => setSelectedDoctorId(doctor.id)}
                      className={[
                        'w-full min-w-0 overflow-hidden rounded-3xl border-2 p-4 text-left transition',
                        selectedDoctorId === doctor.id
                          ? 'border-[#1E63B5] bg-[#F7FAFF]'
                          : 'border-[#E5E7EB] bg-white hover:border-[#B8D5FB]',
                      ].join(' ')}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#D6E6FA]">
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
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#6B7280]">{doctor.title}</p>
                          <h3 className="mt-1 text-base font-black text-[#1F2937]">
                            {doctor.full_name}
                          </h3>
                          <p className="mt-1 text-sm text-[#5B6877]">{doctor.specialization}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#6B7280]">
                            <span className="rounded-full bg-white px-3 py-1">
                              {doctor.experience_years}+ жил
                            </span>
                            {doctor.schedule_summary ? (
                              <span className="rounded-full bg-white px-3 py-1">
                                {doctor.schedule_summary}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="min-w-0 overflow-hidden rounded-[2rem] border border-[#E5E7EB] bg-white p-5 shadow-sm md:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">Алхам 3</p>
              <h2 className="mt-2 text-xl font-black text-[#10233B]">Өдөр, цаг сонгох</h2>
              <p className="mt-2 text-sm leading-6 text-[#5B6877]">
                Тохирох өдрөө товшоод дараа нь цагийн слот сонгоно уу.
              </p>

              <div className="mt-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1F2937]">
                  <Calendar size={15} />
                  Ойрын 2 долоо хоногийн хуваарь
                </div>
                <div className="mt-3 flex min-w-0 gap-2 overflow-x-auto pb-1">
                  {dateOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedDate(option.value)}
                      className={[
                        'min-w-[96px] rounded-3xl border-2 px-3 py-4 text-center transition',
                        selectedDate === option.value
                          ? 'border-[#1E63B5] bg-[#EAF3FF]'
                          : 'border-[#E5E7EB] bg-white hover:border-[#B8D5FB]',
                      ].join(' ')}
                    >
                      <p className="text-xs font-semibold text-[#9CA3AF]">{option.weekday}</p>
                      <p className="mt-1 text-xl font-black text-[#1F2937]">{option.day}</p>
                      <p className="text-xs text-[#6B7280]">{option.month}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {TIME_GROUPS.map((group) => (
                  <div key={group.label}>
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#1F2937]">
                      <Clock size={15} />
                      {group.label}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                      {group.slots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          disabled={!selectedDate}
                          onClick={() => setSelectedTime(slot)}
                          className={[
                            'rounded-2xl border-2 px-3 py-3 text-sm font-semibold transition',
                            selectedTime === slot
                              ? 'border-[#1E63B5] bg-[#EAF3FF] text-[#1E63B5]'
                              : 'border-[#E5E7EB] bg-white text-[#1F2937]',
                            !selectedDate ? 'cursor-not-allowed opacity-50' : 'hover:border-[#B8D5FB]',
                          ].join(' ')}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {renderContactCard('xl:hidden')}
          </div>

          <aside className="hidden space-y-6 xl:sticky xl:top-6 xl:block xl:self-start">
            {renderSummaryCard('')}
            {renderContactCard('')}
          </aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D8E6F6] bg-white/95 px-4 py-3 shadow-[0_-10px_40px_rgba(17,37,68,0.12)] backdrop-blur xl:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
              Захиалгын төлөв
            </p>
            <p className="truncate text-sm font-bold text-[#1F2937]">
              {selectedService?.name ?? 'Үйлчилгээ сонгоно уу'}
            </p>
            <p className="truncate text-xs text-[#6B7280]">
              {selectedDoctor?.full_name ?? 'Эмч'} · {selectedDateOption?.day ?? '--'} /{' '}
              {selectedTime || '--:--'}
            </p>
          </div>
          <Button size="lg" className="shrink-0" onClick={handleSubmit} loading={pending} disabled={!canSubmit}>
            Цаг захиалах
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}

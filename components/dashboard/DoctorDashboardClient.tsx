'use client'

import { useEffect, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageSquare,
  PhoneCall,
  Send,
  ShieldAlert,
  Stethoscope,
} from 'lucide-react'
import { submitDoctorConsultationResponse } from '@/app/dashboard/doctor/actions'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

interface Viewer {
  id: string
  full_name: string | null
  email: string
}

interface ConsultationResponse {
  id?: string
  doctor_id: string
  response_text: string
  created_at: string
}

interface Consultation {
  id: string
  lead_id: string
  preferred_callback_time: 'morning' | 'afternoon' | 'evening'
  question: string | null
  status: 'new' | 'assigned' | 'answered' | 'called' | 'closed'
  assigned_doctor_id?: string | null
  created_at: string
  leads?: {
    full_name: string
    phone: string
    risk_level: 'low' | 'medium' | 'high' | null
    source?: string | null
  }
  doctor_responses?: ConsultationResponse[]
}

const timeLabels = {
  morning: 'Өглөө',
  afternoon: 'Үдээс хойш',
  evening: 'Орой',
} as const

const statusColors = {
  new: 'red',
  assigned: 'yellow',
  answered: 'green',
  called: 'blue',
  closed: 'gray',
} as const

const statusLabels = {
  new: 'Шинэ',
  assigned: 'Оноосон',
  answered: 'Хариулсан',
  called: 'Залгасан',
  closed: 'Хаасан',
} as const

const riskLabels = {
  low: 'Бага',
  medium: 'Дунд',
  high: 'Өндөр',
} as const

const riskColors = {
  low: 'green',
  medium: 'yellow',
  high: 'red',
} as const

const workflowSurfaceClasses = {
  new: 'border-[#F9D2D6] bg-[#FFF7F8] text-[#C2253D]',
  assigned: 'border-[#FDE9B6] bg-[#FFFBF1] text-[#B45309]',
  answered: 'border-[#CDEDD8] bg-[#F5FCF8] text-[#166534]',
  called: 'border-[#D6E6FA] bg-[#F7FAFF] text-[#1E63B5]',
  closed: 'border-[#E5E7EB] bg-[#F8FAFC] text-[#4B5563]',
} as const

function getConsultationWorkflow(
  consultation: Consultation,
  doctorId: string | null
): { label: string; description: string } {
  const respondedByMe = (consultation.doctor_responses ?? []).some(
    (doctorResponse) => doctorResponse.doctor_id === doctorId
  )

  if (consultation.status === 'assigned') {
    return {
      label: 'Одоо мэргэжлийн зөвлөгөө бичнэ',
      description:
        'Хариулт илгээсний дараа operator үйлчлүүлэгч рүү утсаар дамжуулна. Гол зөвлөмжөө товч, ойлгомжтой оруулна.',
    }
  }

  if (consultation.status === 'answered') {
    return {
      label: respondedByMe ? 'Миний хариулт operator руу шилжсэн' : 'Эмчийн хариулт бүртгэгдсэн',
      description:
        'Одоогоор эмчийн шат дууссан. Хэрэв нэмэлт асуулт гарвал өмнөх хариултаа шалгаад тайлбар нэмж болно.',
    }
  }

  if (consultation.status === 'called') {
    return {
      label: 'Operator холбогдсон',
      description:
        'Үйлчлүүлэгчтэй холбоо тогтсон байна. Кейсийн нэмэлт тайлбар хэрэгтэй эсэхийг өмнөх response-оос шалгана.',
    }
  }

  if (consultation.status === 'closed') {
    return {
      label: 'Кейс хаагдсан',
      description: 'Энэ consultation идэвхтэй урсгалгүй болсон. Хуучин хариултуудаа лавлах хэлбэрээр ашиглаж болно.',
    }
  }

  return {
    label: 'Шинэ хүсэлт',
    description: 'Дэлгэрэнгүйг нээгээд асуултыг уншин, шаардлагатай бол богино зөвлөгөө өгнө.',
  }
}

export default function DoctorDashboardClient({ viewer }: { viewer: Viewer }) {
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [doctorLabel, setDoctorLabel] = useState<string>(viewer.full_name ?? viewer.email)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [selected, setSelected] = useState<Consultation | null>(null)
  const [response, setResponse] = useState('')
  const [filter, setFilter] = useState<'all' | Consultation['status']>('all')
  const [loading, setLoading] = useState(false)
  const [booting, setBooting] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setBooting(true)
      setError(null)

      const supabase = createClient()
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id, full_name, specialization')
        .eq('profile_id', viewer.id)
        .maybeSingle()

      if (!active) {
        return
      }

      if (doctorError) {
        setError(doctorError.message)
        setConsultations([])
        setSelected(null)
        setDoctorId(null)
        setBooting(false)
        return
      }

      if (!doctor) {
        setDoctorId(null)
        setConsultations([])
        setSelected(null)
        setBooting(false)
        return
      }

      setDoctorId(doctor.id)
      setDoctorLabel(doctor.full_name || viewer.full_name || viewer.email)

      const enhancedQuery = await supabase
        .from('consultation_requests')
        .select(
          'id, lead_id, preferred_callback_time, question, status, assigned_doctor_id, created_at, leads(full_name, phone, risk_level, source), doctor_responses(id, doctor_id, response_text, created_at)'
        )
        .order('created_at', { ascending: false })

      const { data, error: consultationError } = enhancedQuery.error
        ? await supabase
            .from('consultation_requests')
            .select(
              'id, lead_id, preferred_callback_time, question, status, created_at, leads(full_name, phone, risk_level, source), doctor_responses(id, doctor_id, response_text, created_at)'
            )
            .order('created_at', { ascending: false })
        : enhancedQuery

      if (!active) {
        return
      }

      if (consultationError) {
        setError(consultationError.message)
        setConsultations([])
        setSelected(null)
        setBooting(false)
        return
      }

      const normalizedConsultations = ((data ?? []) as Array<
        Consultation & {
          leads?: Consultation['leads'] | Consultation['leads'][]
          doctor_responses?: ConsultationResponse[]
        }
      >).map((consultation) => ({
        ...consultation,
        leads: Array.isArray(consultation.leads)
          ? consultation.leads[0]
          : consultation.leads,
        doctor_responses: Array.isArray(consultation.doctor_responses)
          ? consultation.doctor_responses
          : [],
      }))

      const supportsAssignment = normalizedConsultations.some(
        (consultation) => 'assigned_doctor_id' in consultation
      )

      const scopedConsultations = normalizedConsultations.filter((consultation) => {
        if (consultation.leads?.source === 'organization_consultation_request') {
          return false
        }

        if (supportsAssignment) {
          return (
            consultation.assigned_doctor_id === doctor.id ||
            (consultation.doctor_responses ?? []).some(
              (doctorResponse) => doctorResponse.doctor_id === doctor.id
            )
          )
        }

        if (consultation.status === 'new') {
          return true
        }

        return (consultation.doctor_responses ?? []).some(
          (doctorResponse) => doctorResponse.doctor_id === doctor.id
        )
      })

      setConsultations(scopedConsultations)
      setSelected((current) =>
        current
          ? scopedConsultations.find((consultation) => consultation.id === current.id) ?? null
          : null
      )
      setBooting(false)
    }

    void loadDashboard()

    return () => {
      active = false
    }
  }, [viewer.email, viewer.full_name, viewer.id])

  const displayed =
    filter === 'all'
      ? consultations
      : consultations.filter((consultation) => consultation.status === filter)

  useEffect(() => {
    if (displayed.length === 0) {
      setSelected(null)
      return
    }

    setSelected((current) => {
      if (!current) {
        return displayed[0]
      }

      return displayed.find((consultation) => consultation.id === current.id) ?? displayed[0]
    })
  }, [displayed])

  useEffect(() => {
    setResponse('')
  }, [selected?.id])

  const stats = {
    total: consultations.length,
    new: consultations.filter((consultation) => consultation.status === 'new').length,
    assigned: consultations.filter((consultation) => consultation.status === 'assigned').length,
    answered: consultations.filter((consultation) => consultation.status === 'answered').length,
    mine: consultations.filter((consultation) =>
      (consultation.doctor_responses ?? []).some((doctorResponse) => doctorResponse.doctor_id === doctorId)
    ).length,
  }

  const filterOptions = [
    { value: 'all', label: 'Бүгд', count: consultations.length },
    { value: 'assigned', label: statusLabels.assigned, count: stats.assigned },
    { value: 'answered', label: statusLabels.answered, count: stats.answered },
    {
      value: 'called',
      label: statusLabels.called,
      count: consultations.filter((consultation) => consultation.status === 'called').length,
    },
    {
      value: 'closed',
      label: statusLabels.closed,
      count: consultations.filter((consultation) => consultation.status === 'closed').length,
    },
  ] as const

  const selectedWorkflow = selected ? getConsultationWorkflow(selected, doctorId) : null
  const selectedResponseCount = selected?.doctor_responses?.length ?? 0

  async function submitResponse() {
    if (!selected || !doctorId || !response.trim()) {
      return
    }

    setLoading(true)
    setError(null)

    const responseText = response.trim()
    const result = await submitDoctorConsultationResponse(selected.id, responseText)

    if (!result.ok) {
      setError(result.error)
      setLoading(false)
      return
    }

    const newResponse: ConsultationResponse = {
      id: result.data?.response_id,
      doctor_id: result.data?.doctor_id ?? doctorId,
      response_text: result.data?.response_text ?? responseText,
      created_at: result.data?.created_at ?? new Date().toISOString(),
    }

    setConsultations((current) =>
      current.map((consultation) =>
        consultation.id === selected.id
          ? {
              ...consultation,
              status: 'answered',
              doctor_responses: [...(consultation.doctor_responses ?? []), newResponse],
            }
          : consultation
      )
    )
    setSelected((current) =>
      current
        ? {
            ...current,
            status: 'answered',
            doctor_responses: [...(current.doctor_responses ?? []), newResponse],
          }
        : null
    )
    setResponse('')
    setLoading(false)
  }

  if (booting) {
    return <div className="p-6 text-sm text-[#6B7280]">Doctor CRM ачаалж байна...</div>
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="rounded-[32px] border border-[#D8E6F6] bg-[linear-gradient(135deg,#ffffff_0%,#f7faff_68%,#eef5ff_100%)] p-5 shadow-[0_20px_70px_rgba(17,37,68,0.06)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1E63B5]">
              Doctor CRM
            </p>
            <div>
              <h1 className="text-2xl font-black text-[#10233B] md:text-3xl">
                Эмчийн зөвлөгөөний самбар
              </h1>
              <p className="mt-2 text-sm leading-7 text-[#5B6877]">
                {doctorLabel} эмчид оноогдсон өвчтөний consultation хүсэлтүүд болон таны өмнө нь хариулсан кейсүүд энд харагдана.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#D6E6FA] bg-white/80 px-4 py-3 backdrop-blur">
              <p className="text-xs font-semibold text-[#6B7280]">Харагдах хүсэлт</p>
              <p className="mt-1 text-2xl font-black text-[#1E63B5]">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-[#FDE9B6] bg-white/80 px-4 py-3 backdrop-blur">
              <p className="text-xs font-semibold text-[#6B7280]">Хариу хүлээж буй</p>
              <p className="mt-1 text-2xl font-black text-[#D97706]">{stats.assigned}</p>
            </div>
            <div className="rounded-2xl border border-[#FAD7DC] bg-white/80 px-4 py-3 backdrop-blur">
              <p className="text-xs font-semibold text-[#6B7280]">Шинэ асуулт</p>
              <p className="mt-1 text-2xl font-black text-[#F23645]">{stats.new}</p>
            </div>
            <div className="rounded-2xl border border-[#CDEDD8] bg-white/80 px-4 py-3 backdrop-blur">
              <p className="text-xs font-semibold text-[#6B7280]">Миний хариулсан</p>
              <p className="mt-1 text-2xl font-black text-[#16A34A]">{stats.mine}</p>
            </div>
          </div>
        </div>
      </div>

      {doctorId ? (
        <div className="rounded-2xl border border-[#D6E6FA] bg-[#F7FAFF] px-4 py-3 text-sm text-[#1E63B5]">
          {stats.assigned > 0
            ? `${stats.assigned} кейс дээр таны мэргэжлийн зөвлөгөө хүлээгдэж байна. Эхлээд assigned төлөвтэй кейсүүдэд хариу өгөөд, дараа нь answered кейсээ review хийж болно.`
            : 'Одоогоор шинэ assigned кейс алга. Өмнөх хариултуудаа лавлаж, шаардлагатай бол асуултын түүхээ нягталж болно.'}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-[#FFD7DC] bg-[#FFF4F5] px-4 py-3 text-sm text-[#D63045]">
          {error}
        </div>
      ) : null}

      {!doctorId ? (
        <div className="rounded-3xl border border-[#F9D2D6] bg-white p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF1F2] text-[#F23645]">
            <ShieldAlert size={26} />
          </div>
          <h2 className="mt-4 text-xl font-black text-[#10233B]">
            Эмчийн account холбогдоогүй байна
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#5B6877]">
            Таны нэвтрэлт doctor profile-той холбогдоогүй тул consultation CRM харах боломжгүй байна. Super admin хэсэгт орж тухайн эмч дээр login и-мэйл, нууц үгийг тохируулна уу.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_28rem]">
          <div className="min-w-0 space-y-4">
            <div className="rounded-[28px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFilter(option.value)}
                    className={[
                      'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition',
                      filter === option.value
                        ? 'bg-[#1E63B5] text-white'
                        : 'bg-[#F7FAFF] text-[#6B7280] hover:bg-[#EAF3FF]',
                    ].join(' ')}
                  >
                    <span>{option.label}</span>
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-[11px]',
                        filter === option.value ? 'bg-white/20 text-white' : 'bg-white text-[#1E63B5]',
                      ].join(' ')}
                    >
                      {option.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {displayed.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#D1D5DB] bg-[#FAFBFD] px-6 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF3FF] text-[#1E63B5]">
                    <Stethoscope size={22} />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[#1F2937]">Хүсэлт алга</h3>
                  <p className="mt-2 text-sm text-[#6B7280]">
                    Сонгосон шүүлтүүрт тохирох consultation хүсэлт одоогоор алга байна.
                  </p>
                </div>
              ) : (
                displayed.map((consultation) => {
                  const respondedByMe = (consultation.doctor_responses ?? []).some(
                    (doctorResponse) => doctorResponse.doctor_id === doctorId
                  )
                  const workflow = getConsultationWorkflow(consultation, doctorId)

                  return (
                    <button
                      key={consultation.id}
                      type="button"
                      onClick={() => setSelected(consultation)}
                      className={[
                        'block w-full rounded-[28px] border-2 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(17,37,68,0.08)]',
                        selected?.id === consultation.id
                          ? 'border-[#1E63B5] bg-[#F7FAFF]'
                          : 'border-[#E5E7EB]',
                      ].join(' ')}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-bold text-[#1F2937]">
                                {consultation.leads?.full_name ?? 'Нэргүй lead'}
                              </p>
                              <Badge color={statusColors[consultation.status]}>
                                {statusLabels[consultation.status]}
                              </Badge>
                              {consultation.leads?.risk_level ? (
                                <Badge color={riskColors[consultation.leads.risk_level]}>
                                  {riskLabels[consultation.leads.risk_level]}
                                </Badge>
                              ) : null}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B7280]">
                              <span className="inline-flex items-center gap-1">
                                <Clock size={12} />
                                {timeLabels[consultation.preferred_callback_time]}
                              </span>
                              <span>{new Date(consultation.created_at).toLocaleString('mn-MN')}</span>
                              <span>{consultation.leads?.phone}</span>
                            </div>

                            {consultation.question ? (
                              <p className="line-clamp-2 text-sm leading-7 text-[#5B6877]">
                                {consultation.question}
                              </p>
                            ) : (
                              <p className="text-sm text-[#9CA3AF]">Асуулт оруулаагүй хүсэлт.</p>
                            )}
                          </div>

                          <div className="text-xs font-semibold text-[#6B7280]">
                            {respondedByMe ? 'Миний өмнөх хариулттай' : 'Шинэ үнэлгээ шаардлагатай'}
                          </div>
                        </div>

                        <div
                          className={`rounded-2xl border px-4 py-3 ${workflowSurfaceClasses[consultation.status]}`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-70">
                                Дараагийн алхам
                              </p>
                              <p className="mt-2 text-sm font-bold">{workflow.label}</p>
                              <p className="mt-1 text-sm leading-6 opacity-90">
                                {workflow.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold">
                              <span className="rounded-full bg-white/80 px-3 py-1 text-[#475569]">
                                Хариулт: {consultation.doctor_responses?.length ?? 0}
                              </span>
                              <ArrowRight size={14} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div className="xl:w-[28rem]">
            {selected ? (
              <div className="sticky top-6 rounded-[28px] border border-[#E5E7EB] bg-white p-5 shadow-[0_20px_60px_rgba(17,37,68,0.06)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-[#10233B]">
                      {selected.leads?.full_name ?? 'Нэргүй lead'}
                    </h2>
                    <p className="mt-1 text-sm text-[#6B7280]">{selected.leads?.phone}</p>
                  </div>
                  <Badge color={statusColors[selected.status]}>{statusLabels[selected.status]}</Badge>
                </div>

                {selectedWorkflow ? (
                  <div
                    className={`mt-5 rounded-[24px] border px-4 py-4 ${workflowSurfaceClasses[selected.status]}`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-70">
                      Одоогийн фокус
                    </p>
                    <p className="mt-2 text-base font-bold">{selectedWorkflow.label}</p>
                    <p className="mt-1 text-sm leading-6 opacity-90">
                      {selectedWorkflow.description}
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#F7FAFF] p-3">
                    <p className="text-xs font-semibold text-[#6B7280]">Дуудлага хийх цаг</p>
                    <p className="mt-1 text-sm font-bold text-[#1F2937]">
                      {timeLabels[selected.preferred_callback_time]}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#F7FAFF] p-3">
                    <p className="text-xs font-semibold text-[#6B7280]">Эрсдэлийн түвшин</p>
                    <p className="mt-1 text-sm font-bold text-[#1F2937]">
                      {selected.leads?.risk_level
                        ? riskLabels[selected.leads.risk_level]
                        : 'Тооцоогүй'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[#EAF1F8] bg-[#F7FAFF] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                      <PhoneCall size={12} />
                      Operator-д дамжуулахад
                    </div>
                    <span className="text-xs font-semibold text-[#1E63B5]">
                      Хариулт: {selectedResponseCount}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#1F2937]">
                    {selected.status === 'assigned'
                      ? 'Зөвлөгөөг илгээсний дараа operator утсаар үйлчлүүлэгчид дамжуулна.'
                      : 'Энэ кейсийн дараагийн алхам operator болон CRM follow-up урсгалаар үргэлжилнэ.'}
                  </p>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                    <MessageSquare size={12} />
                    Өвчтөний асуулт
                  </div>
                  <div className="rounded-2xl bg-[#F7FAFF] p-4 text-sm leading-7 text-[#1F2937]">
                    {selected.question || 'Тайлбар оруулаагүй consultation хүсэлт.'}
                  </div>
                </div>

                {selectedResponseCount > 0 ? (
                  <div className="mt-5 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                      Өмнөх эмчийн хариултууд
                    </p>
                    {selected.doctor_responses?.map((doctorResponse, index) => (
                      <div
                        key={doctorResponse.id ?? `${doctorResponse.created_at}-${index}`}
                        className="rounded-2xl border border-[#CDEDD8] bg-[#F5FCF8] p-4"
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#15803D]">
                          <CheckCircle2 size={12} />
                          {doctorResponse.doctor_id === doctorId
                            ? 'Миний хариулт'
                            : 'Бусад эмчийн хариулт'}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-[#166534]">
                          {doctorResponse.response_text}
                        </p>
                        <p className="mt-2 text-xs text-[#4B5563]">
                          {new Date(doctorResponse.created_at).toLocaleString('mn-MN')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {selected.status === 'assigned' ? (
                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                        Мэргэжлийн хариулт
                      </p>
                      <span className="text-xs text-[#9CA3AF]">{response.trim().length} тэмдэгт</span>
                    </div>
                    <div className="mt-2 rounded-2xl border border-[#EAF1F8] bg-[#F7FAFF] p-3 text-xs leading-6 text-[#5B6877]">
                      Товч оношилгооны чиглэл, аль шинжилгээ эсвэл эмчид хандахыг, мөн яаралтай эсэхийг ойлгомжтой бичвэл operator утсаар дамжуулахад илүү амар болно.
                    </div>
                    <textarea
                      value={response}
                      onChange={(event) => setResponse(event.target.value)}
                      rows={7}
                      placeholder="Шинжилгээ, оношилгоо эсвэл эмчид хандах зөвлөмжөө бичнэ үү..."
                      className="mt-3 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm text-[#1F2937] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                    />
                    <div className="mt-3">
                      <Button
                        fullWidth
                        loading={loading}
                        disabled={!response.trim()}
                        onClick={submitResponse}
                      >
                        <Send size={14} />
                        Хариулт илгээх
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-[#D1D5DB] bg-white px-6 py-12 text-center">
                <h3 className="text-lg font-bold text-[#1F2937]">Consultation сонгоно уу</h3>
                <p className="mt-2 text-sm text-[#6B7280]">
                  Зүүн жагсаалтаас хүсэлт сонгоод дэлгэрэнгүй асуултыг уншиж хариулт бичнэ.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

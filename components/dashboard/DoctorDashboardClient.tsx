'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, MessageSquare, Send, ShieldAlert, Stethoscope } from 'lucide-react'
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
          'id, lead_id, preferred_callback_time, question, status, assigned_doctor_id, created_at, leads(full_name, phone, risk_level), doctor_responses(id, doctor_id, response_text, created_at)'
        )
        .order('created_at', { ascending: false })

      const { data, error: consultationError } = enhancedQuery.error
        ? await supabase
            .from('consultation_requests')
            .select(
              'id, lead_id, preferred_callback_time, question, status, created_at, leads(full_name, phone, risk_level), doctor_responses(id, doctor_id, response_text, created_at)'
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
        current ? scopedConsultations.find((consultation) => consultation.id === current.id) ?? null : null
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

  const stats = {
    total: consultations.length,
    new: consultations.filter((consultation) => consultation.status === 'new').length,
    mine: consultations.filter((consultation) =>
      (consultation.doctor_responses ?? []).some((doctorResponse) => doctorResponse.doctor_id === doctorId)
    ).length,
  }

  async function submitResponse() {
    if (!selected || !doctorId || !response.trim()) {
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const responseText = response.trim()

    const { error: insertError } = await supabase.from('doctor_responses').insert({
      consultation_id: selected.id,
      doctor_id: doctorId,
      response_text: responseText,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from('consultation_requests')
      .update({ status: 'answered' })
      .eq('id', selected.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    const newResponse: ConsultationResponse = {
      doctor_id: doctorId,
      response_text: responseText,
      created_at: new Date().toISOString(),
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
    <div className="space-y-6 p-6">
      <div className="rounded-3xl border border-[#D8E6F6] bg-white p-5 shadow-[0_20px_70px_rgba(17,37,68,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1E63B5]">
              Doctor CRM
            </p>
            <div>
              <h1 className="text-2xl font-black text-[#10233B]">Эмчийн зөвлөгөөний самбар</h1>
              <p className="mt-2 text-sm leading-7 text-[#5B6877]">
                {doctorLabel} эмчийн хувьд шинэ зөвлөгөөний хүсэлтүүд болон өөрийн өмнө
                хариулсан кейсүүд энд харагдана.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-[#D6E6FA] bg-[#F7FAFF] px-4 py-3">
              <p className="text-xs font-semibold text-[#6B7280]">Харагдах хүсэлт</p>
              <p className="mt-1 text-2xl font-black text-[#1E63B5]">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-[#FAD7DC] bg-[#FFF7F8] px-4 py-3">
              <p className="text-xs font-semibold text-[#6B7280]">Шинэ асуулт</p>
              <p className="mt-1 text-2xl font-black text-[#F23645]">{stats.new}</p>
            </div>
            <div className="rounded-2xl border border-[#CDEDD8] bg-[#F5FCF8] px-4 py-3">
              <p className="text-xs font-semibold text-[#6B7280]">Миний хариулсан</p>
              <p className="mt-1 text-2xl font-black text-[#16A34A]">{stats.mine}</p>
            </div>
          </div>
        </div>
      </div>

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
          <h2 className="mt-4 text-xl font-black text-[#10233B]">Эмчийн account холбогдоогүй байна</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#5B6877]">
            Таны нэвтрэлт doctor profile-той холбогдоогүй тул consultation CRM харах боломжгүй
            байна. Super admin хэсэгт орж тухайн эмч дээр login и-мэйл, нууц үгийг тохируулна уу.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 xl:flex-row">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-3">
              <div className="flex flex-wrap gap-2">
                {(['all', 'new', 'assigned', 'answered', 'called', 'closed'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFilter(status)}
                    className={[
                      'rounded-xl px-3 py-2 text-xs font-semibold transition',
                      filter === status
                        ? 'bg-[#1E63B5] text-white'
                        : 'bg-[#F7FAFF] text-[#6B7280] hover:bg-[#EAF3FF]',
                    ].join(' ')}
                  >
                    {status === 'all' ? 'Бүгд' : statusLabels[status]}
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

                  return (
                    <button
                      key={consultation.id}
                      type="button"
                      onClick={() => {
                        setSelected(consultation)
                        setResponse('')
                      }}
                      className={[
                        'block w-full rounded-3xl border-2 bg-white p-5 text-left transition hover:shadow-sm',
                        selected?.id === consultation.id
                          ? 'border-[#1E63B5]'
                          : 'border-[#E5E7EB]',
                      ].join(' ')}
                    >
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
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div className="xl:w-[26rem]">
            {selected ? (
              <div className="sticky top-6 rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-[0_20px_60px_rgba(17,37,68,0.06)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-[#10233B]">
                      {selected.leads?.full_name ?? 'Нэргүй lead'}
                    </h2>
                    <p className="mt-1 text-sm text-[#6B7280]">{selected.leads?.phone}</p>
                  </div>
                  <Badge color={statusColors[selected.status]}>{statusLabels[selected.status]}</Badge>
                </div>

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

                <div className="mt-5">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                    <MessageSquare size={12} />
                    Өвчтөний асуулт
                  </div>
                  <div className="rounded-2xl bg-[#F7FAFF] p-4 text-sm leading-7 text-[#1F2937]">
                    {selected.question || 'Тайлбар оруулаагүй consultation хүсэлт.'}
                  </div>
                </div>

                {(selected.doctor_responses ?? []).length > 0 ? (
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
                          {doctorResponse.doctor_id === doctorId ? 'Миний хариулт' : 'Бусад эмчийн хариулт'}
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

                {selected.status === 'new' || selected.status === 'assigned' ? (
                  <div className="mt-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                      Мэргэжлийн хариулт
                    </p>
                    <textarea
                      value={response}
                      onChange={(event) => setResponse(event.target.value)}
                      rows={6}
                      placeholder="Шинжилгээ, оношилгоо эсвэл эмчид хандах зөвлөмжөө бичнэ үү..."
                      className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm text-[#1F2937] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
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

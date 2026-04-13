'use client'

import { useMemo, useState } from 'react'
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
import { submitDoctorResponse } from '@/app/dashboard/doctor/actions'
import DoctorAppointmentsBoard from '@/components/dashboard/DoctorAppointmentsBoard'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatDateTimeInUlaanbaatar } from '@/lib/admin/date-format'
import type {
  DoctorConsultation,
  DoctorDashboardData,
} from '@/components/dashboard/doctor-dashboard-types'

const timeLabels = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
} as const

const statusColors = {
  new: 'red',
  assigned: 'yellow',
  answered: 'green',
  called: 'blue',
  closed: 'gray',
} as const

const statusLabels = {
  new: 'New',
  assigned: 'Assigned',
  answered: 'Answered',
  called: 'Called',
  closed: 'Closed',
} as const

const riskLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
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
  consultation: DoctorConsultation,
  doctorId: string | null
): { label: string; description: string } {
  const respondedByMe = (consultation.doctor_responses ?? []).some(
    (doctorResponse) => doctorResponse.doctor_id === doctorId
  )

  if (consultation.status === 'assigned') {
    return {
      label: 'Write the doctor response',
      description:
        'Add a concise recommendation so the operator can call the patient with the next step.',
    }
  }

  if (consultation.status === 'answered') {
    return {
      label: respondedByMe ? 'Your response is recorded' : 'Doctor response recorded',
      description:
        'The doctor step is complete. Add another note only if there is a new medical clarification.',
    }
  }

  if (consultation.status === 'called') {
    return {
      label: 'Operator follow-up completed',
      description:
        'The patient has already been contacted. Review prior advice if a new question comes back.',
    }
  }

  if (consultation.status === 'closed') {
    return {
      label: 'Consultation closed',
      description: 'This case is no longer active and remains available only as history.',
    }
  }

  return {
    label: 'New consultation',
    description: 'Review the patient question and add the medical recommendation if needed.',
  }
}

export default function DoctorDashboardClient({
  initialDashboard,
}: {
  initialDashboard: DoctorDashboardData
}) {
  const [consultations, setConsultations] = useState(initialDashboard.consultations)
  const [selectedId, setSelectedId] = useState<string | null>(
    initialDashboard.consultations[0]?.id ?? null
  )
  const [response, setResponse] = useState('')
  const [filter, setFilter] = useState<'all' | DoctorConsultation['status']>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialDashboard.error)

  const displayed = useMemo(() => {
    return consultations.filter((consultation) =>
      filter === 'all' ? true : consultation.status === filter
    )
  }, [consultations, filter])

  const selected = useMemo(() => {
    if (displayed.length === 0) {
      return null
    }

    return displayed.find((consultation) => consultation.id === selectedId) ?? displayed[0]
  }, [displayed, selectedId])

  const selectedWorkflow = selected
    ? getConsultationWorkflow(selected, initialDashboard.doctorId)
    : null

  async function handleSubmitResponse() {
    if (!selected || !initialDashboard.doctorId || !response.trim()) {
      return
    }

    setLoading(true)
    setError(null)

    const result = await submitDoctorResponse(
      selected.id,
      initialDashboard.doctorId,
      response.trim()
    )

    setLoading(false)

    if (!result.ok) {
      setError(result.error ?? 'Failed to save doctor response.')
      return
    }

    const createdAt = new Date().toISOString()
    const doctorId = initialDashboard.doctorId

    if (!doctorId) {
      setError('Doctor profile not found.')
      return
    }

    setConsultations((current) =>
      current.map((consultation) =>
        consultation.id === selected.id
          ? {
              ...consultation,
              status: 'answered',
              doctor_responses: [
                {
                  id: `${consultation.id}-${createdAt}`,
                  doctor_id: doctorId,
                  response_text: response.trim(),
                  created_at: createdAt,
                },
                ...(consultation.doctor_responses ?? []),
              ],
            }
          : consultation
      )
    )
    setResponse('')
  }

  const filterOptions = [
    { value: 'all' as const, label: 'All', count: consultations.length },
    {
      value: 'assigned' as const,
      label: 'Assigned',
      count: consultations.filter((consultation) => consultation.status === 'assigned').length,
    },
    {
      value: 'answered' as const,
      label: 'Answered',
      count: consultations.filter((consultation) => consultation.status === 'answered').length,
    },
    {
      value: 'called' as const,
      label: 'Called',
      count: consultations.filter((consultation) => consultation.status === 'called').length,
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <section className="rounded-[32px] border border-[#D8E6F6] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
              Doctor Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#10233B]">
              {initialDashboard.doctorLabel}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5B6877]">
              Review assigned consultations and upcoming appointments from one place.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#E5EDF7] bg-[#FBFDFF] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A98A8]">
                Consultations
              </p>
              <p className="mt-2 text-2xl font-black text-[#10233B]">{consultations.length}</p>
            </div>
            <div className="rounded-2xl border border-[#DFF3E7] bg-[#F6FCF8] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6D8E7B]">
                Upcoming appointments
              </p>
              <p className="mt-2 text-2xl font-black text-[#16A34A]">
                {initialDashboard.appointments.length}
              </p>
            </div>
            <div className="rounded-2xl border border-[#FDE9B6] bg-[#FFFBF1] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8D7A45]">
                Waiting response
              </p>
              <p className="mt-2 text-2xl font-black text-[#D97706]">
                {consultations.filter((consultation) => consultation.status === 'assigned').length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-[#F9D2D6] bg-[#FFF7F8] px-4 py-3 text-sm text-[#C2253D]">
          {error}
        </div>
      ) : null}

      <DoctorAppointmentsBoard appointments={initialDashboard.appointments} />

      {!initialDashboard.doctorId ? (
        <div className="rounded-3xl border border-dashed border-[#D1D5DB] bg-white px-6 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF7F8] text-[#C2253D]">
            <ShieldAlert size={22} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-[#1F2937]">Doctor profile not linked</h2>
          <p className="mt-2 text-sm text-[#6B7280]">
            This account does not have a linked doctor record yet, so no consultations or
            appointments can be shown.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_28rem]">
          <div className="rounded-[28px] border border-[#E5E7EB] bg-white p-5 shadow-[0_20px_60px_rgba(17,37,68,0.06)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
                  Consultations
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#10233B]">
                  Assigned patient questions
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFilter(option.value)}
                    className={[
                      'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition',
                      filter === option.value
                        ? 'border-[#1E63B5] bg-[#1E63B5] text-white'
                        : 'border-[#D6E6FA] bg-[#F7FAFF] text-[#1E63B5] hover:bg-[#EAF3FF]',
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

            <div className="mt-5 space-y-3">
              {displayed.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#D1D5DB] bg-[#FAFBFD] px-6 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF3FF] text-[#1E63B5]">
                    <Stethoscope size={22} />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[#1F2937]">No consultations</h3>
                  <p className="mt-2 text-sm text-[#6B7280]">
                    There are no consultation requests in the current filter.
                  </p>
                </div>
              ) : (
                displayed.map((consultation) => {
                  const respondedByMe = (consultation.doctor_responses ?? []).some(
                    (doctorResponse) => doctorResponse.doctor_id === initialDashboard.doctorId
                  )
                  const workflow = getConsultationWorkflow(
                    consultation,
                    initialDashboard.doctorId
                  )

                  return (
                    <button
                      key={consultation.id}
                      type="button"
                      onClick={() => setSelectedId(consultation.id)}
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
                                {consultation.leads?.full_name ?? 'Unnamed lead'}
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
                              <span>{formatDateTimeInUlaanbaatar(consultation.created_at)}</span>
                              <span>{consultation.leads?.phone}</span>
                            </div>

                            <p className="line-clamp-2 text-sm leading-7 text-[#5B6877]">
                              {consultation.question || 'No question added.'}
                            </p>
                          </div>

                          <div className="text-xs font-semibold text-[#6B7280]">
                            {respondedByMe ? 'Already answered by you' : 'Needs doctor review'}
                          </div>
                        </div>

                        <div
                          className={`rounded-2xl border px-4 py-3 ${workflowSurfaceClasses[consultation.status]}`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-70">
                                Next step
                              </p>
                              <p className="mt-2 text-sm font-bold">{workflow.label}</p>
                              <p className="mt-1 text-sm leading-6 opacity-90">
                                {workflow.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold">
                              <span className="rounded-full bg-white/80 px-3 py-1 text-[#475569]">
                                Responses: {consultation.doctor_responses?.length ?? 0}
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
                      {selected.leads?.full_name ?? 'Unnamed lead'}
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
                      Current focus
                    </p>
                    <p className="mt-2 text-base font-bold">{selectedWorkflow.label}</p>
                    <p className="mt-1 text-sm leading-6 opacity-90">
                      {selectedWorkflow.description}
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#F7FAFF] p-3">
                    <p className="text-xs font-semibold text-[#6B7280]">Callback time</p>
                    <p className="mt-1 text-sm font-bold text-[#1F2937]">
                      {timeLabels[selected.preferred_callback_time]}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#F7FAFF] p-3">
                    <p className="text-xs font-semibold text-[#6B7280]">Risk</p>
                    <p className="mt-1 text-sm font-bold text-[#1F2937]">
                      {selected.leads?.risk_level
                        ? riskLabels[selected.leads.risk_level]
                        : 'Not scored'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[#EAF1F8] bg-[#F7FAFF] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                      <PhoneCall size={12} />
                      Operator handoff
                    </div>
                    <span className="text-xs font-semibold text-[#1E63B5]">
                      Responses: {selected.doctor_responses?.length ?? 0}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#1F2937]">
                    After the doctor response is saved, the operator can continue the patient
                    follow-up.
                  </p>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                    <MessageSquare size={12} />
                    Patient question
                  </div>
                  <div className="rounded-2xl bg-[#F7FAFF] p-4 text-sm leading-7 text-[#1F2937]">
                    {selected.question || 'No patient question was submitted.'}
                  </div>
                </div>

                {selected.doctor_responses?.length ? (
                  <div className="mt-5 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                      Previous doctor responses
                    </p>
                    {selected.doctor_responses.map((doctorResponse, index) => (
                      <div
                        key={doctorResponse.id ?? `${doctorResponse.created_at}-${index}`}
                        className="rounded-2xl border border-[#CDEDD8] bg-[#F5FCF8] p-4"
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#15803D]">
                          <CheckCircle2 size={12} />
                          {doctorResponse.doctor_id === initialDashboard.doctorId
                            ? 'Your response'
                            : 'Doctor response'}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-[#166534]">
                          {doctorResponse.response_text}
                        </p>
                        <p className="mt-2 text-xs text-[#4B5563]">
                          {formatDateTimeInUlaanbaatar(doctorResponse.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {selected.status === 'assigned' ? (
                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                        Medical response
                      </p>
                      <span className="text-xs text-[#9CA3AF]">{response.trim().length} chars</span>
                    </div>
                    <textarea
                      value={response}
                      onChange={(event) => setResponse(event.target.value)}
                      rows={7}
                      placeholder="Add the recommendation, tests to consider, and next step."
                      className="mt-3 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm text-[#1F2937] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                    />
                    <div className="mt-3">
                      <Button
                        fullWidth
                        loading={loading}
                        disabled={!response.trim()}
                        onClick={handleSubmitResponse}
                      >
                        <Send size={14} />
                        Save response
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-[#D1D5DB] bg-white px-6 py-12 text-center">
                <h3 className="text-lg font-bold text-[#1F2937]">Select a consultation</h3>
                <p className="mt-2 text-sm text-[#6B7280]">
                  Choose a consultation from the left to review details and reply.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

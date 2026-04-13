'use client'

import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Calendar, Download, MessageSquare, Phone, Save, ShieldAlert, UserRoundPlus } from 'lucide-react'
import {
  addLeadNoteForStaff,
  assignConsultationDoctor,
  createAppointmentForStaff,
  toggleLeadBlacklistForStaff,
  updateAppointmentForStaff,
  updateConsultationStatusForStaff,
  updateLeadStatusForStaff,
} from '@/app/dashboard/staff/actions'
import {
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminMessage,
  AdminPageHeader,
  AdminSectionCard,
  AdminTextArea,
} from '@/components/admin/AdminPrimitives'
import UnifiedCalendarBoard from '@/components/admin/UnifiedCalendarBoard'
import { useServerAction } from '@/components/admin/useServerAction'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatDateInUlaanbaatar, formatDateTimeInUlaanbaatar } from '@/lib/admin/date-format'
import type {
  AdminLead,
  AppointmentStatus,
  ConsultationWorkflowStatus,
  LeadStatus,
  RiskLevel,
  Role,
  UnifiedCalendarAppointment,
} from '@/lib/admin/types'

const riskLabels: Record<RiskLevel, string> = { low: 'Бага', medium: 'Дунд', high: 'Өндөр' }
const riskColors: Record<RiskLevel, 'green' | 'yellow' | 'red'> = {
  low: 'green',
  medium: 'yellow',
  high: 'red',
}
const leadLabels: Record<LeadStatus, string> = {
  new: 'Шинэ',
  contacted: 'Холбогдсон',
  pending: 'Хүлээгдэж буй',
  confirmed: 'Баталгаажсан',
  blacklisted: 'Блоклуулсан',
}
const leadColors: Record<LeadStatus, 'blue' | 'yellow' | 'gray' | 'green' | 'red'> = {
  new: 'blue',
  contacted: 'yellow',
  pending: 'gray',
  confirmed: 'green',
  blacklisted: 'red',
}
const appointmentLabels: Record<AppointmentStatus, string> = {
  pending: 'Хүлээгдэж буй',
  confirmed: 'Баталгаажсан',
  cancelled: 'Цуцлагдсан',
  completed: 'Дууссан',
}
const appointmentColors: Record<AppointmentStatus, 'yellow' | 'green' | 'red' | 'blue'> = {
  pending: 'yellow',
  confirmed: 'green',
  cancelled: 'red',
  completed: 'blue',
}
const consultationLabels: Record<ConsultationWorkflowStatus, string> = {
  new: 'Шинэ',
  assigned: 'Хуваарилагдсан',
  answered: 'Хариулсан',
  called: 'Холбогдсон',
  closed: 'Хаагдсан',
}
const consultationColors: Record<ConsultationWorkflowStatus, 'blue' | 'yellow' | 'green' | 'gray'> = {
  new: 'blue',
  assigned: 'yellow',
  answered: 'green',
  called: 'blue',
  closed: 'gray',
}
const callbackLabels: Record<string, string> = {
  morning: 'Өглөө',
  afternoon: 'Өдөр',
  evening: 'Орой',
}

type AppointmentDraft = {
  appointment_date: string
  appointment_time: string
  status: AppointmentStatus
}

function buildAppointmentDrafts(leads: AdminLead[]) {
  const drafts: Record<string, AppointmentDraft> = {}
  for (const lead of leads) {
    for (const appointment of lead.appointments ?? []) {
      drafts[appointment.id] = {
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time.slice(0, 5),
        status: appointment.status,
      }
    }
  }
  return drafts
}

export default function CrmManager({
  initialLeads,
  appointments,
  calendarDays,
  doctors,
  services,
  viewerRole = 'super_admin',
}: {
  initialLeads: AdminLead[]
  appointments: UnifiedCalendarAppointment[]
  calendarDays: string[]
  doctors: Array<{ id: string; full_name: string; specialization: string }>
  services: Array<{ id: string; name: string }>
  viewerRole?: Extract<Role, 'office_assistant' | 'super_admin'>
}) {
  const { pending, error, success, setError, setSuccess, runAction } = useServerAction()
  const [leads, setLeads] = useState(initialLeads)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeads[0]?.id ?? null)
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all')
  const [noteText, setNoteText] = useState('')
  const [appointmentDrafts, setAppointmentDrafts] = useState<Record<string, AppointmentDraft>>(
    () => buildAppointmentDrafts(initialLeads)
  )

  useEffect(() => {
    setLeads(initialLeads)
    setAppointmentDrafts(buildAppointmentDrafts(initialLeads))
    setError(null)
    setSuccess(null)
  }, [initialLeads, setError, setSuccess])

  useEffect(() => {
    if (!selectedLeadId || !initialLeads.some((lead) => lead.id === selectedLeadId)) {
      setSelectedLeadId(initialLeads[0]?.id ?? null)
    }
    setNewApptDraft(null)
  }, [initialLeads, selectedLeadId])

  const [newApptDraft, setNewApptDraft] = useState<{
    appointment_date: string
    appointment_time: string
    status: AppointmentStatus
    service_id: string
    doctor_id: string
  } | null>(null)

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase()
    return leads.filter((lead) => {
      const matchesSearch =
        query.length === 0 ||
        lead.full_name.toLowerCase().includes(query) ||
        lead.phone.includes(query) ||
        (lead.email ?? '').toLowerCase().includes(query)
      const matchesRisk = riskFilter === 'all' || lead.risk_level === riskFilter
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
      return matchesSearch && matchesRisk && matchesStatus
    })
  }, [leads, riskFilter, search, statusFilter])

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId]
  )

  const stats = useMemo(
    () => ({
      total: leads.length,
      highRisk: leads.filter((lead) => lead.risk_level === 'high').length,
      waitingConsultations: leads.filter((lead) =>
        (lead.consultation_requests ?? []).some(
          (consultation) => consultation.status === 'new' || consultation.status === 'assigned'
        )
      ).length,
      appointments: leads.filter((lead) => (lead.appointments?.length ?? 0) > 0).length,
    }),
    [leads]
  )

  function updateDraft(appointmentId: string, patch: Partial<AppointmentDraft>) {
    setAppointmentDrafts((current) => ({
      ...current,
      [appointmentId]: { ...(current[appointmentId] ?? { appointment_date: '', appointment_time: '', status: 'pending' }), ...patch },
    }))
  }

  function exportToExcel() {
    const rows = filteredLeads.map((lead) => ({
      Name: lead.full_name,
      Phone: lead.phone,
      Email: lead.email ?? '',
      Risk: lead.risk_level ? riskLabels[lead.risk_level] : 'Not scored',
      Status: leadLabels[lead.status],
      Appointment: lead.appointments?.[0] ? appointmentLabels[lead.appointments[0].status] : '',
      Consultation: lead.consultation_requests?.[0] ? consultationLabels[lead.consultation_requests[0].status] : '',
      Created: formatDateInUlaanbaatar(lead.created_at),
    }))
    const sheet = XLSX.utils.json_to_sheet(rows)
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'CRM')
    XLSX.writeFile(book, `supernova-crm-${Date.now()}.xlsx`)
  }

  const headerCopy =
    viewerRole === 'office_assistant'
      ? {
          eyebrow: 'Туслахын CRM',
          title: 'Оффисын CRM удирдлага',
          description: 'Лид, зөвлөгөө, цаг авалт болон тэмдэглэлийг нэг дороос удирдах.',
        }
      : {
          eyebrow: 'CRM',
          title: 'Лид болон хяналтын самбар',
          description: 'Хуудсаас ирсэн лидүүдийг шалгаж, цаг авалт, зөвлөгөөний урсгалыг удирдах.',
        }

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <AdminPageHeader
        eyebrow={headerCopy.eyebrow}
        title={headerCopy.title}
        description={headerCopy.description}
        actions={
          <button
            type="button"
            onClick={exportToExcel}
            className="inline-flex items-center gap-2 rounded-xl border border-[#B8D5FB] bg-white px-4 py-3 text-sm font-semibold text-[#1E63B5]"
          >
            <Download size={14} />
            Excel татах
          </button>
        }
      />

      {error ? <AdminMessage tone="error">{error}</AdminMessage> : null}
      {success ? <AdminMessage tone="success">{success}</AdminMessage> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Нийт лид', value: stats.total, tone: 'text-[#1E63B5]' },
          { label: 'Өндөр эрсдэлтэй', value: stats.highRisk, tone: 'text-[#F23645]' },
          { label: 'Зөвлөгөө хүлээж буй', value: stats.waitingConsultations, tone: 'text-[#D97706]' },
          { label: 'Цаг авсан лид', value: stats.appointments, tone: 'text-[#16A34A]' },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">{item.label}</p>
            <p className={`mt-3 text-3xl font-black ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </section>

      <UnifiedCalendarBoard appointments={appointments} days={calendarDays} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.95fr]">
        <AdminSectionCard title="CRM лидийн жагсаалт" description="Хайлт, эрсдэл болон лидийн төлөвөөр шүүх.">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <AdminInput placeholder="Нэр, утас, имэйлээр хайх" value={search} onChange={(event) => setSearch(event.target.value)} />
              <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value as 'all' | RiskLevel)} className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]">
                <option value="all">Бүх эрсдэл</option>
                <option value="low">Бага</option>
                <option value="medium">Дунд</option>
                <option value="high">Өндөр</option>
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | LeadStatus)} className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]">
                <option value="all">Бүх төлөв</option>
                {(Object.keys(leadLabels) as LeadStatus[]).map((status) => <option key={status} value={status}>{leadLabels[status]}</option>)}
              </select>
            </div>

            {filteredLeads.length === 0 ? (
              <AdminEmptyState title="Лид олдсонгүй" description="Шүүлтүүрээ цэвэрлэх эсвэл шинэ лид орж иртэл хүлээнэ үү." />
            ) : (
              <div className="space-y-3">
                {filteredLeads.map((lead) => {
                  const appointment = lead.appointments?.[0]
                  const consultation = lead.consultation_requests?.[0]
                  return (
                    <button key={lead.id} type="button" onClick={() => setSelectedLeadId(lead.id)} className={`block w-full rounded-3xl border-2 bg-white p-4 text-left transition hover:shadow-sm ${selectedLeadId === lead.id ? 'border-[#1E63B5] bg-[#F7FAFF]' : 'border-[#E5E7EB]'}`}>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-black text-[#1F2937]">{lead.full_name}</p>
                            {lead.risk_level ? <Badge color={riskColors[lead.risk_level]}>{riskLabels[lead.risk_level]}</Badge> : null}
                            <Badge color={leadColors[lead.status]}>{leadLabels[lead.status]}</Badge>
                            {lead.is_blacklisted ? <Badge color="red">Blacklisted</Badge> : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-[#6B7280]">
                            <span className="inline-flex items-center gap-1"><Phone size={14} />{lead.phone}</span>
                            {lead.email ? <span>{lead.email}</span> : null}
                            <span>{formatDateInUlaanbaatar(lead.created_at)}</span>
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[20rem]">
                          <div className="rounded-2xl bg-[#F7FAFF] p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Appointment</p>
                            <p className="mt-2 text-sm font-semibold text-[#1F2937]">{appointment?.services?.name ?? 'None'}</p>
                            <p className="mt-1 text-xs text-[#6B7280]">{appointment ? `${appointment.appointment_date} ${appointment.appointment_time.slice(0, 5)}` : 'No appointment yet'}</p>
                          </div>
                          <div className="rounded-2xl bg-[#F7FAFF] p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Consultation</p>
                            <p className="mt-2 text-sm font-semibold text-[#1F2937]">{consultation ? consultationLabels[consultation.status] : 'None'}</p>
                            <p className="mt-1 text-xs text-[#6B7280]">{consultation?.doctors?.full_name ?? callbackLabels[consultation?.preferred_callback_time ?? ''] ?? 'Unassigned'}</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </AdminSectionCard>

        <AdminSectionCard title="Лидийн дэлгэрэнгүй" description="Цаг авалт, зөвлөгөө хуваарилалт, блок болон тэмдэглэл.">
          {!selectedLead ? (
            <AdminEmptyState title="Лид сонгоно уу" description="Жагсаалтаас лид сонгож удирдана уу." />
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-[#1F2937]">{selectedLead.full_name}</h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#6B7280]">
                  <span className="inline-flex items-center gap-1"><Phone size={14} />{selectedLead.phone}</span>
                  {selectedLead.email ? <span>{selectedLead.email}</span> : null}
                  <span>{formatDateTimeInUlaanbaatar(selectedLead.created_at)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedLead.risk_level ? <Badge color={riskColors[selectedLead.risk_level]}>Эрсдэл: {riskLabels[selectedLead.risk_level]}</Badge> : null}
                  <Badge color={leadColors[selectedLead.status]}>Төлөв: {leadLabels[selectedLead.status]}</Badge>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-[#E5E7EB] bg-[#FBFDFF] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    <Calendar size={14} />
                    Цаг авалт
                  </div>
                  {selectedLead.appointments?.length ? (
                    <div className="mt-3 space-y-3">
                      {selectedLead.appointments.map((appointment) => {
                        const draft = appointmentDrafts[appointment.id]
                        if (!draft) return null

                        return (
                          <div key={appointment.id} className="rounded-2xl bg-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold text-[#1F2937]">
                                {appointment.services?.name ?? 'Үйлчилгээ сонгоогүй'}
                              </p>
                              <Badge color={appointmentColors[draft.status]}>
                                {appointmentLabels[draft.status]}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-[#6B7280]">
                              Эмч: {appointment.doctors?.full_name ?? 'Хуваарилагдаагүй'}
                            </p>
                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                              <input
                                type="date"
                                value={draft.appointment_date}
                                onChange={(event) =>
                                  updateDraft(appointment.id, {
                                    appointment_date: event.target.value,
                                  })
                                }
                                className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                              />
                              <input
                                type="time"
                                value={draft.appointment_time}
                                onChange={(event) =>
                                  updateDraft(appointment.id, {
                                    appointment_time: event.target.value,
                                  })
                                }
                                className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                              />
                              <select
                                value={draft.status}
                                onChange={(event) =>
                                  updateDraft(appointment.id, {
                                    status: event.target.value as AppointmentStatus,
                                  })
                                }
                                className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                              >
                                {(Object.keys(appointmentLabels) as AppointmentStatus[]).map((status) => (
                                  <option key={status} value={status}>
                                    {appointmentLabels[status]}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="mt-4 flex justify-end">
                              <Button
                                type="button"
                                loading={pending}
                                onClick={() =>
                                  runAction(
                                    () =>
                                      updateAppointmentForStaff({
                                        appointment_id: appointment.id,
                                        appointment_date: draft.appointment_date,
                                        appointment_time: draft.appointment_time,
                                        status: draft.status,
                                      }),
                                    { successMessage: 'Цагийн хуваарь шинэчлэгдлээ.' }
                                  )
                                }
                              >
                                <Save size={16} />
                                Цаг хадгалах
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[#9CA3AF]">Энэ лидэд цаг алга.</p>
                  )}

                  {!newApptDraft ? (
                    <div className="mt-4 border-t border-[#F3F4F6] pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setNewApptDraft({
                            appointment_date: '',
                            appointment_time: '',
                            status: 'pending',
                            service_id: '',
                            doctor_id: '',
                          })
                        }
                      >
                        <Calendar size={14} />
                        Шинэ цаг авах
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-[#D6E6FA] bg-[#F7FAFF] p-4">
                      <p className="mb-3 text-sm font-semibold text-[#1F2937]">Шинэ цаг бүртгэх</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <select
                          value={newApptDraft.service_id}
                          onChange={(e) =>
                            setNewApptDraft({ ...newApptDraft, service_id: e.target.value })
                          }
                          className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                        >
                          <option value="">Үйлчилгээ сонгох</option>
                          {services?.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={newApptDraft.doctor_id}
                          onChange={(e) =>
                            setNewApptDraft({ ...newApptDraft, doctor_id: e.target.value })
                          }
                          className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                        >
                          <option value="">Эмч хуваарилах</option>
                          {doctors.map((doctor) => (
                            <option key={doctor.id} value={doctor.id}>
                              {doctor.full_name} - {doctor.specialization}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <input
                          type="date"
                          value={newApptDraft.appointment_date}
                          onChange={(e) =>
                            setNewApptDraft({ ...newApptDraft, appointment_date: e.target.value })
                          }
                          className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                        />
                        <input
                          type="time"
                          value={newApptDraft.appointment_time}
                          onChange={(e) =>
                            setNewApptDraft({ ...newApptDraft, appointment_time: e.target.value })
                          }
                          className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                        />
                        <select
                          value={newApptDraft.status}
                          onChange={(e) =>
                            setNewApptDraft({
                              ...newApptDraft,
                              status: e.target.value as AppointmentStatus,
                            })
                          }
                          className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                        >
                          {(Object.keys(appointmentLabels) as AppointmentStatus[]).map((status) => (
                            <option key={status} value={status}>
                              {appointmentLabels[status]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setNewApptDraft(null)}
                          disabled={pending}
                        >
                          Цуцлах
                        </Button>
                        <Button
                          size="sm"
                          loading={pending}
                          onClick={() =>
                            runAction(
                              async () => {
                                const result = await createAppointmentForStaff({
                                  lead_id: selectedLead.id,
                                  appointment_date: newApptDraft.appointment_date,
                                  appointment_time: newApptDraft.appointment_time,
                                  status: newApptDraft.status,
                                  service_id: newApptDraft.service_id,
                                  doctor_id: newApptDraft.doctor_id,
                                })
                                if (result.ok) {
                                  setNewApptDraft(null)
                                }
                                return result
                              },
                              { successMessage: 'Шинэ цаг амжилттай үүслээ.' }
                            )
                          }
                        >
                          <Save size={14} />
                          Хадгалах
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-[#E5E7EB] bg-[#FBFDFF] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    <MessageSquare size={14} />
                    Зөвлөгөө
                  </div>
                  {selectedLead.consultation_requests?.length ? (
                    <div className="mt-3 space-y-3">
                      {selectedLead.consultation_requests.map((consultation) => (
                        <div key={consultation.id} className="rounded-2xl bg-white p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge color={consultationColors[consultation.status]}>
                              {consultationLabels[consultation.status]}
                            </Badge>
                            {consultation.doctors?.full_name ? (
                              <Badge color="blue">{consultation.doctors.full_name}</Badge>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm text-[#6B7280]">
                            Эргэн залгах:{' '}
                            {callbackLabels[consultation.preferred_callback_time] ??
                              consultation.preferred_callback_time}
                          </p>
                          {consultation.question ? (
                            <p className="mt-2 text-sm leading-6 text-[#1F2937]">
                              {consultation.question}
                            </p>
                          ) : null}
                          <div className="mt-4 grid gap-3">
                            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                              <select
                                defaultValue={consultation.assigned_doctor_id ?? ''}
                                onChange={(event) =>
                                  runAction(
                                    () =>
                                      assignConsultationDoctor(
                                        consultation.id,
                                        event.target.value || null
                                      ),
                                    { successMessage: 'Consultation assignment updated.' }
                                  )
                                }
                                className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                              >
                                <option value="">Эмч хуваарилаагүй</option>
                                {doctors.map((doctor) => (
                                  <option key={doctor.id} value={doctor.id}>
                                    {doctor.full_name} - {doctor.specialization}
                                  </option>
                                ))}
                              </select>
                              <div className="inline-flex items-center gap-2 rounded-xl bg-[#F7FAFF] px-4 py-3 text-sm font-semibold text-[#1E63B5]">
                                <UserRoundPlus size={15} />
                                Эмч хуваарилах
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(['assigned', 'answered', 'called', 'closed'] as const).map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  disabled={pending}
                                  onClick={() =>
                                    runAction(
                                      () => updateConsultationStatusForStaff(consultation.id, status),
                                      { successMessage: 'Consultation status updated.' }
                                    )
                                  }
                                  className={[
                                    'rounded-xl border px-3 py-2 text-xs font-semibold transition',
                                    consultation.status === status
                                      ? 'border-[#B8D5FB] bg-[#EAF3FF] text-[#1E63B5]'
                                      : 'border-[#E5E7EB] bg-white text-[#6B7280]',
                                  ].join(' ')}
                                >
                                  {consultationLabels[status]}
                                </button>
                              ))}
                            </div>
                            {consultation.doctor_responses?.length ? (
                              <div className="space-y-2 rounded-2xl border border-[#CDEDD8] bg-[#F5FCF8] p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#15803D]">
                                  Эмчийн хариу
                                </p>
                                {consultation.doctor_responses.map((response) => (
                                  <div key={response.id} className="rounded-2xl bg-white p-3">
                                    <p className="text-sm leading-6 text-[#166534]">
                                      {response.response_text}
                                    </p>
                                    <p className="mt-2 text-xs text-[#6B7280]">
                                      {formatDateTimeInUlaanbaatar(response.created_at)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[#9CA3AF]">Энэ лидэд зөвлөгөөний хүсэлт алга.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#1F2937]">Лидийн төлөв шинэчлэх</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(leadLabels) as LeadStatus[]).map((status) => (
                    <button
                      type="button"
                      key={status}
                      disabled={pending}
                      onClick={() =>
                        runAction(() => updateLeadStatusForStaff(selectedLead.id, status), {
                          successMessage: 'Lead status updated.',
                        })
                      }
                      className={[
                        'rounded-xl border px-3 py-2 text-sm font-semibold transition',
                        selectedLead.status === status
                          ? 'border-[#B8D5FB] bg-[#EAF3FF] text-[#1E63B5]'
                          : 'border-[#E5E7EB] bg-white text-[#6B7280]',
                      ].join(' ')}
                    >
                      {leadLabels[status]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-[#FDE3C3] bg-[#FFFBF4] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#92400E]">Блок жагсаалт</p>
                    <p className="mt-1 text-sm text-[#B45309]">
                      Спам, давхардсан эсвэл дахин холбогдох шаардлагагүй лидийг блок хийхэд ашиглана.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      runAction(
                        () =>
                          toggleLeadBlacklistForStaff(selectedLead.id, !selectedLead.is_blacklisted),
                        {
                          successMessage: selectedLead.is_blacklisted
                            ? 'Lead removed from blacklist.'
                            : 'Lead added to blacklist.',
                        }
                      )
                    }
                    className={[
                      'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition',
                      selectedLead.is_blacklisted
                        ? 'border border-[#E5E7EB] bg-white text-[#1F2937]'
                        : 'bg-[#F23645] text-white',
                    ].join(' ')}
                  >
                    <ShieldAlert size={14} />
                    {selectedLead.is_blacklisted ? 'Блокоос гаргах' : 'Блок хийх'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#1F2937]">CRM тэмдэглэл</p>
                  <span className="text-xs text-[#9CA3AF]">{selectedLead.crm_notes?.length ?? 0} тэмдэглэл</span>
                </div>
                <div className="max-h-64 space-y-3 overflow-y-auto rounded-3xl border border-[#E5E7EB] bg-[#FBFDFF] p-4">
                  {selectedLead.crm_notes?.length ? (
                    selectedLead.crm_notes.map((note) => (
                      <div key={note.id} className="rounded-2xl bg-white p-3 text-sm text-[#1F2937]">
                        <p className="leading-6">{note.note_text}</p>
                        <p className="mt-2 text-xs text-[#9CA3AF]">
                          {formatDateTimeInUlaanbaatar(note.created_at)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#9CA3AF]">CRM тэмдэглэл одоогоор алга.</p>
                  )}
                </div>
                <AdminField label="Шинэ CRM тэмдэглэл">
                  <AdminTextArea
                    rows={4}
                    value={noteText}
                    onChange={(event) => setNoteText(event.target.value)}
                    placeholder="Дуудлагын үр дүн, эргэж холбогдох сануулга эсвэл дотоод тэмдэглэл..."
                  />
                </AdminField>
                <Button
                  type="button"
                  loading={pending}
                  disabled={noteText.trim().length === 0}
                  onClick={() =>
                    runAction(
                      async () => {
                        const result = await addLeadNoteForStaff(selectedLead.id, noteText)
                        if (result.ok) {
                          setNoteText('')
                        }
                        return result
                      },
                      { successMessage: 'CRM note saved.' }
                    )
                  }
                >
                  <Save size={16} />
                  Тэмдэглэл хадгалах
                </Button>
              </div>
            </div>
          )}
        </AdminSectionCard>
      </div>
    </div>
  )
}

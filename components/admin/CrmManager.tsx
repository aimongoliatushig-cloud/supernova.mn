'use client'

import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import {
  Calendar,
  Download,
  MessageSquare,
  Phone,
  Save,
  ShieldAlert,
  UserRoundPlus,
} from 'lucide-react'
import {
  addLeadNoteForStaff,
  assignConsultationDoctor,
  toggleLeadBlacklistForStaff,
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
import { useServerAction } from '@/components/admin/useServerAction'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import type {
  AdminLead,
  ConsultationWorkflowStatus,
  LeadStatus,
  RiskLevel,
  Role,
} from '@/lib/admin/types'

const riskLabels: Record<RiskLevel, string> = {
  low: 'Бага',
  medium: 'Дунд',
  high: 'Өндөр',
}

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
  blacklisted: 'Blacklist',
}

const leadColors: Record<LeadStatus, 'blue' | 'yellow' | 'gray' | 'green' | 'red'> = {
  new: 'blue',
  contacted: 'yellow',
  pending: 'gray',
  confirmed: 'green',
  blacklisted: 'red',
}

const consultationLabels: Record<ConsultationWorkflowStatus, string> = {
  new: 'Шинэ',
  assigned: 'Оноосон',
  answered: 'Хариулсан',
  called: 'Дуудсан',
  closed: 'Хаасан',
}

const consultationColors: Record<
  ConsultationWorkflowStatus,
  'blue' | 'yellow' | 'green' | 'gray'
> = {
  new: 'blue',
  assigned: 'yellow',
  answered: 'green',
  called: 'blue',
  closed: 'gray',
}

const callbackLabels: Record<string, string> = {
  morning: 'Өглөө',
  afternoon: 'Үдээс хойш',
  evening: 'Орой',
}

export default function CrmManager({
  initialLeads,
  doctors,
  viewerRole = 'super_admin',
}: {
  initialLeads: AdminLead[]
  doctors: Array<{ id: string; full_name: string; specialization: string }>
  viewerRole?: Extract<Role, 'office_assistant' | 'operator' | 'super_admin'>
}) {
  const { pending, error, success, runAction } = useServerAction()
  const [leads, setLeads] = useState(initialLeads)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeads[0]?.id ?? null)
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all')
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    setLeads(initialLeads)
    if (!selectedLeadId) {
      if (initialLeads[0]) {
        setSelectedLeadId(initialLeads[0].id)
      }
      return
    }

    if (!initialLeads.some((lead) => lead.id === selectedLeadId)) {
      setSelectedLeadId(initialLeads[0]?.id ?? null)
    }
  }, [initialLeads, selectedLeadId])

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId]
  )

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const query = search.trim().toLowerCase()
      const matchesSearch =
        query.length === 0
          ? true
          : lead.full_name.toLowerCase().includes(query) ||
            lead.phone.includes(query) ||
            (lead.email ?? '').toLowerCase().includes(query)

      const matchesRisk = riskFilter === 'all' ? true : lead.risk_level === riskFilter
      const matchesStatus = statusFilter === 'all' ? true : lead.status === statusFilter

      return matchesSearch && matchesRisk && matchesStatus
    })
  }, [leads, riskFilter, search, statusFilter])

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

  function exportToExcel() {
    const rows = filteredLeads.map((lead) => ({
      Нэр: lead.full_name,
      Утас: lead.phone,
      Имэйл: lead.email ?? '',
      Эрсдэл: lead.risk_level ? riskLabels[lead.risk_level] : 'Тооцоогүй',
      'Lead төлөв': leadLabels[lead.status],
      Appointment: lead.appointments?.[0]?.status ?? '',
      Consultation: lead.consultation_requests?.[0]?.status ?? '',
      'Бүртгүүлсэн огноо': new Date(lead.created_at).toLocaleDateString('mn-MN'),
    }))

    const sheet = XLSX.utils.json_to_sheet(rows)
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'CRM')
    XLSX.writeFile(book, `supernova-crm-${Date.now()}.xlsx`)
  }

  const headerCopy =
    viewerRole === 'operator'
      ? {
          eyebrow: 'Operator CRM',
          title: 'Операторын CRM хяналт',
          description:
            'Эмчийн хариултыг хянаж, үйлчлүүлэгч рүү утсаар холбогдон зөвлөгөөг дамжуулж, consultation урсгалыг called эсвэл closed төлөвт шилжүүлнэ.',
        }
      : viewerRole === 'office_assistant'
        ? {
            eyebrow: 'Assistant CRM',
            title: 'Оффисын CRM хяналт',
            description:
              'Lead, consultation, appointment урсгалуудыг шүүж, эмчид оноож, тэмдэглэл болон follow-up төлөвөө удирдана.',
          }
        : {
            eyebrow: 'CRM',
            title: 'Лид, эрсдэл ба follow-up хяналт',
            description:
              'Public assessment, appointment, consultation урсгалуудаас ирсэн бүх лидуудыг нэг самбараас хянаж, эмчид оноох, тэмдэглэл оруулах, төлөв шинэчлэх боломжтой.',
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
          { label: 'Нийт lead', value: stats.total, tone: 'blue' as const },
          { label: 'Өндөр эрсдэл', value: stats.highRisk, tone: 'red' as const },
          { label: 'Consultation хүлээгдэж буй', value: stats.waitingConsultations, tone: 'yellow' as const },
          { label: 'Appointment-той lead', value: stats.appointments, tone: 'green' as const },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">
              {item.label}
            </p>
            <p
              className={[
                'mt-3 text-3xl font-black',
                item.tone === 'blue'
                  ? 'text-[#1E63B5]'
                  : item.tone === 'red'
                    ? 'text-[#F23645]'
                    : item.tone === 'yellow'
                      ? 'text-[#D97706]'
                      : 'text-[#16A34A]',
              ].join(' ')}
            >
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.95fr]">
        <AdminSectionCard
          title="CRM жагсаалт"
          description="Нэр, утас, эрсдэл, appointment/consultation урсгалаар шүүж шалгана."
        >
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <AdminInput
                placeholder="Нэр, утас, и-мэйлээр хайх"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select
                value={riskFilter}
                onChange={(event) => setRiskFilter(event.target.value as 'all' | RiskLevel)}
                className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
              >
                <option value="all">Бүх эрсдэл</option>
                <option value="low">Бага</option>
                <option value="medium">Дунд</option>
                <option value="high">Өндөр</option>
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'all' | LeadStatus)}
                className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
              >
                <option value="all">Бүх lead төлөв</option>
                {Object.entries(leadLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {filteredLeads.length === 0 ? (
              <AdminEmptyState
                title="Lead олдсонгүй"
                description="Шүүлтүүрээ өөрчилнө үү эсвэл шинэ public leads орж ирэхийг хүлээнэ үү."
              />
            ) : (
              <div className="space-y-3">
                {filteredLeads.map((lead) => {
                  const appointment = lead.appointments?.[0]
                  const consultation = lead.consultation_requests?.[0]

                  return (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={[
                        'block w-full rounded-3xl border-2 bg-white p-4 text-left transition hover:shadow-sm',
                        selectedLeadId === lead.id
                          ? 'border-[#1E63B5] bg-[#F7FAFF]'
                          : 'border-[#E5E7EB]',
                      ].join(' ')}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-black text-[#1F2937]">{lead.full_name}</p>
                            {lead.risk_level ? (
                              <Badge color={riskColors[lead.risk_level]}>
                                {riskLabels[lead.risk_level]}
                              </Badge>
                            ) : null}
                            <Badge color={leadColors[lead.status]}>{leadLabels[lead.status]}</Badge>
                            {lead.is_blacklisted ? <Badge color="red">Blacklist</Badge> : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-[#6B7280]">
                            <span className="inline-flex items-center gap-1">
                              <Phone size={14} />
                              {lead.phone}
                            </span>
                            {lead.email ? <span>{lead.email}</span> : null}
                            <span>{new Date(lead.created_at).toLocaleDateString('mn-MN')}</span>
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[20rem]">
                          <div className="rounded-2xl bg-[#F7FAFF] p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                              Appointment
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[#1F2937]">
                              {appointment?.services?.name ?? 'Байхгүй'}
                            </p>
                            <p className="mt-1 text-xs text-[#6B7280]">
                              {appointment
                                ? `${appointment.appointment_date} ${appointment.appointment_time}`
                                : 'Цаг авалтгүй'}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[#F7FAFF] p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                              Consultation
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[#1F2937]">
                              {consultation ? consultationLabels[consultation.status] : 'Байхгүй'}
                            </p>
                            <p className="mt-1 text-xs text-[#6B7280]">
                              {consultation?.doctors?.full_name ??
                                callbackLabels[consultation?.preferred_callback_time ?? ''] ??
                                'Оноолтгүй'}
                            </p>
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

        <AdminSectionCard
          title="Lead detail"
          description="Follow-up, appointment, consultation assignment, doctor response, notes."
        >
          {!selectedLead ? (
            <AdminEmptyState
              title="Lead сонгоно уу"
              description="Зүүн талын жагсаалтаас lead сонгоод appointment, consultation, CRM detail-ийг удирдана."
            />
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-[#1F2937]">{selectedLead.full_name}</h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#6B7280]">
                  <span className="inline-flex items-center gap-1">
                    <Phone size={14} />
                    {selectedLead.phone}
                  </span>
                  {selectedLead.email ? <span>{selectedLead.email}</span> : null}
                  <span>{new Date(selectedLead.created_at).toLocaleString('mn-MN')}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedLead.risk_level ? (
                    <Badge color={riskColors[selectedLead.risk_level]}>
                      Эрсдэл: {riskLabels[selectedLead.risk_level]}
                    </Badge>
                  ) : null}
                  <Badge color={leadColors[selectedLead.status]}>
                    Төлөв: {leadLabels[selectedLead.status]}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-[#E5E7EB] bg-[#FBFDFF] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    <Calendar size={14} />
                    Appointment
                  </div>
                  {selectedLead.appointments?.length ? (
                    <div className="mt-3 space-y-3">
                      {selectedLead.appointments.map((appointment) => (
                        <div key={appointment.id} className="rounded-2xl bg-white p-3">
                          <p className="font-semibold text-[#1F2937]">
                            {appointment.services?.name ?? 'Үйлчилгээ сонгоогүй'}
                          </p>
                          <p className="mt-1 text-sm text-[#6B7280]">
                            {appointment.appointment_date} {appointment.appointment_time} ·{' '}
                            {appointment.status}
                          </p>
                          <p className="mt-1 text-sm text-[#6B7280]">
                            Эмч: {appointment.doctors?.full_name ?? 'Оноогоогүй'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[#9CA3AF]">Appointment бүртгэл байхгүй.</p>
                  )}
                </div>

                <div className="rounded-3xl border border-[#E5E7EB] bg-[#FBFDFF] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    <MessageSquare size={14} />
                    Consultation
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
                            Callback: {callbackLabels[consultation.preferred_callback_time] ?? consultation.preferred_callback_time}
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
                                    { successMessage: 'Consultation assignment шинэчлэгдлээ.' }
                                  )
                                }
                                className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                              >
                                <option value="">Эмч оноогоогүй</option>
                                {doctors.map((doctor) => (
                                  <option key={doctor.id} value={doctor.id}>
                                    {doctor.full_name} · {doctor.specialization}
                                  </option>
                                ))}
                              </select>
                              <div className="inline-flex items-center gap-2 rounded-xl bg-[#F7FAFF] px-4 py-3 text-sm font-semibold text-[#1E63B5]">
                                <UserRoundPlus size={15} />
                                Эмч оноох
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
                                      { successMessage: 'Consultation төлөв шинэчлэгдлээ.' }
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
                                  Эмчийн хариулт
                                </p>
                                {consultation.doctor_responses.map((response) => (
                                  <div key={response.id} className="rounded-2xl bg-white p-3">
                                    <p className="text-sm leading-6 text-[#166534]">
                                      {response.response_text}
                                    </p>
                                    <p className="mt-2 text-xs text-[#6B7280]">
                                      {new Date(response.created_at).toLocaleString('mn-MN')}
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
                    <p className="mt-3 text-sm text-[#9CA3AF]">Consultation хүсэлт байхгүй.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#1F2937]">Lead төлөв шинэчлэх</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(leadLabels) as LeadStatus[]).map((status) => (
                    <button
                      type="button"
                      key={status}
                      disabled={pending}
                      onClick={() =>
                        runAction(() => updateLeadStatusForStaff(selectedLead.id, status), {
                          successMessage: 'Lead төлөв шинэчлэгдлээ.',
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
                    <p className="text-sm font-semibold text-[#92400E]">Blacklist хяналт</p>
                    <p className="mt-1 text-sm text-[#B45309]">
                      Буруу холбоо, спам эсвэл давтан шаардлагагүй lead-ийг blacklist болгож болно.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      runAction(
                        () =>
                          toggleLeadBlacklistForStaff(
                            selectedLead.id,
                            !selectedLead.is_blacklisted
                          ),
                        {
                          successMessage: selectedLead.is_blacklisted
                            ? 'Lead blacklist-ээс гарлаа.'
                            : 'Lead blacklist боллоо.',
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
                    {selectedLead.is_blacklisted ? 'Blacklist-ээс гаргах' : 'Blacklist болгох'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#1F2937]">CRM тэмдэглэл</p>
                  <span className="text-xs text-[#9CA3AF]">
                    {selectedLead.crm_notes?.length ?? 0} тэмдэглэл
                  </span>
                </div>

                <div className="max-h-64 space-y-3 overflow-y-auto rounded-3xl border border-[#E5E7EB] bg-[#FBFDFF] p-4">
                  {selectedLead.crm_notes?.length ? (
                    selectedLead.crm_notes.map((note) => (
                      <div key={note.id} className="rounded-2xl bg-white p-3 text-sm text-[#1F2937]">
                        <p className="leading-6">{note.note_text}</p>
                        <p className="mt-2 text-xs text-[#9CA3AF]">
                          {new Date(note.created_at).toLocaleString('mn-MN')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#9CA3AF]">Тэмдэглэл оруулаагүй байна.</p>
                  )}
                </div>

                <AdminField label="Шинэ CRM тэмдэглэл">
                  <AdminTextArea
                    rows={4}
                    value={noteText}
                    onChange={(event) => setNoteText(event.target.value)}
                    placeholder="Дуудлагын үр дүн, follow-up, эмчид дамжуулах тайлбар..."
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
                      { successMessage: 'CRM тэмдэглэл хадгалагдлаа.' }
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

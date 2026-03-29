'use client'

import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Download, Phone, Save, ShieldAlert } from 'lucide-react'
import { addLeadNote, toggleLeadBlacklist, updateLeadStatus } from '@/app/dashboard/admin/actions'
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
import type { AdminLead, LeadStatus, RiskLevel } from '@/lib/admin/types'

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
  blacklisted: 'Blacklisted',
}

const leadColors: Record<LeadStatus, 'blue' | 'yellow' | 'gray' | 'green' | 'red'> = {
  new: 'blue',
  contacted: 'yellow',
  pending: 'gray',
  confirmed: 'green',
  blacklisted: 'red',
}

export default function CrmManager({ initialLeads }: { initialLeads: AdminLead[] }) {
  const { pending, error, success, runAction } = useServerAction()
  const [leads, setLeads] = useState(initialLeads)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeads[0]?.id ?? null)
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all')
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    setLeads(initialLeads)
  }, [initialLeads])

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
          : lead.full_name.toLowerCase().includes(query) || lead.phone.includes(query)
      const matchesRisk = riskFilter === 'all' ? true : lead.risk_level === riskFilter
      const matchesStatus = statusFilter === 'all' ? true : lead.status === statusFilter
      return matchesSearch && matchesRisk && matchesStatus
    })
  }, [leads, riskFilter, search, statusFilter])

  function exportToExcel() {
    const rows = filteredLeads.map((lead) => ({
      Нэр: lead.full_name,
      Утас: lead.phone,
      Имэйл: lead.email ?? '',
      Эрсдэл: lead.risk_level ? riskLabels[lead.risk_level] : 'Тооцоогүй',
      Төлөв: leadLabels[lead.status],
      'Цаг захиалга': lead.appointments?.[0]?.status ?? '',
      Зөвлөгөө: lead.consultation_requests?.[0]?.status ?? '',
      Огноо: new Date(lead.created_at).toLocaleDateString('mn-MN'),
    }))

    const sheet = XLSX.utils.json_to_sheet(rows)
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'CRM')
    XLSX.writeFile(book, `supernova-admin-crm-${Date.now()}.xlsx`)
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <AdminPageHeader
        eyebrow="CRM"
        title="Лид, эрсдэл ба follow-up хяналт"
        description="Public assessment, appointment, consultation урсгалуудаас орж ирсэн бүх лидийг нэг дор харж, тэмдэглэл, blacklist болон статусаар нь удирдана."
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

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.95fr]">
        <AdminSectionCard
          title="CRM жагсаалт"
          description="Нэр, утас, эрсдэл, appointment/consultation статусаар шүүж хянах хүснэгт."
        >
          <div className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_0.45fr_0.45fr]">
              <AdminInput
                placeholder="Нэр эсвэл утсаар хайх"
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
                <option value="all">Бүх төлөв</option>
                {Object.entries(leadLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB] text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    <th className="px-4 py-3">Лид</th>
                    <th className="px-4 py-3">Эрсдэл</th>
                    <th className="px-4 py-3">Appointment</th>
                    <th className="px-4 py-3">Consultation</th>
                    <th className="px-4 py-3">Төлөв</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className={[
                        'cursor-pointer transition hover:bg-[#F7FAFF]',
                        selectedLeadId === lead.id ? 'bg-[#F7FAFF]' : '',
                      ].join(' ')}
                      onClick={() => setSelectedLeadId(lead.id)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-[#1F2937]">{lead.full_name}</p>
                          <p className="mt-1 text-xs text-[#6B7280]">{lead.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {lead.risk_level ? (
                          <Badge color={riskColors[lead.risk_level]}>
                            {riskLabels[lead.risk_level]}
                          </Badge>
                        ) : (
                          <span className="text-xs text-[#9CA3AF]">Тооцоогүй</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#6B7280]">
                        {lead.appointments?.[0]?.status ?? 'Байхгүй'}
                      </td>
                      <td className="px-4 py-3 text-[#6B7280]">
                        {lead.consultation_requests?.[0]?.status ?? 'Байхгүй'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={leadColors[lead.status]}>{leadLabels[lead.status]}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </AdminSectionCard>

        <AdminSectionCard
          title="Lead detail"
          description="Холбоо барих мэдээлэл, assessment summary, notes, blacklist болон follow-up статустай дэлгэрэнгүй карт."
        >
          {!selectedLead ? (
            <AdminEmptyState
              title="Лид сонгоно уу"
              description="Зүүн талын хүснэгтээс нэг лид сонговол appointment, consultation, note дэлгэрэнгүй энд харагдана."
            />
          ) : (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-[#1F2937]">{selectedLead.full_name}</h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#6B7280]">
                  <span className="inline-flex items-center gap-1">
                    <Phone size={14} />
                    {selectedLead.phone}
                  </span>
                  {selectedLead.email ? <span>{selectedLead.email}</span> : null}
                  <span>{new Date(selectedLead.created_at).toLocaleString('mn-MN')}</span>
                </div>
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
                {selectedLead.is_blacklisted ? <Badge color="red">Blacklist</Badge> : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#E5E7EB] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    Appointment
                  </p>
                  {selectedLead.appointments?.length ? (
                    <div className="mt-2 space-y-2 text-sm text-[#1F2937]">
                      {selectedLead.appointments.map((appointment) => (
                        <div key={appointment.id}>
                          <p className="font-semibold">
                            {appointment.services?.name ?? 'Үйлчилгээ сонгоогүй'}
                          </p>
                          <p className="text-[#6B7280]">
                            {appointment.appointment_date} {appointment.appointment_time} ·{' '}
                            {appointment.status}
                          </p>
                          <p className="text-[#6B7280]">
                            {appointment.doctors?.full_name ?? 'Эмч оноогоогүй'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-[#9CA3AF]">Цаг захиалга байхгүй.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-[#E5E7EB] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    Consultation
                  </p>
                  {selectedLead.consultation_requests?.length ? (
                    <div className="mt-2 space-y-3 text-sm text-[#1F2937]">
                      {selectedLead.consultation_requests.map((consultation) => (
                        <div key={consultation.id}>
                          <p className="font-semibold">{consultation.status}</p>
                          <p className="text-[#6B7280]">
                            Callback: {consultation.preferred_callback_time}
                          </p>
                          {consultation.question ? (
                            <p className="mt-1 text-[#4B5563]">{consultation.question}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-[#9CA3AF]">Зөвлөгөөний хүсэлт байхгүй.</p>
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
                        runAction(() => updateLeadStatus(selectedLead.id, status), {
                          successMessage: 'Лидийн төлөв шинэчлэгдлээ.',
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

              <div className="rounded-2xl border border-[#FDE3C3] bg-[#FFFBF4] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#92400E]">Blacklist хяналт</p>
                    <p className="mt-1 text-sm text-[#B45309]">
                      Эрсдэлтэй, худал, эсвэл буруу холбоо барих мэдээлэлтэй лидийг blacklist болгоно.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      runAction(() =>
                        toggleLeadBlacklist(selectedLead.id, !selectedLead.is_blacklisted)
                      )
                    }
                    className={[
                      'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                      selectedLead.is_blacklisted
                        ? 'bg-white text-[#1F2937] border border-[#E5E7EB]'
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

                <div className="max-h-56 space-y-3 overflow-y-auto rounded-2xl border border-[#E5E7EB] p-4">
                  {selectedLead.crm_notes?.length ? (
                    selectedLead.crm_notes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-2xl bg-[#F7FAFF] p-3 text-sm text-[#1F2937]"
                      >
                        <p>{note.note_text}</p>
                        <p className="mt-2 text-xs text-[#9CA3AF]">
                          {new Date(note.created_at).toLocaleString('mn-MN')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#9CA3AF]">Тэмдэглэл оруулаагүй байна.</p>
                  )}
                </div>

                <AdminField label="Шинэ тэмдэглэл">
                  <AdminTextArea
                    rows={4}
                    value={noteText}
                    onChange={(event) => setNoteText(event.target.value)}
                    placeholder="Дуудлагын үр дүн, follow-up, эмчид дамжуулах тайлбар..."
                  />
                </AdminField>

                <button
                  type="button"
                  disabled={pending || noteText.trim().length === 0}
                  onClick={() =>
                    runAction(
                      async () => {
                        const result = await addLeadNote({
                          lead_id: selectedLead.id,
                          note_text: noteText,
                        })
                        if (result.ok) {
                          setNoteText('')
                        }
                        return result
                      },
                      { successMessage: 'CRM тэмдэглэл хадгалагдлаа.' }
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <Save size={16} />
                  Тэмдэглэл хадгалах
                </button>
              </div>
            </div>
          )}
        </AdminSectionCard>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import {
  ArrowRight,
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
  AdminSelect,
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

type OrganizationRequestDetails = {
  organizationName?: string
  industry?: string
  employeeCount?: string
  contactName?: string
  email?: string
  phone?: string
  requestType?: string
  note?: string
}

const organizationDetailLabelMap: Record<string, keyof OrganizationRequestDetails> = {
  Байгууллага: 'organizationName',
  'Компанийн нэр': 'organizationName',
  Салбар: 'industry',
  'Компанийн салбар': 'industry',
  'Ажилтны тоо': 'employeeCount',
  'Холбоо барих хүн': 'contactName',
  Имэйл: 'email',
  'И-мэйл': 'email',
  Утас: 'phone',
  'Утасны дугаар': 'phone',
  'Холбоо барих утас': 'phone',
  Хүсэлт: 'requestType',
  Тэмдэглэл: 'note',
}

type ViewerRole = Extract<
  Role,
  'office_assistant' | 'operator' | 'organization_consultant' | 'super_admin'
>
type Tone = 'blue' | 'yellow' | 'green' | 'red' | 'gray'

const workflowSurfaceClasses: Record<Tone, string> = {
  blue: 'border-[#D6E6FA] bg-[#F7FAFF] text-[#1E63B5]',
  yellow: 'border-[#FDE9B6] bg-[#FFFBF1] text-[#B45309]',
  green: 'border-[#CDEDD8] bg-[#F5FCF8] text-[#166534]',
  red: 'border-[#F9D2D6] bg-[#FFF7F8] text-[#C2253D]',
  gray: 'border-[#E5E7EB] bg-[#F8FAFC] text-[#4B5563]',
}

function getPrimaryConsultation(lead: AdminLead) {
  return lead.consultation_requests?.[0] ?? null
}

function isOrganizationLead(lead: AdminLead) {
  return lead.source === 'organization_consultation_request'
}

function formatSourceLabel(source: string | null) {
  if (!source) {
    return null
  }

  if (source === 'organization_consultation_request') {
    return 'Байгууллагын зөвлөгөө'
  }

  return source
}

function parseOrganizationRequestDetails(
  question: string | null | undefined
): OrganizationRequestDetails | null {
  if (!question) {
    return null
  }

  const details: OrganizationRequestDetails = {}

  for (const rawLine of question.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line) {
      continue
    }

    const separatorIndex = line.indexOf(':')
    if (separatorIndex < 0) {
      continue
    }

    const label = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    const key = organizationDetailLabelMap[label]

    if (!key || !value) {
      continue
    }

    details[key] = value
  }

  return Object.keys(details).length > 0 ? details : null
}

function getLeadWorkflow(
  lead: AdminLead,
  viewerRole: ViewerRole
): { label: string; description: string; tone: Tone } {
  const consultation = getPrimaryConsultation(lead)

  if (lead.is_blacklisted) {
    return {
      label: 'Blacklist-тэй',
      description: 'Энэ lead дээр идэвхтэй follow-up хийхгүй. Зөвхөн хэрэгтэй тэмдэглэл үлдээнэ.',
      tone: 'red',
    }
  }

  if (isOrganizationLead(lead)) {
    if (lead.status === 'confirmed') {
      return {
        label: 'Байгууллагын кейс баталгаажсан',
        description:
          'Зөвлөгөө болон дараагийн алхам баталгаажсан тул кейсийг хаагдсан төлөвтэй хадгалж, шаардлагатай note-оо л шинэчилнэ.',
        tone: 'green',
      }
    }

    if (lead.status === 'contacted' || lead.status === 'pending') {
      return {
        label: 'Follow-up үргэлжилж байна',
        description:
          'Анхны зөвлөгөө өгсөн тул дараагийн уулзалт, санал илгээх эсвэл дахин холбогдох алхмаа CRM note дээр үргэлжлүүлнэ.',
        tone: 'blue',
      }
    }

    if (consultation?.status === 'closed') {
      return {
        label: 'Байгууллагын кейс хаагдсан',
        description:
          'Зөвлөгөөний урсгал дууссан. Шаардлагатай бол CRM тэмдэглэл болон lead төлөвийг л шинэчилнэ.',
        tone: 'gray',
      }
    }

    if (consultation?.status === 'called') {
      return {
        label: 'Байгууллагатай холбогдсон',
        description:
          'Утас, и-мэйл эсвэл follow-up-аар холбогдсон тул дараагийн алхам, санал болгосон үйлчилгээг CRM note дээр баталгаажуулна.',
        tone: 'green',
      }
    }

    return viewerRole === 'organization_consultant'
      ? {
          label: 'Байгууллагад зөвлөгөө өгөх',
          description:
            'Хүссэн үйлчилгээний хүрээ, ажилтны тоонд тохирох багцуудыг тайлбарлаж, дараагийн уулзалт эсвэл саналын мэдээллээ CRM note дээр үлдээнэ.',
          tone: 'blue',
        }
      : {
          label: 'Байгууллагын зөвлөгөөний хүсэлт',
          description:
            'Энэ хүсэлт нь байгууллагын үйлчилгээний урсгалд хамаарах тул байгууллагын зөвлөх эсвэл super admin хариуцна.',
          tone: 'gray',
        }
  }

  if (consultation?.status === 'new') {
    return viewerRole === 'operator'
      ? {
          label: 'Эмч оноолт хүлээж байна',
          description:
            'Assistant эсвэл admin тохирох эмчид оноосны дараа operator дуудлагын урсгал үргэлжилнэ.',
          tone: 'gray',
        }
      : {
          label: 'Эмчид оноох шаардлагатай',
          description:
            'Шинэ consultation ирсэн байна. Тохирох эмчийг оноогоод дараагийн урсгалыг эхлүүлнэ.',
          tone: 'yellow',
        }
  }

  if (consultation?.status === 'assigned') {
    return {
      label: 'Эмчийн хариу хүлээж байна',
      description:
        viewerRole === 'operator'
          ? 'Эмч мэргэжлийн зөвлөгөө бичсэний дараа та утсаар дамжуулж called эсвэл closed төлөвт шилжүүлнэ.'
          : 'Эмч кейсийг хянаж байгаа тул lead-ийн note болон appointment мэдээллийг цэгцэлж бэлэн байлгана.',
      tone: 'yellow',
    }
  }

  if (consultation?.status === 'answered') {
    return viewerRole === 'operator' || viewerRole === 'super_admin'
      ? {
          label: 'Үйлчлүүлэгч рүү залгах',
          description:
            'Эмчийн зөвлөгөө бэлэн болсон. Одоо үйлчлүүлэгчид утсаар дамжуулж follow-up төлөвийг шинэчилнэ.',
          tone: 'green',
        }
      : {
          label: 'Operator follow-up хүлээж байна',
          description:
            'Эмчийн зөвлөгөө бүртгэгдсэн тул operator утсаар холбогдох урсгал руу шилжинэ.',
          tone: 'green',
        }
  }

  if (consultation?.status === 'called') {
    return {
      label: 'Дуудлагын дараах баталгаажуулалт',
      description: 'Үйлчлүүлэгчтэй холбогдсон кейсийг нэмэлт тэмдэглэлтэй хамт хаах эсэхээ шалгана.',
      tone: 'blue',
    }
  }

  if (consultation?.status === 'closed') {
    return {
      label: 'Кейс хаагдсан',
      description: 'Одоогоор идэвхтэй ажиллагаа дууссан. Шаардлагатай бол зөвхөн CRM note шинэчилнэ.',
      tone: 'gray',
    }
  }

  if ((lead.appointments?.length ?? 0) > 0) {
    return {
      label: 'Appointment баталгаажуулах',
      description:
        'Цаг захиалгатай lead тул appointment-ийн мэдээллийг нягталж, note дээр follow-up үлдээнэ.',
      tone: 'blue',
    }
  }

  return {
    label: 'Анхны follow-up',
    description: 'Lead-тэй анх холбогдож хэрэгцээг тодруулан дараагийн алхмыг CRM дээр тэмдэглэнэ.',
    tone: 'blue',
  }
}

export default function CrmManager({
  initialLeads,
  doctors,
  viewerRole = 'super_admin',
}: {
  initialLeads: AdminLead[]
  doctors: Array<{ id: string; full_name: string; specialization: string }>
  viewerRole?: ViewerRole
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
  }, [initialLeads])

  useEffect(() => {
    setSelectedLeadId((current) => {
      if (initialLeads.length === 0) {
        return null
      }

      if (current && initialLeads.some((lead) => lead.id === current)) {
        return current
      }

      return initialLeads[0].id
    })
  }, [initialLeads])

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const query = search.trim().toLowerCase()
      const organizationDetails = isOrganizationLead(lead)
        ? parseOrganizationRequestDetails(getPrimaryConsultation(lead)?.question)
        : null
      const matchesSearch =
        query.length === 0
          ? true
          : lead.full_name.toLowerCase().includes(query) ||
            lead.phone.includes(query) ||
            (lead.email ?? '').toLowerCase().includes(query) ||
            (organizationDetails?.industry ?? '').toLowerCase().includes(query) ||
            (organizationDetails?.employeeCount ?? '').toLowerCase().includes(query) ||
            (organizationDetails?.contactName ?? '').toLowerCase().includes(query)

      const matchesRisk = riskFilter === 'all' ? true : lead.risk_level === riskFilter
      const matchesStatus = statusFilter === 'all' ? true : lead.status === statusFilter

      return matchesSearch && matchesRisk && matchesStatus
    })
  }, [leads, riskFilter, search, statusFilter])

  useEffect(() => {
    if (filteredLeads.length === 0) {
      return
    }

    if (!selectedLeadId || !filteredLeads.some((lead) => lead.id === selectedLeadId)) {
      setSelectedLeadId(filteredLeads[0].id)
    }
  }, [filteredLeads, selectedLeadId])

  useEffect(() => {
    setNoteText('')
  }, [selectedLeadId])

  const selectedLead = useMemo(() => {
    if (filteredLeads.length === 0) {
      return null
    }

    return filteredLeads.find((lead) => lead.id === selectedLeadId) ?? filteredLeads[0]
  }, [filteredLeads, selectedLeadId])
  const selectedOrganizationDetails =
    selectedLead && isOrganizationLead(selectedLead)
      ? parseOrganizationRequestDetails(getPrimaryConsultation(selectedLead)?.question)
      : null

  const stats = useMemo(
    () => ({
      total: leads.length,
      highRisk: leads.filter((lead) => lead.risk_level === 'high').length,
      needsAssignment: leads.filter((lead) =>
        (lead.consultation_requests ?? []).some((consultation) => consultation.status === 'new')
      ).length,
      waitingDoctor: leads.filter((lead) =>
        (lead.consultation_requests ?? []).some((consultation) => consultation.status === 'assigned')
      ).length,
      readyForCallback: leads.filter((lead) =>
        (lead.consultation_requests ?? []).some((consultation) => consultation.status === 'answered')
      ).length,
      called: leads.filter((lead) =>
        (lead.consultation_requests ?? []).some((consultation) => consultation.status === 'called')
      ).length,
      contacted: leads.filter(
        (lead) =>
          lead.status === 'contacted' ||
          (lead.consultation_requests ?? []).some((consultation) => consultation.status === 'called')
      ).length,
      closed: leads.filter(
        (lead) =>
          lead.status === 'confirmed' ||
          (lead.consultation_requests ?? []).some((consultation) => consultation.status === 'closed')
      ).length,
      newLeads: leads.filter((lead) => lead.status === 'new').length,
    }),
    [leads]
  )

  function exportToExcel() {
    const rows = filteredLeads.map((lead) => {
      const organizationDetails = isOrganizationLead(lead)
        ? parseOrganizationRequestDetails(getPrimaryConsultation(lead)?.question)
        : null

      return {
        Нэр: lead.full_name,
        Утас: lead.phone,
        'И-мэйл': lead.email ?? '',
        'Компанийн салбар': organizationDetails?.industry ?? '',
        'Ажилтны тоо': organizationDetails?.employeeCount ?? '',
        'Холбоо барих хүн': organizationDetails?.contactName ?? '',
        Эрсдэл: lead.risk_level ? riskLabels[lead.risk_level] : 'Тооцоогүй',
        'Lead төлөв': leadLabels[lead.status],
        Appointment: lead.appointments?.[0]?.status ?? '',
        Consultation: lead.consultation_requests?.[0]?.status ?? '',
        'Бүртгүүлсэн огноо': new Date(lead.created_at).toLocaleDateString('mn-MN'),
      }
    })

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
            'Эмчийн зөвлөгөөг уншиж, үйлчлүүлэгч рүү утсаар дамжуулан consultation урсгалыг called эсвэл closed төлөвт шилжүүлнэ.',
        }
      : viewerRole === 'organization_consultant'
        ? {
            eyebrow: 'Organization CRM',
            title: 'Байгууллагын зөвлөгөөний самбар',
            description:
              'Байгууллагаас ирсэн хүсэлтүүдийг л харж, ямар үйлчилгээ тохирохыг тайлбарлан, дараагийн алхам болон харилцсан тэмдэглэлээ CRM дээр удирдана.',
          }
      : viewerRole === 'office_assistant'
        ? {
            eyebrow: 'Assistant CRM',
            title: 'Оффисын CRM хяналт',
            description:
              'Lead, consultation, appointment урсгалуудыг шүүж, эмчид оноон, тэмдэглэл болон follow-up төлөвийг удирдана.',
          }
        : {
            eyebrow: 'CRM',
            title: 'Лид, эрсдэл ба follow-up хяналт',
            description:
              'Public assessment, appointment, consultation урсгалуудаас ирсэн бүх лидуудыг нэг самбараас хянаж, эмчид оноох, note оруулах, төлөв шинэчлэх боломжтой.',
          }

  const canAssignConsultations =
    viewerRole === 'office_assistant' || viewerRole === 'super_admin'
  const canManageLeadStatus =
    viewerRole === 'office_assistant' ||
    viewerRole === 'organization_consultant' ||
    viewerRole === 'super_admin'
  const followUpStatuses =
    viewerRole === 'operator' || viewerRole === 'super_admin'
      ? (['called', 'closed'] as const)
      : []
  const notePlaceholder =
    viewerRole === 'operator'
      ? 'Дуудлагын үр дүн, үйлчлүүлэгчид дамжуулсан зөвлөгөө, дахин холбогдох огноо...'
      : 'Дуудлагын үр дүн, follow-up, эмчид дамжуулах тайлбар...'
  const roleTip =
    viewerRole === 'operator'
      ? `${stats.readyForCallback} кейс дээр эмчийн зөвлөгөө бэлэн байна. Эдгээрийг түрүүнд утсаар дамжуулж, дараа нь called эсвэл closed төлөвт шилжүүлнэ.`
      : `${stats.needsAssignment} шинэ consultation эмчид оноох хүлээлттэй байна. Эхлээд эдгээр кейсүүдийг оноогоод дараа нь lead болон note урсгалыг цэгцлээрэй.`
  const statItems =
    viewerRole === 'operator'
      ? [
          {
            label: 'Нийт lead',
            value: stats.total,
            caption: 'CRM жагсаалт',
            tone: 'blue' as const,
          },
          {
            label: 'Залгах бэлэн',
            value: stats.readyForCallback,
            caption: 'Эмчийн зөвлөгөө ирсэн',
            tone: 'green' as const,
          },
          {
            label: 'Дуудсан кейс',
            value: stats.called,
            caption: 'Хаалт хүлээж буй',
            tone: 'yellow' as const,
          },
          {
            label: 'Өндөр эрсдэл',
            value: stats.highRisk,
            caption: 'Анхаарах lead',
            tone: 'red' as const,
          },
        ]
      : [
          {
            label: 'Нийт lead',
            value: stats.total,
            caption: 'CRM жагсаалт',
            tone: 'blue' as const,
          },
          {
            label: 'Эмчид оноох',
            value: stats.needsAssignment,
            caption: 'Шинэ consultation',
            tone: 'yellow' as const,
          },
          {
            label: 'Эмчийн хариу хүлээж буй',
            value: stats.waitingDoctor,
            caption: 'Assigned кейс',
            tone: 'green' as const,
          },
          {
            label: 'Өндөр эрсдэл',
            value: stats.highRisk,
            caption: 'Анхаарах lead',
            tone: 'red' as const,
          },
        ]
  const selectedWorkflow = selectedLead ? getLeadWorkflow(selectedLead, viewerRole) : null
  const resolvedHeaderCopy =
    viewerRole === 'organization_consultant'
      ? {
          eyebrow: 'Organization CRM',
          title: 'Байгууллагын зөвлөгөөний самбар',
          description:
            'Байгууллагаас ирсэн хүсэлтүүдийг л харж, ямар үйлчилгээ тохирохыг тайлбарлан, дараагийн алхам болон харилцсан тэмдэглэлээ CRM дээр удирдана.',
        }
      : headerCopy
  const resolvedRoleTip =
    viewerRole === 'organization_consultant'
      ? `${stats.newLeads} шинэ байгууллагын хүсэлт хүлээгдэж байна. Эхлээд эдгээр байгууллагуудтай холбогдож, тохирох үйлчилгээ болон дараагийн алхмыг CRM note дээр тэмдэглээрэй.`
      : roleTip
  const resolvedNotePlaceholder =
    viewerRole === 'organization_consultant'
      ? 'Байгууллагад санал болгосон үйлчилгээ, ажилтны тоонд тохирсон шийдэл, дараагийн уулзалт эсвэл follow-up...'
      : notePlaceholder
  const resolvedStatItems =
    viewerRole === 'organization_consultant'
      ? [
          {
            label: 'Нийт хүсэлт',
            value: stats.total,
            caption: 'Байгууллагын CRM',
            tone: 'blue' as const,
          },
          {
            label: 'Шинэ хүсэлт',
            value: stats.newLeads,
            caption: 'Зөвлөгөө хүлээж буй',
            tone: 'yellow' as const,
          },
          {
            label: 'Холбогдсон',
            value: stats.contacted,
            caption: 'Follow-up үргэлжилж буй',
            tone: 'green' as const,
          },
          {
            label: 'Хаагдсан',
            value: stats.closed,
            caption: 'Дууссан кейс',
            tone: 'blue' as const,
          },
        ]
      : statItems
  const listTitle =
    viewerRole === 'organization_consultant' ? 'Байгууллагын хүсэлтүүд' : 'CRM жагсаалт'
  const listDescription =
    viewerRole === 'organization_consultant'
      ? 'Байгууллагын нэр, утас, имэйл болон ажилтны тоогоор нь шүүж, эхлээд зөвлөгөө өгөх шаардлагатай кейсүүдийг түрүүлж авна.'
      : 'Хайлт, эрсдэл, төлвөөр шүүгээд дараагийн алхам хамгийн ойр кейсүүдийг түрүүнд авна.'
  const detailTitle =
    viewerRole === 'organization_consultant' ? 'Байгууллагын detail' : 'Lead detail'
  const detailDescription =
    viewerRole === 'organization_consultant'
      ? 'Сонгосон байгууллагын зөвлөгөөний хүсэлт, холбоо барих мэдээлэл болон CRM note-уудыг нэг дороос удирдана.'
      : 'Сонгосон lead-ийн consultation, appointment, note болон follow-up урсгалыг нэг дор удирдана.'

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <AdminPageHeader
        eyebrow={resolvedHeaderCopy.eyebrow}
        title={resolvedHeaderCopy.title}
        description={resolvedHeaderCopy.description}
        actions={
          <Button type="button" variant="outline" onClick={exportToExcel}>
            <Download size={14} />
            Excel татах
          </Button>
        }
      />

      {error ? <AdminMessage tone="error">{error}</AdminMessage> : null}
      {success ? <AdminMessage tone="success">{success}</AdminMessage> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {resolvedStatItems.map((item) => (
          <div
            key={item.label}
            className="rounded-[28px] border border-[#E5E7EB] bg-white p-5 shadow-[0_16px_50px_rgba(17,37,68,0.06)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
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
            <p className="mt-2 text-sm text-[#6B7280]">{item.caption}</p>
          </div>
        ))}
      </section>

      <AdminMessage tone="info">{resolvedRoleTip}</AdminMessage>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.92fr)]">
        <AdminSectionCard
          title={listTitle}
          description={listDescription}
          action={
            <div className="rounded-full border border-[#D6E6FA] bg-[#F7FAFF] px-3 py-2 text-xs font-semibold text-[#1E63B5]">
              {filteredLeads.length} / {leads.length} lead
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,0.8fr))]">
              <AdminInput
                placeholder="Нэр, утас, и-мэйлээр хайх"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <AdminSelect
                value={riskFilter}
                onChange={(event) => setRiskFilter(event.target.value as 'all' | RiskLevel)}
              >
                <option value="all">Бүх эрсдэл</option>
                <option value="low">Бага</option>
                <option value="medium">Дунд</option>
                <option value="high">Өндөр</option>
              </AdminSelect>
              <AdminSelect
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'all' | LeadStatus)}
              >
                <option value="all">Бүх lead төлөв</option>
                {Object.entries(leadLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </AdminSelect>
            </div>

            {filteredLeads.length === 0 ? (
              <AdminEmptyState
                title="Lead олдсонгүй"
                description="Шүүлтүүрээ өөрчилнө үү эсвэл шинэ public lead ирэхийг хүлээнэ үү."
              />
            ) : (
              <div className="space-y-3">
                {filteredLeads.map((lead) => {
                  const appointment = lead.appointments?.[0]
                  const consultation = getPrimaryConsultation(lead)
                  const workflow = getLeadWorkflow(lead, viewerRole)
                  const organizationDetails = isOrganizationLead(lead)
                    ? parseOrganizationRequestDetails(consultation?.question)
                    : null

                  return (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={[
                        'block w-full rounded-[28px] border-2 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(17,37,68,0.08)]',
                        selectedLead?.id === lead.id
                          ? 'border-[#1E63B5] bg-[#F7FAFF]'
                          : 'border-[#E5E7EB]',
                      ].join(' ')}
                    >
                      <div className="flex flex-col gap-4">
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
                            {organizationDetails ? (
                              <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#35506C]">
                                {organizationDetails.industry ? (
                                  <span className="rounded-full bg-[#EEF6FF] px-3 py-1">
                                    Салбар: {organizationDetails.industry}
                                  </span>
                                ) : null}
                                {organizationDetails.employeeCount ? (
                                  <span className="rounded-full bg-[#EEF6FF] px-3 py-1">
                                    Ажилтны тоо: {organizationDetails.employeeCount}
                                  </span>
                                ) : null}
                                {organizationDetails.contactName ? (
                                  <span className="rounded-full bg-[#EEF6FF] px-3 py-1">
                                    Холбоо барих хүн: {organizationDetails.contactName}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[21rem]">
                            <div className="rounded-2xl border border-[#EAF1F8] bg-[#F7FAFF] p-3">
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
                            <div className="rounded-2xl border border-[#EAF1F8] bg-[#F7FAFF] p-3">
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

                        <div
                          className={`rounded-2xl border px-4 py-3 ${workflowSurfaceClasses[workflow.tone]}`}
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
                              {consultation ? (
                                <span className="rounded-full bg-white/80 px-3 py-1 text-[#475569]">
                                  Хариулт: {consultation.doctor_responses?.length ?? 0}
                                </span>
                              ) : null}
                              <ArrowRight size={14} />
                            </div>
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
          title={detailTitle}
          description={detailDescription}
          className="xl:sticky xl:top-6 self-start"
          action={
            selectedWorkflow ? (
              <Badge color={selectedWorkflow.tone}>{selectedWorkflow.label}</Badge>
            ) : null
          }
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
                  {selectedLead.source ? (
                    <Badge color="gray">{formatSourceLabel(selectedLead.source)}</Badge>
                  ) : null}
                </div>
                {selectedOrganizationDetails ? (
                  <div className="grid gap-3 pt-2 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                      ['Компанийн нэр', selectedLead.full_name],
                      ['Компанийн салбар', selectedOrganizationDetails.industry],
                      ['Ажилтны тоо', selectedOrganizationDetails.employeeCount],
                      ['Холбоо барих хүн', selectedOrganizationDetails.contactName],
                      ['Имэйл', selectedOrganizationDetails.email],
                      ['Утас', selectedOrganizationDetails.phone],
                      ['Орж ирсэн огноо', new Date(selectedLead.created_at).toLocaleString('mn-MN')],
                    ]
                      .filter(([, value]) => Boolean(value))
                      .map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-2xl border border-[#EAF1F8] bg-[#F7FAFF] p-4"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                            {label}
                          </p>
                          <p className="mt-2 text-sm font-bold text-[#10233B]">{value}</p>
                        </div>
                      ))}
                  </div>
                ) : null}
              </div>

              {selectedWorkflow ? (
                <div
                  className={`rounded-[28px] border px-4 py-4 ${workflowSurfaceClasses[selectedWorkflow.tone]}`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-70">
                    Одоогийн фокус
                  </p>
                  <p className="mt-2 text-lg font-bold">{selectedWorkflow.label}</p>
                  <p className="mt-1 text-sm leading-6 opacity-90">
                    {selectedWorkflow.description}
                  </p>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#EAF1F8] bg-[#F7FAFF] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    Үнэлгээний оноо
                  </p>
                  <p className="mt-2 text-lg font-black text-[#10233B]">
                    {selectedLead.risk_score ?? 'Тооцоогүй'}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#EAF1F8] bg-[#F7FAFF] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    Consultation
                  </p>
                  <p className="mt-2 text-lg font-black text-[#10233B]">
                    {selectedLead.consultation_requests?.length ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#EAF1F8] bg-[#F7FAFF] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    CRM тэмдэглэл
                  </p>
                  <p className="mt-2 text-lg font-black text-[#10233B]">
                    {selectedLead.crm_notes?.length ?? 0}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[28px] border border-[#E5E7EB] bg-[#FBFDFF] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    <Calendar size={14} />
                    Appointment
                  </div>
                  {selectedLead.appointments?.length ? (
                    <div className="mt-3 space-y-3">
                      {selectedLead.appointments.map((appointment) => (
                        <div key={appointment.id} className="rounded-2xl border border-[#EEF2F7] bg-white p-3">
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

                <div className="rounded-[28px] border border-[#E5E7EB] bg-[#FBFDFF] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    <MessageSquare size={14} />
                    Consultation
                  </div>
                  {selectedLead.consultation_requests?.length ? (
                    <div className="mt-3 space-y-3">
                      {selectedLead.consultation_requests.map((consultation) => {
                        const responseCount = consultation.doctor_responses?.length ?? 0
                        const organizationLead = isOrganizationLead(selectedLead)
                        const organizationDetails = organizationLead
                          ? parseOrganizationRequestDetails(consultation.question)
                          : null

                        return (
                          <div key={consultation.id} className="rounded-2xl border border-[#EEF2F7] bg-white p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge color={consultationColors[consultation.status]}>
                                {consultationLabels[consultation.status]}
                              </Badge>
                              {consultation.doctors?.full_name ? (
                                <Badge color="blue">{consultation.doctors.full_name}</Badge>
                              ) : null}
                              <span className="text-xs font-semibold text-[#6B7280]">
                                Хариулт: {responseCount}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-[#6B7280]">
                              Callback:{' '}
                              {callbackLabels[consultation.preferred_callback_time] ??
                                consultation.preferred_callback_time}
                            </p>
                            {organizationDetails ? (
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {[
                                  ['Компанийн салбар', organizationDetails.industry],
                                  ['Ажилтны тоо', organizationDetails.employeeCount],
                                  ['Холбоо барих хүн', organizationDetails.contactName],
                                  ['Имэйл', organizationDetails.email],
                                  ['Утас', organizationDetails.phone],
                                ]
                                  .filter(([, value]) => Boolean(value))
                                  .map(([label, value]) => (
                                    <div
                                      key={label}
                                      className="rounded-2xl bg-[#F7FAFF] px-3 py-2"
                                    >
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                                        {label}
                                      </p>
                                      <p className="mt-1 text-sm font-semibold text-[#1F2937]">
                                        {value}
                                      </p>
                                    </div>
                                  ))}
                              </div>
                            ) : null}
                            {consultation.question ? (
                              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#1F2937]">
                                {consultation.question}
                              </p>
                            ) : null}

                            <div className="mt-4 grid gap-3">
                              {canAssignConsultations && !organizationLead ? (
                                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                                  <AdminSelect
                                    value={consultation.assigned_doctor_id ?? ''}
                                    disabled={pending}
                                    onChange={(event) =>
                                      runAction(
                                        () =>
                                          assignConsultationDoctor(
                                            consultation.id,
                                            event.target.value || null
                                          ),
                                        {
                                          successMessage: 'Consultation assignment шинэчлэгдлээ.',
                                        }
                                      )
                                    }
                                    className="disabled:opacity-60"
                                  >
                                    <option value="">Эмч оноогоогүй</option>
                                    {doctors.map((doctor) => (
                                      <option key={doctor.id} value={doctor.id}>
                                        {doctor.full_name} · {doctor.specialization}
                                      </option>
                                    ))}
                                  </AdminSelect>
                                  <div className="inline-flex items-center gap-2 rounded-xl bg-[#F7FAFF] px-4 py-3 text-sm font-semibold text-[#1E63B5]">
                                    <UserRoundPlus size={15} />
                                    Эмч оноох
                                  </div>
                                </div>
                              ) : organizationLead ? (
                                <div className="rounded-2xl bg-[#F7FAFF] p-3 text-sm text-[#1F2937]">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                                    Байгууллагын зөвлөгөө
                                  </p>
                                  <p className="mt-2 font-semibold">
                                    Энэ хүсэлтэд эмч оноохгүй. Зөвлөгөө, дараагийн алхмаа CRM note болон lead төлөв дээр тэмдэглэнэ.
                                  </p>
                                </div>
                              ) : (
                                <div className="rounded-2xl bg-[#F7FAFF] p-3 text-sm text-[#1F2937]">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                                    Оноосон эмч
                                  </p>
                                  <p className="mt-2 font-semibold">
                                    {consultation.doctors?.full_name ?? 'Одоогоор эмч оноогоогүй'}
                                  </p>
                                </div>
                              )}

                              {followUpStatuses.length > 0 ? (
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                                    Follow-up төлөв
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {followUpStatuses.map((status) => (
                                      <button
                                        key={status}
                                        type="button"
                                        disabled={pending || responseCount === 0}
                                        onClick={() =>
                                          runAction(
                                            () => updateConsultationStatusForStaff(consultation.id, status),
                                            {
                                              successMessage:
                                                'Consultation төлөв шинэчлэгдлээ.',
                                            }
                                          )
                                        }
                                        className={[
                                          'rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
                                          consultation.status === status
                                            ? 'border-[#B8D5FB] bg-[#EAF3FF] text-[#1E63B5]'
                                            : 'border-[#E5E7EB] bg-white text-[#6B7280]',
                                        ].join(' ')}
                                      >
                                        {consultationLabels[status]}
                                      </button>
                                    ))}
                                  </div>
                                  {responseCount === 0 ? (
                                    <p className="text-xs text-[#9CA3AF]">
                                      {organizationLead
                                        ? 'Энэ урсгалд эмчийн хариу шаардахгүй. Байгууллагатай харилцсан үр дүнгээ CRM note дээр үлдээнэ.'
                                        : 'Эмчийн хариу ирсний дараа operator дуудлагын follow-up хийнэ.'}
                                    </p>
                                  ) : null}
                                </div>
                              ) : null}

                              {responseCount > 0 ? (
                                <div className="space-y-2 rounded-2xl border border-[#CDEDD8] bg-[#F5FCF8] p-3">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-[#15803D]">
                                    Эмчийн хариулт
                                  </p>
                                  {consultation.doctor_responses?.map((response) => (
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
                        )
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[#9CA3AF]">Consultation хүсэлт байхгүй.</p>
                  )}
                </div>
              </div>

              {canManageLeadStatus ? (
                <div className="space-y-5 rounded-[28px] border border-[#E5E7EB] bg-[#FBFDFF] p-4">
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
                        {selectedLead.is_blacklisted
                          ? 'Blacklist-ээс гаргах'
                          : 'Blacklist болгох'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#1F2937]">CRM тэмдэглэл</p>
                  <span className="text-xs text-[#9CA3AF]">
                    {selectedLead.crm_notes?.length ?? 0} тэмдэглэл
                  </span>
                </div>

                <div className="max-h-64 space-y-3 overflow-y-auto rounded-[28px] border border-[#E5E7EB] bg-[#FBFDFF] p-4">
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
                    placeholder={resolvedNotePlaceholder}
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

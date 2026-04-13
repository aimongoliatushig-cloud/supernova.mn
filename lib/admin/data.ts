import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/admin/auth'
import { buildDateRange } from '@/lib/admin/date-format'
import type {
  AdminLead,
  CmsEntry,
  ConsultationWorkflowStatus,
  ContactSettings,
  DiagnosisAnswerOption,
  DiagnosisQuestion,
  Doctor,
  Promotion,
  Service,
  ServiceCategory,
  ServicePackage,
  SocialLink,
  SymptomCategory,
  UnifiedCalendarAppointment,
  WorkingHours,
  Role,
} from '@/lib/admin/types'
import {
  createServiceRoleClient,
  hasServiceRoleConfig,
} from '@/lib/supabase/service-role'

async function getAdminClient() {
  await requireRole(['super_admin'])
  return createClient()
}

async function getRoleAwareClient(roles: Role[]) {
  await requireRole(roles)
  return hasServiceRoleConfig() ? createServiceRoleClient() : createClient()
}

function getUlaanbaatarDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ulaanbaatar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value ?? '1970'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'

  return `${year}-${month}-${day}`
}

export async function getAdminOverviewData() {
  const supabase = await getAdminClient()

  const [
    { count: cms_entries },
    { count: doctors },
    { count: services },
    { count: packages },
    { count: promotions },
    { count: diagnosis_categories },
    { count: leads },
  ] = await Promise.all([
    supabase.from('landing_page_content').select('*', { count: 'exact', head: true }),
    supabase.from('doctors').select('*', { count: 'exact', head: true }),
    supabase.from('services').select('*', { count: 'exact', head: true }),
    supabase.from('service_packages').select('*', { count: 'exact', head: true }),
    supabase.from('promotions').select('*', { count: 'exact', head: true }),
    supabase.from('symptom_categories').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
  ])

  return {
    cms_entries: cms_entries ?? 0,
    doctors: doctors ?? 0,
    services: services ?? 0,
    packages: packages ?? 0,
    promotions: promotions ?? 0,
    diagnosis_categories: diagnosis_categories ?? 0,
    leads: leads ?? 0,
  }
}

export async function getCmsAdminData() {
  const supabase = await getAdminClient()

  const [{ data: entries }, { data: contact }, { data: socials }, { data: hours }] =
    await Promise.all([
      supabase
        .from('landing_page_content')
        .select('*')
        .order('section')
        .order('key'),
      supabase.from('contact_settings').select('*').limit(1).maybeSingle(),
      supabase.from('social_links').select('*').order('sort_order'),
      supabase.from('working_hours').select('*').order('sort_order'),
    ])

  return {
    entries: (entries ?? []) as CmsEntry[],
    contact: (contact ?? null) as ContactSettings | null,
    socials: (socials ?? []) as SocialLink[],
    hours: (hours ?? []) as WorkingHours[],
  }
}

export async function getDoctorsAdminData() {
  const supabase = await getAdminClient()

  const [{ data: doctors }, { data: services }] = await Promise.all([
    supabase
      .from('doctors')
      .select('*, doctor_services(service_id)')
      .order('sort_order')
      .order('full_name'),
    supabase.from('services').select('id, name').order('sort_order').order('name'),
  ])

  const profileIds = (doctors ?? [])
    .map((doctor) => doctor.profile_id)
    .filter((value): value is string => Boolean(value))

  const { data: profiles } =
    profileIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, email')
          .in('id', profileIds)
      : { data: [] as Array<{ id: string; email: string | null }> }

  const profileEmailLookup = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.email ?? null])
  )

  return {
    doctors: (doctors ?? []).map((doctor) => ({
      ...doctor,
      login_email: doctor.profile_id ? profileEmailLookup.get(doctor.profile_id) ?? null : null,
    })) as Doctor[],
    services: (services ?? []) as Pick<Service, 'id' | 'name'>[],
  }
}

export async function getStaffAccountsAdminData() {
  const supabase = await getAdminClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .in('role', ['office_assistant', 'super_admin'])
    .order('created_at', { ascending: false })

  return (profiles ?? []) as Array<{
    id: string
    email: string
    full_name: string | null
    role: 'office_assistant' | 'super_admin'
    created_at: string
  }>
}

export async function getServicesAdminData() {
  const supabase = await getAdminClient()

  const [{ data: categories }, { data: services }] = await Promise.all([
    supabase.from('service_categories').select('*').order('sort_order').order('name'),
    supabase.from('services').select('*').order('sort_order').order('name'),
  ])

  return {
    categories: (categories ?? []) as ServiceCategory[],
    services: (services ?? []) as Service[],
  }
}

export async function getPackagesAdminData() {
  const supabase = await getAdminClient()

  const [{ data: packages }, { data: services }] = await Promise.all([
    supabase
      .from('service_packages')
      .select('*, package_services(service_id)')
      .order('sort_order')
      .order('title'),
    supabase.from('services').select('id, name, price').order('sort_order').order('name'),
  ])

  return {
    packages: (packages ?? []) as ServicePackage[],
    services: (services ?? []) as Pick<Service, 'id' | 'name' | 'price'>[],
  }
}

export async function getPromotionsAdminData() {
  const supabase = await getAdminClient()

  const [{ data: promotions }, { data: services }, { data: packages }] = await Promise.all([
    supabase.from('promotions').select('*').order('created_at', { ascending: false }),
    supabase.from('services').select('id, name').order('sort_order').order('name'),
    supabase.from('service_packages').select('id, title').order('sort_order').order('title'),
  ])

  return {
    promotions: (promotions ?? []) as Promotion[],
    services: (services ?? []) as Pick<Service, 'id' | 'name'>[],
    packages: (packages ?? []) as Pick<ServicePackage, 'id' | 'title'>[],
  }
}

export async function getDiagnosisAdminData() {
  const supabase = await getAdminClient()

  const [{ data: categories }, { data: questions }, { data: answerOptions }] =
    await Promise.all([
      supabase.from('symptom_categories').select('*').order('sort_order').order('name'),
      supabase.from('questions').select('*').order('sort_order'),
      supabase.from('answer_options').select('*').order('sort_order'),
    ])

  return {
    categories: (categories ?? []) as SymptomCategory[],
    questions: (questions ?? []) as DiagnosisQuestion[],
    answerOptions: (answerOptions ?? []) as DiagnosisAnswerOption[],
  }
}

async function getCrmBoardData(roles: Role[]) {
  const supabase = await getRoleAwareClient(roles)
  const today = getUlaanbaatarDateKey()
  const calendarDays = buildDateRange(today, 7)

  const normalizeOne = <T,>(value: T | T[] | null | undefined): T | null => {
    if (Array.isArray(value)) {
      return value[0] ?? null
    }

    return value ?? null
  }

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(250)

  const leadRows = (leads ?? []) as AdminLead[]
  const leadIds = leadRows.map((lead) => lead.id)

  const [
    { data: assessments },
    { data: leadAppointments },
    { data: notes },
    { data: doctors },
    { data: appointments },
  ] = await Promise.all([
    leadIds.length > 0
      ? supabase
          .from('assessments')
          .select('id, lead_id, risk_level, risk_score, created_at')
          .in('lead_id', leadIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    leadIds.length > 0
      ? supabase
          .from('appointments')
          .select('id, lead_id, appointment_date, appointment_time, status, doctors(full_name), services(name)')
          .in('lead_id', leadIds)
          .order('appointment_date')
          .order('appointment_time')
      : Promise.resolve({ data: [] }),
    leadIds.length > 0
      ? supabase
          .from('crm_notes')
          .select('id, lead_id, author_id, note_text, created_at')
          .in('lead_id', leadIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      .from('doctors')
      .select('id, full_name, specialization, is_active, available_for_booking')
      .eq('is_active', true)
      .order('sort_order')
      .order('full_name'),
    supabase
      .from('appointments')
      .select(
        `
          id,
          appointment_date,
          appointment_time,
          status,
          notes,
          preparation_notice,
          leads(full_name, phone),
          doctors(full_name, specialization),
          services(name)
        `
      )
      .gte('appointment_date', today)
      .order('appointment_date')
      .order('appointment_time')
      .limit(250),
  ])

  const enhancedConsultations = leadIds.length
    ? await supabase
        .from('consultation_requests')
        .select(
          'id, lead_id, preferred_callback_time, question, status, assigned_doctor_id, assigned_at, doctors(full_name, specialization)'
        )
        .in('lead_id', leadIds)
        .order('created_at', { ascending: false })
    : { data: [], error: null }

  const { data: consultations } = enhancedConsultations.error
    ? await supabase
        .from('consultation_requests')
        .select('id, lead_id, preferred_callback_time, question, status')
        .in('lead_id', leadIds)
        .order('created_at', { ascending: false })
    : enhancedConsultations

  const consultationRows = (consultations ?? []) as Array<
    {
      id: string
      lead_id: string
      preferred_callback_time: string
      question: string | null
      status: ConsultationWorkflowStatus
      assigned_doctor_id?: string | null
      assigned_at?: string | null
      doctors?: { full_name: string | null; specialization?: string | null } | Array<{
        full_name: string | null
        specialization?: string | null
      }> | null
    }
  >

  const consultationIds = consultationRows.map((consultation) => consultation.id)

  const { data: responses } = consultationIds.length
    ? await supabase
        .from('doctor_responses')
        .select('id, consultation_id, response_text, created_at')
        .in('consultation_id', consultationIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const assessmentsByLead = new Map<string, NonNullable<AdminLead['assessments']>>()
  for (const assessment of (assessments ?? []) as Array<
    NonNullable<AdminLead['assessments']>[number] & { lead_id: string }
  >) {
    const collection = assessmentsByLead.get(assessment.lead_id) ?? []
    collection.push({
      id: assessment.id,
      risk_level: assessment.risk_level,
      risk_score: assessment.risk_score,
      created_at: assessment.created_at,
    })
    assessmentsByLead.set(assessment.lead_id, collection)
  }

  const leadAppointmentsByLead = new Map<string, NonNullable<AdminLead['appointments']>>()
  for (const appointment of (leadAppointments ?? []) as Array<
    NonNullable<AdminLead['appointments']>[number] & {
      lead_id: string
      doctors?: NonNullable<AdminLead['appointments']>[number]['doctors'] | Array<
        NonNullable<AdminLead['appointments']>[number]['doctors']
      >
      services?: NonNullable<AdminLead['appointments']>[number]['services'] | Array<
        NonNullable<AdminLead['appointments']>[number]['services']
      >
    }
  >) {
    const collection = leadAppointmentsByLead.get(appointment.lead_id) ?? []
    collection.push({
      id: appointment.id,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      status: appointment.status,
      doctors: normalizeOne(appointment.doctors),
      services: normalizeOne(appointment.services),
    })
    leadAppointmentsByLead.set(appointment.lead_id, collection)
  }

  const responsesByConsultation = new Map<
    string,
    NonNullable<AdminLead['consultation_requests']>[number]['doctor_responses']
  >()
  for (const response of (responses ?? []) as Array<{
    id: string
    consultation_id: string
    response_text: string
    created_at: string
  }>) {
    const collection = responsesByConsultation.get(response.consultation_id) ?? []
    collection.push({
      id: response.id,
      response_text: response.response_text,
      created_at: response.created_at,
    })
    responsesByConsultation.set(response.consultation_id, collection)
  }

  const consultationsByLead = new Map<string, NonNullable<AdminLead['consultation_requests']>>()
  for (const consultation of consultationRows) {
    const collection = consultationsByLead.get(consultation.lead_id) ?? []
    collection.push({
      id: consultation.id,
      preferred_callback_time: consultation.preferred_callback_time,
      question: consultation.question,
      status: consultation.status,
      assigned_doctor_id: consultation.assigned_doctor_id ?? null,
      assigned_at: consultation.assigned_at ?? null,
      doctors: normalizeOne(consultation.doctors),
      doctor_responses: responsesByConsultation.get(consultation.id) ?? [],
    })
    consultationsByLead.set(consultation.lead_id, collection)
  }

  const notesByLead = new Map<string, NonNullable<AdminLead['crm_notes']>>()
  for (const note of (notes ?? []) as Array<NonNullable<AdminLead['crm_notes']>[number] & { lead_id: string }>) {
    const collection = notesByLead.get(note.lead_id) ?? []
    collection.push({
      id: note.id,
      author_id: note.author_id,
      note_text: note.note_text,
      created_at: note.created_at,
    })
    notesByLead.set(note.lead_id, collection)
  }

  const normalizedLeads = leadRows.map((lead) => ({
    ...lead,
    assessments: assessmentsByLead.get(lead.id) ?? [],
    appointments: leadAppointmentsByLead.get(lead.id) ?? [],
    consultation_requests: consultationsByLead.get(lead.id) ?? [],
    crm_notes: notesByLead.get(lead.id) ?? [],
  }))

  const normalizedAppointments = ((appointments ?? []) as Array<
    UnifiedCalendarAppointment & {
      leads?: UnifiedCalendarAppointment['leads'] | UnifiedCalendarAppointment['leads'][]
      doctors?: UnifiedCalendarAppointment['doctors'] | UnifiedCalendarAppointment['doctors'][]
      services?: UnifiedCalendarAppointment['services'] | UnifiedCalendarAppointment['services'][]
    }
  >).map((appointment) => ({
    ...appointment,
    leads: Array.isArray(appointment.leads) ? appointment.leads[0] ?? null : appointment.leads,
    doctors: Array.isArray(appointment.doctors)
      ? appointment.doctors[0] ?? null
      : appointment.doctors,
    services: Array.isArray(appointment.services)
      ? appointment.services[0] ?? null
      : appointment.services,
  }))

  return {
    leads: normalizedLeads,
    doctors:
      (doctors ?? []) as Array<{
        id: string
        full_name: string
        specialization: string
        is_active: boolean
        available_for_booking: boolean
      }>,
    appointments: normalizedAppointments,
    calendarDays,
  }
}

export async function getCrmAdminData() {
  return getCrmBoardData(['super_admin'])
}

export async function getCrmStaffData() {
  return getCrmBoardData(['office_assistant', 'super_admin'])
}

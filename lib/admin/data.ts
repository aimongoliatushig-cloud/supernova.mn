import { createClient } from '@/lib/supabase/server'
import { buildDateRange } from '@/lib/admin/date-format'
import {
  createServiceRoleClient,
  hasServiceRoleConfig,
} from '@/lib/supabase/service-role'
import { requireRole } from '@/lib/admin/auth'
import type {
  AdminLead,
  BlogArticle,
  BlogCategory,
  CmsEntry,
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

async function getAdminClient() {
  const viewer = await requireRole(['super_admin'])

  if (viewer.role === 'super_admin' && hasServiceRoleConfig()) {
    return createServiceRoleClient()
  }

  return createClient()
}

async function getRoleAwareClient(
  roles: Role[],
  options?: { serviceRoleFor?: Role[] }
) {
  const viewer = await requireRole(roles)

  if (
    hasServiceRoleConfig() &&
    (viewer.role === 'super_admin' || options?.serviceRoleFor?.includes(viewer.role))
  ) {
    return createServiceRoleClient()
  }

  return createClient()
}

export async function getAdminOverviewData() {
  const supabase = await getAdminClient()

  const [
    { count: cms_entries },
    { count: doctors },
    { count: services },
    { count: packages },
    { count: promotions },
    { count: blog_articles },
    { count: diagnosis_categories },
    { count: leads },
  ] = await Promise.all([
    supabase.from('landing_page_content').select('*', { count: 'exact', head: true }),
    supabase.from('doctors').select('*', { count: 'exact', head: true }),
    supabase.from('services').select('*', { count: 'exact', head: true }),
    supabase.from('service_packages').select('*', { count: 'exact', head: true }),
    supabase.from('promotions').select('*', { count: 'exact', head: true }),
    supabase.from('blog_articles').select('*', { count: 'exact', head: true }),
    supabase.from('symptom_categories').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
  ])

  return {
    cms_entries: cms_entries ?? 0,
    doctors: doctors ?? 0,
    services: services ?? 0,
    packages: packages ?? 0,
    promotions: promotions ?? 0,
    blog_articles: blog_articles ?? 0,
    diagnosis_categories: diagnosis_categories ?? 0,
    leads: leads ?? 0,
  }
}

async function getBlogDashboardData(roles: Role[]) {
  const supabase = await getRoleAwareClient(roles, {
    serviceRoleFor: ['office_assistant', 'super_admin'],
  })

  const [{ data: categories }, { data: articles }] = await Promise.all([
    supabase.from('blog_categories').select('*').order('sort_order').order('name'),
    supabase
      .from('blog_articles')
      .select(
        'id, category_id, title, slug, excerpt, content, image_url, cta_label, cta_link, is_published, published_at, publisher_id, publisher_name, view_count, created_at, updated_at, categories:blog_categories(id, name, slug)'
      )
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
  ])

  return {
    categories: (categories ?? []) as BlogCategory[],
    articles: (articles ?? []).map((article) => ({
      ...article,
      categories: unwrapRelation(article.categories),
    })) as BlogArticle[],
  }
}

export async function getBlogAdminData() {
  return getBlogDashboardData(['super_admin'])
}

export async function getBlogStaffAnalyticsData() {
  return getBlogDashboardData(['office_assistant', 'super_admin'])
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
    .in('role', ['office_assistant', 'operator', 'organization_consultant', 'super_admin'])
    .order('created_at', { ascending: false })

  return (profiles ?? []) as Array<{
    id: string
    email: string
    full_name: string | null
    role: 'office_assistant' | 'operator' | 'organization_consultant' | 'super_admin'
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

type LeadScope = 'all' | 'patient' | 'organization'

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

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

async function getCrmBoardData(roles: Role[], leadScope: LeadScope = 'all') {
  const supabase = await getRoleAwareClient(roles, {
    serviceRoleFor: ['office_assistant', 'operator', 'organization_consultant', 'super_admin'],
  })

  let leadQuery = supabase
    .from('leads')
    .select(
      'id, full_name, phone, email, risk_level, risk_score, status, source, notes, categories_selected, is_blacklisted, created_at, updated_at'
    )
    .order('created_at', { ascending: false })
    .limit(250)

  if (leadScope === 'organization') {
    leadQuery = leadQuery.eq('source', 'organization_consultation_request')
  } else if (leadScope === 'patient') {
    leadQuery = leadQuery.or('source.is.null,source.neq.organization_consultation_request')
  }

  const { data: leadRows, error: leadsError } = await leadQuery

  if (leadsError) {
    throw new Error(leadsError.message)
  }

  const leads = (leadRows ?? []) as AdminLead[]
  const leadIds = leads.map((lead) => lead.id)

  const assessmentsByLead = new Map<string, NonNullable<AdminLead['assessments']>>()
  const leadAppointmentsByLead = new Map<string, NonNullable<AdminLead['appointments']>>()
  const consultationsByLead = new Map<string, NonNullable<AdminLead['consultation_requests']>>()
  const notesByLead = new Map<string, NonNullable<AdminLead['crm_notes']>>()

  if (leadIds.length > 0 && leadScope !== 'organization') {
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id, lead_id, risk_level, risk_score, created_at')
      .in('lead_id', leadIds)
      .order('created_at', { ascending: false })

    for (const assessment of assessments ?? []) {
      const current = assessmentsByLead.get(assessment.lead_id) ?? []
      current.push({
        id: assessment.id,
        risk_level: assessment.risk_level,
        risk_score: assessment.risk_score,
        created_at: assessment.created_at,
      })
      assessmentsByLead.set(assessment.lead_id, current)
    }

    const { data: leadAppointments } = await supabase
      .from('appointments')
      .select('id, lead_id, appointment_date, appointment_time, status, doctors(full_name), services(name)')
      .in('lead_id', leadIds)
      .order('appointment_date')
      .order('appointment_time')

    for (const appointment of leadAppointments ?? []) {
      const current = leadAppointmentsByLead.get(appointment.lead_id) ?? []
      current.push({
        id: appointment.id,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        status: appointment.status,
        doctors: unwrapRelation(appointment.doctors),
        services: unwrapRelation(appointment.services),
      })
      leadAppointmentsByLead.set(appointment.lead_id, current)
    }
  }

  if (leadIds.length > 0) {
    const { data: crmNotes } = await supabase
      .from('crm_notes')
      .select('id, lead_id, author_id, note_text, created_at')
      .in('lead_id', leadIds)
      .order('created_at', { ascending: false })

    for (const note of crmNotes ?? []) {
      const current = notesByLead.get(note.lead_id) ?? []
      current.push({
        id: note.id,
        author_id: note.author_id,
        note_text: note.note_text,
        created_at: note.created_at,
      })
      notesByLead.set(note.lead_id, current)
    }

    const enhancedConsultations = await supabase
      .from('consultation_requests')
      .select(
        'id, lead_id, preferred_callback_time, question, status, assigned_doctor_id, assigned_at, doctors(full_name, specialization), doctor_responses(id, response_text, created_at)'
      )
      .in('lead_id', leadIds)
      .order('created_at', { ascending: false })

    const fallbackConsultations = enhancedConsultations.error
      ? await supabase
          .from('consultation_requests')
          .select(
            'id, lead_id, preferred_callback_time, question, status, doctor_responses(id, response_text, created_at)'
          )
          .in('lead_id', leadIds)
          .order('created_at', { ascending: false })
      : enhancedConsultations

    for (const consultation of fallbackConsultations.data ?? []) {
      const consultationRow = consultation as {
        id: string
        lead_id: string
        preferred_callback_time: string
        question: string | null
        status: AdminLead['consultation_requests'] extends Array<infer Item>
          ? Item extends { status: infer Status }
            ? Status
            : never
          : never
        assigned_doctor_id?: string | null
        assigned_at?: string | null
        doctors?: { full_name: string | null; specialization?: string | null } | Array<{
          full_name: string | null
          specialization?: string | null
        }> | null
        doctor_responses?: Array<{
          id: string
          response_text: string
          created_at: string
        }> | null
      }
      const current = consultationsByLead.get(consultationRow.lead_id) ?? []
      current.push({
        id: consultationRow.id,
        preferred_callback_time: consultationRow.preferred_callback_time,
        question: consultationRow.question,
        status: consultationRow.status,
        assigned_doctor_id: consultationRow.assigned_doctor_id ?? null,
        assigned_at: consultationRow.assigned_at ?? null,
        doctors: unwrapRelation(consultationRow.doctors),
        doctor_responses: Array.isArray(consultationRow.doctor_responses)
          ? consultationRow.doctor_responses
          : [],
      })
      consultationsByLead.set(consultationRow.lead_id, current)
    }
  }

  const normalizedLeads = leads.map((lead) => ({
    ...lead,
    assessments: assessmentsByLead.get(lead.id) ?? [],
    appointments: leadAppointmentsByLead.get(lead.id) ?? [],
    consultation_requests: consultationsByLead.get(lead.id) ?? [],
    crm_notes: notesByLead.get(lead.id) ?? [],
  }))

  const calendarStart = getUlaanbaatarDateKey()
  const calendarDays = leadScope === 'organization' ? [] : buildDateRange(calendarStart, 7)

  const { data: doctorRows } =
    leadScope === 'organization'
      ? {
          data: [] as Array<{
            id: string
            full_name: string
            specialization: string
            is_active: boolean
            available_for_booking: boolean
          }>,
        }
      : await supabase
          .from('doctors')
          .select('id, full_name, specialization, is_active, available_for_booking')
          .eq('is_active', true)
          .order('sort_order')
          .order('full_name')

  const { data: serviceRows } =
    leadScope === 'organization'
      ? { data: [] as Pick<Service, 'id' | 'name'>[] }
      : await supabase
          .from('services')
          .select('id, name')
          .eq('is_active', true)
          .eq('show_on_booking', true)
          .order('sort_order')
          .order('name')

  const { data: upcomingAppointments } =
    leadScope === 'organization'
      ? { data: [] as UnifiedCalendarAppointment[] }
      : await supabase
          .from('appointments')
          .select(
            'id, appointment_date, appointment_time, status, notes, preparation_notice, leads(full_name, phone), doctors(full_name, specialization), services(name)'
          )
          .gte('appointment_date', calendarStart)
          .order('appointment_date')
          .order('appointment_time')
          .limit(250)

  return {
    leads: normalizedLeads,
    doctors:
      (doctorRows ?? []) as Array<{
        id: string
        full_name: string
        specialization: string
        is_active: boolean
        available_for_booking: boolean
      }>,
    appointments: ((upcomingAppointments ?? []) as UnifiedCalendarAppointment[]).map(
      (appointment) => ({
        ...appointment,
        leads: unwrapRelation(appointment.leads),
        doctors: unwrapRelation(appointment.doctors),
        services: unwrapRelation(appointment.services),
      })
    ),
    calendarDays,
    services: (serviceRows ?? []) as Pick<Service, 'id' | 'name'>[],
  }
}

export async function getCrmAdminData() {
  return getCrmBoardData(['super_admin'], 'all')
}

export async function getCrmStaffData() {
  return getCrmBoardData(['office_assistant', 'operator', 'super_admin'], 'patient')
}

export async function getOrganizationConsultantCrmData() {
  const { leads } = await getCrmBoardData(['organization_consultant', 'super_admin'], 'organization')

  return {
    leads,
    doctors: [] as Array<{
      id: string
      full_name: string
      specialization: string
      is_active: boolean
      available_for_booking: boolean
    }>,
  }
}

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/admin/auth'
import type {
  AdminLead,
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
  await requireRole(['super_admin'])
  return createClient()
}

async function getRoleAwareClient(roles: Role[]) {
  await requireRole(roles)
  return createClient()
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

  const baseSelect = `
    *,
    assessments(id, risk_level, risk_score, created_at),
    appointments(id, appointment_date, appointment_time, status, doctors(full_name), services(name)),
    crm_notes(id, author_id, note_text, created_at)
  `

  const enhancedConsultationSelect = `
    consultation_requests(
      id,
      preferred_callback_time,
      question,
      status,
      assigned_doctor_id,
      assigned_at,
      doctors(full_name, specialization),
      doctor_responses(id, response_text, created_at)
    )
  `

  const legacyConsultationSelect = `
    consultation_requests(
      id,
      preferred_callback_time,
      question,
      status,
      doctor_responses(id, response_text, created_at)
    )
  `

  const enhancedQuery = await supabase
    .from('leads')
    .select(`${baseSelect}, ${enhancedConsultationSelect}`)
    .order('created_at', { ascending: false })
    .limit(250)

  const { data: leads } = enhancedQuery.error
    ? await supabase
        .from('leads')
        .select(`${baseSelect}, ${legacyConsultationSelect}`)
        .order('created_at', { ascending: false })
        .limit(250)
    : enhancedQuery

  const { data: doctors } = await supabase
    .from('doctors')
    .select('id, full_name, specialization, is_active, available_for_booking')
    .eq('is_active', true)
    .order('sort_order')
    .order('full_name')

  const { data: appointments } = await supabase
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
    .limit(250)

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
    leads: (leads ?? []) as AdminLead[],
    doctors:
      (doctors ?? []) as Array<{
        id: string
        full_name: string
        specialization: string
        is_active: boolean
        available_for_booking: boolean
      }>,
    appointments: normalizedAppointments,
  }
}

export async function getCrmAdminData() {
  return getCrmBoardData(['super_admin'])
}

export async function getCrmStaffData() {
  return getCrmBoardData(['office_assistant', 'super_admin'])
}

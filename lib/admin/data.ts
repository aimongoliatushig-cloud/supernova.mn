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
  WorkingHours,
} from '@/lib/admin/types'

async function getAdminClient() {
  await requireRole(['super_admin'])
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

  return {
    doctors: (doctors ?? []) as Doctor[],
    services: (services ?? []) as Pick<Service, 'id' | 'name'>[],
  }
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

export async function getCrmAdminData() {
  const supabase = await getAdminClient()

  const { data: leads } = await supabase
    .from('leads')
    .select(
      `
        *,
        assessments(id, risk_level, risk_score, created_at),
        appointments(id, appointment_date, appointment_time, status, doctors(full_name), services(name)),
        consultation_requests(id, preferred_callback_time, question, status, doctor_responses(id, response_text, created_at)),
        crm_notes(id, author_id, note_text, created_at)
      `
    )
    .order('created_at', { ascending: false })
    .limit(250)

  return (leads ?? []) as AdminLead[]
}

import { createClient } from '@/lib/supabase/server'
import type {
  PublicAssessmentResult,
  PublicBookingData,
  PublicCmsContent,
  PublicDiagnosisCategory,
  PublicDiagnosisData,
  PublicDiagnosisOption,
  PublicDiagnosisQuestion,
  PublicDoctor,
  PublicLandingData,
  PublicPromotion,
  PublicResultData,
  PublicService,
  PublicServiceCategory,
  PublicServicePackage,
} from '@/lib/public/types'

async function getPublicSupabase() {
  return createClient()
}

type RelationValue<T> = T | T[] | null | undefined

interface RawService {
  id: string
  name: string
  description: string | null
  price: number | string | null
  duration_minutes: number | string | null
  preparation_notice: string | null
  promotion_flag: boolean | null
  category_id: string | null
  categories?: RelationValue<PublicServiceCategory>
}

interface RawPackageService {
  service_id: string
  services?: RelationValue<{
    id: string
    name: string
  }>
}

interface RawPackage {
  id: string
  title: string
  description: string | null
  price: number | string | null
  old_price: number | string | null
  promotion_text: string | null
  badge_text: string | null
  badge_color: string
  package_services?: RawPackageService[]
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

function normalizeService(service: RawService): PublicService {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    price: Number(service.price ?? 0),
    duration_minutes: Number(service.duration_minutes ?? 0),
    preparation_notice: service.preparation_notice,
    promotion_flag: Boolean(service.promotion_flag),
    category_id: service.category_id,
    categories: firstRelation(service.categories),
  }
}

function normalizePackage(pkg: RawPackage): PublicServicePackage {
  return {
    id: pkg.id,
    title: pkg.title,
    description: pkg.description,
    price: Number(pkg.price ?? 0),
    old_price: pkg.old_price == null ? null : Number(pkg.old_price),
    promotion_text: pkg.promotion_text,
    badge_text: pkg.badge_text,
    badge_color: pkg.badge_color,
    package_services: (pkg.package_services ?? []).map((relation) => ({
      service_id: relation.service_id,
      services: firstRelation(relation.services),
    })),
  }
}

async function getCmsContent(): Promise<PublicCmsContent> {
  const supabase = await getPublicSupabase()

  const [{ data: entries }, { data: contact }, { data: socials }, { data: workingHours }] =
    await Promise.all([
      supabase.from('landing_page_content').select('key, value'),
      supabase.from('contact_settings').select('phone, address, email, map_embed').limit(1).maybeSingle(),
      supabase
        .from('social_links')
        .select('id, platform, url, sort_order')
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('working_hours')
        .select('id, day_label, open_time, close_time, sort_order')
        .eq('is_active', true)
        .order('sort_order'),
    ])

  const entryMap = Object.fromEntries(
    (entries ?? []).map((entry) => [entry.key, entry.value ?? ''])
  ) as Record<string, string>

  return {
    entries: entryMap,
    contact: contact ?? null,
    socials: socials ?? [],
    workingHours: workingHours ?? [],
  }
}

export async function getLandingPageData(): Promise<PublicLandingData> {
  const supabase = await getPublicSupabase()
  const cms = await getCmsContent()

  const [
    { data: doctors },
    { data: services },
    { data: packages },
    { data: promotions },
    { data: serviceCategories },
  ] = await Promise.all([
    supabase
      .from('doctors')
      .select('id, full_name, title, specialization, experience_years, bio, photo_url, schedule_summary')
      .eq('is_active', true)
      .eq('show_on_landing', true)
      .order('sort_order')
      .order('full_name'),
    supabase
      .from('services')
      .select(
        'id, name, description, price, duration_minutes, preparation_notice, promotion_flag, category_id, categories:service_categories(id, name, icon)'
      )
      .eq('is_active', true)
      .eq('show_on_landing', true)
      .order('sort_order')
      .order('name'),
    supabase
      .from('service_packages')
      .select(
        'id, title, description, price, old_price, promotion_text, badge_text, badge_color, package_services(service_id, services(id, name))'
      )
      .eq('is_active', true)
      .eq('show_on_landing', true)
      .order('sort_order')
      .order('title'),
    supabase
      .from('promotions')
      .select(
        'id, title, description, discount_percent, discount_amount, free_gift, badge_text, badge_color, service_id, package_id'
      )
      .eq('is_active', true)
      .eq('show_on_landing', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('service_categories')
      .select('id, name, icon')
      .eq('is_active', true)
      .order('sort_order')
      .order('name'),
  ])

  return {
    ...cms,
    doctors: (doctors ?? []) as PublicDoctor[],
    services: (services ?? []).map((service) => normalizeService(service)),
    packages: (packages ?? []).map((pkg) => normalizePackage(pkg)),
    promotions: (promotions ?? []) as PublicPromotion[],
    serviceCategories: (serviceCategories ?? []) as PublicServiceCategory[],
  }
}

export async function getDiagnosisFlowData(): Promise<PublicDiagnosisData> {
  const supabase = await getPublicSupabase()
  const cms = await getCmsContent()

  const { data: categories } = await supabase
    .from('symptom_categories')
    .select('id, name, slug, icon, description, sort_order')
    .eq('is_active', true)
    .order('sort_order')
    .order('name')

  const categoryIds = (categories ?? []).map((category) => category.id)

  if (categoryIds.length === 0) {
    return {
      ...cms,
      categories: [],
    }
  }

  const { data: questions } = await supabase
    .from('questions')
    .select(
      'id, category_id, question_text, help_text, question_type, sort_order, is_required, risk_weight'
    )
    .eq('is_active', true)
    .in('category_id', categoryIds)
    .order('sort_order')

  const questionIds = (questions ?? []).map((question) => question.id)

  const { data: answerOptions } = questionIds.length
    ? await supabase
        .from('answer_options')
        .select('id, question_id, option_text, recommendation, risk_score, sort_order')
        .eq('is_active', true)
        .in('question_id', questionIds)
        .order('sort_order')
    : { data: [] }

  const optionsByQuestion = new Map<string, PublicDiagnosisOption[]>()
  for (const option of (answerOptions ?? []) as Array<PublicDiagnosisOption & { question_id: string }>) {
    const questionOptions = optionsByQuestion.get(option.question_id) ?? []
    questionOptions.push({
      id: option.id,
      option_text: option.option_text,
      recommendation: option.recommendation,
      risk_score: option.risk_score,
      sort_order: option.sort_order,
    })
    optionsByQuestion.set(option.question_id, questionOptions)
  }

  const questionsByCategory = new Map<string, PublicDiagnosisQuestion[]>()
  for (const question of (questions ?? []) as Array<PublicDiagnosisQuestion>) {
    const normalizedQuestion: PublicDiagnosisQuestion = {
      ...question,
      options: optionsByQuestion.get(question.id) ?? [],
    }

    if (normalizedQuestion.options.length === 0) {
      continue
    }

    const categoryQuestions = questionsByCategory.get(question.category_id) ?? []
    categoryQuestions.push(normalizedQuestion)
    questionsByCategory.set(question.category_id, categoryQuestions)
  }

  const normalizedCategories = ((categories ?? []) as PublicDiagnosisCategory[])
    .map((category) => ({
      ...category,
      questions: questionsByCategory.get(category.id) ?? [],
    }))
    .filter((category) => category.questions.length > 0)

  return {
    ...cms,
    categories: normalizedCategories,
  }
}

export async function getBookingPageData(): Promise<PublicBookingData> {
  const supabase = await getPublicSupabase()
  const cms = await getCmsContent()

  const [{ data: doctors }, { data: services }] = await Promise.all([
    supabase
      .from('doctors')
      .select(
        'id, full_name, title, specialization, experience_years, bio, photo_url, schedule_summary, doctor_services(service_id)'
      )
      .eq('is_active', true)
      .eq('available_for_booking', true)
      .order('sort_order')
      .order('full_name'),
    supabase
      .from('services')
      .select(
        'id, name, description, price, duration_minutes, preparation_notice, promotion_flag, category_id, categories:service_categories(id, name, icon)'
      )
      .eq('is_active', true)
      .eq('show_on_booking', true)
      .order('sort_order')
      .order('name'),
  ])

  return {
    ...cms,
    doctors: (doctors ?? []) as PublicDoctor[],
    services: (services ?? []).map((service) => normalizeService(service)),
  }
}

export async function getResultPageData(assessmentId: string): Promise<PublicResultData | null> {
  const supabase = await getPublicSupabase()
  const cms = await getCmsContent()

  const { data: assessment } = await supabase
    .from('assessments')
    .select(
      'id, lead_id, risk_level, risk_score, created_at, leads(full_name, phone, email, categories_selected)'
    )
    .eq('id', assessmentId)
    .maybeSingle()

  const lead = assessment ? firstRelation(assessment.leads) : null

  if (!assessment || !lead) {
    return null
  }

  const [{ data: doctors }, { data: services }, { data: packages }, { data: promotions }] =
    await Promise.all([
      supabase
        .from('doctors')
        .select('id, full_name, title, specialization, experience_years, bio, photo_url, schedule_summary')
        .eq('is_active', true)
        .eq('available_for_booking', true)
        .order('sort_order')
        .order('full_name'),
      supabase
        .from('services')
        .select(
          'id, name, description, price, duration_minutes, preparation_notice, promotion_flag, category_id, categories:service_categories(id, name, icon)'
        )
        .eq('is_active', true)
        .eq('show_on_result', true)
        .order('promotion_flag', { ascending: false })
        .order('sort_order')
        .order('name'),
      supabase
        .from('service_packages')
        .select(
          'id, title, description, price, old_price, promotion_text, badge_text, badge_color, package_services(service_id, services(id, name))'
        )
        .eq('is_active', true)
        .eq('show_on_result', true)
        .order('sort_order')
        .order('title'),
      supabase
        .from('promotions')
        .select(
          'id, title, description, discount_percent, discount_amount, free_gift, badge_text, badge_color, service_id, package_id'
        )
        .eq('is_active', true)
        .eq('show_on_result', true)
        .order('created_at', { ascending: false }),
    ])

  return {
    ...cms,
    assessment: {
      assessment_id: assessment.id,
      lead_id: assessment.lead_id,
      full_name: lead.full_name,
      phone: lead.phone,
      email: lead.email,
      risk_level: assessment.risk_level,
      risk_score: Number(assessment.risk_score ?? 0),
      categories_selected: lead.categories_selected ?? [],
      created_at: assessment.created_at,
    } as PublicAssessmentResult,
    doctors: (doctors ?? []) as PublicDoctor[],
    services: (services ?? []).map((service) => normalizeService(service)),
    packages: (packages ?? []).map((pkg) => normalizePackage(pkg)),
    promotions: (promotions ?? []) as PublicPromotion[],
  }
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/admin/auth'
import type {
  AdminActionResult,
  CmsEntryInput,
  ContactSettingsInput,
  CrmNoteInput,
  DiagnosisAnswerOptionInput,
  DiagnosisQuestionInput,
  DoctorInput,
  LeadStatus,
  PromotionInput,
  ServiceCategoryInput,
  ServiceInput,
  ServicePackageInput,
  SocialLinkInput,
  SymptomCategoryInput,
  WorkingHoursInput,
} from '@/lib/admin/types'

const ADMIN_PATHS = [
  '/dashboard/admin',
  '/dashboard/admin/cms',
  '/dashboard/admin/doctors',
  '/dashboard/admin/services',
  '/dashboard/admin/packages',
  '/dashboard/admin/promotions',
  '/dashboard/admin/diagnosis',
  '/dashboard/admin/crm',
]

const PUBLIC_PATHS = ['/', '/check', '/appointment', '/consultation', '/result', '/results']

async function getAdminSupabase() {
  await requireRole(['super_admin'])
  return createClient()
}

function ok(message?: string): AdminActionResult {
  return { ok: true, message }
}

function fail(error: string): AdminActionResult {
  return { ok: false, error }
}

function trimToNull(value: string | null | undefined) {
  const normalized = value?.trim() ?? ''
  return normalized.length > 0 ? normalized : null
}

function clampNumber(value: number, fallback = 0) {
  return Number.isFinite(value) ? value : fallback
}

function revalidateAdminAndPublic(extraPaths: string[] = []) {
  for (const path of [...ADMIN_PATHS, ...PUBLIC_PATHS, ...extraPaths]) {
    revalidatePath(path)
  }
}

export async function saveCmsEntry(input: CmsEntryInput): Promise<AdminActionResult> {
  if (!input.key.trim() || !input.label.trim() || !input.section.trim()) {
    return fail('Түлхүүр, гарчиг, хэсгийн нэр шаардлагатай.')
  }

  const supabase = await getAdminSupabase()
  const payload = {
    key: input.key.trim(),
    label: input.label.trim(),
    section: input.section.trim(),
    value: input.value.trim(),
    updated_at: new Date().toISOString(),
  }

  const query = input.id
    ? supabase
        .from('landing_page_content')
        .update(payload)
        .eq('id', input.id)
    : supabase.from('landing_page_content').insert(payload)

  const { error } = await query

  if (error) {
    return fail(error.message)
  }

  revalidateAdminAndPublic()
  return ok('CMS мэдээлэл хадгалагдлаа.')
}

export async function deleteCmsEntry(id: string): Promise<AdminActionResult> {
  const supabase = await getAdminSupabase()
  const { error } = await supabase.from('landing_page_content').delete().eq('id', id)

  if (error) {
    return fail(error.message)
  }

  revalidateAdminAndPublic()
  return ok('CMS мөр устгагдлаа.')
}

export async function saveContactSettings(
  input: ContactSettingsInput
): Promise<AdminActionResult> {
  const supabase = await getAdminSupabase()
  const payload = {
    phone: trimToNull(input.phone),
    address: trimToNull(input.address),
    email: trimToNull(input.email),
    map_embed: trimToNull(input.map_embed),
    updated_at: new Date().toISOString(),
  }

  const query = input.id
    ? supabase.from('contact_settings').update(payload).eq('id', input.id)
    : supabase.from('contact_settings').insert(payload)

  const { error } = await query

  if (error) {
    return fail(error.message)
  }

  revalidateAdminAndPublic()
  return ok('Холбоо барих мэдээлэл шинэчлэгдлээ.')
}

export async function saveSocialLink(input: SocialLinkInput): Promise<AdminActionResult> {
  if (!input.platform.trim() || !input.url.trim()) {
    return fail('Платформ болон холбоос хоёулаа шаардлагатай.')
  }

  const supabase = await getAdminSupabase()
  const payload = {
    platform: input.platform.trim(),
    url: input.url.trim(),
    is_active: input.is_active,
    sort_order: clampNumber(input.sort_order),
  }

  const query = input.id
    ? supabase.from('social_links').update(payload).eq('id', input.id)
    : supabase.from('social_links').insert(payload)

  const { error } = await query

  if (error) {
    return fail(error.message)
  }

  revalidateAdminAndPublic()
  return ok('Сошиал холбоос хадгалагдлаа.')
}

export async function deleteSocialLink(id: string): Promise<AdminActionResult> {
  const supabase = await getAdminSupabase()
  const { error } = await supabase.from('social_links').delete().eq('id', id)

  if (error) {
    return fail(error.message)
  }

  revalidateAdminAndPublic()
  return ok('Сошиал холбоос устгагдлаа.')
}

export async function saveWorkingHours(
  input: WorkingHoursInput
): Promise<AdminActionResult> {
  if (!input.day_label.trim() || !input.open_time.trim() || !input.close_time.trim()) {
    return fail('Өдөр, нээх цаг, хаах цаг шаардлагатай.')
  }

  const supabase = await getAdminSupabase()
  const payload = {
    day_label: input.day_label.trim(),
    open_time: input.open_time.trim(),
    close_time: input.close_time.trim(),
    is_active: input.is_active,
    sort_order: clampNumber(input.sort_order),
  }

  const query = input.id
    ? supabase.from('working_hours').update(payload).eq('id', input.id)
    : supabase.from('working_hours').insert(payload)

  const { error } = await query

  if (error) {
    return fail(error.message)
  }

  revalidateAdminAndPublic()
  return ok('Ажиллах цаг хадгалагдлаа.')
}

export async function deleteWorkingHours(id: string): Promise<AdminActionResult> {
  const supabase = await getAdminSupabase()
  const { error } = await supabase.from('working_hours').delete().eq('id', id)

  if (error) {
    return fail(error.message)
  }

  revalidateAdminAndPublic()
  return ok('Ажиллах цагийн мөр устгагдлаа.')
}

export async function saveDoctor(input: DoctorInput): Promise<AdminActionResult> {
  if (!input.full_name.trim() || !input.specialization.trim()) {
    return fail('Эмчийн нэр болон мэргэшил шаардлагатай.')
  }

  const supabase = await getAdminSupabase()
  const payload = {
    full_name: input.full_name.trim(),
    title: input.title.trim() || 'Эмч',
    specialization: input.specialization.trim(),
    experience_years: clampNumber(input.experience_years),
    bio: trimToNull(input.bio),
    photo_url: trimToNull(input.photo_url),
    schedule_summary: trimToNull(input.schedule_summary),
    is_active: input.is_active,
    show_on_landing: input.show_on_landing,
    available_for_booking: input.available_for_booking,
    sort_order: clampNumber(input.sort_order),
  }

  const doctorQuery = input.id
    ? supabase.from('doctors').update(payload).eq('id', input.id).select('id').single()
    : supabase.from('doctors').insert(payload).select('id').single()

  const { data, error } = await doctorQuery

  if (error || !data) {
    return fail(error?.message ?? 'Эмч хадгалах үед алдаа гарлаа.')
  }

  await supabase.from('doctor_services').delete().eq('doctor_id', data.id)

  if (input.service_ids.length > 0) {
    const { error: relationError } = await supabase.from('doctor_services').insert(
      input.service_ids.map((service_id) => ({
        doctor_id: data.id,
        service_id,
      }))
    )

    if (relationError) {
      return fail(relationError.message)
    }
  }

  revalidateAdminAndPublic()
  return ok('Эмчийн мэдээлэл хадгалагдлаа.')
}

export async function deleteDoctor(id: string): Promise<AdminActionResult> {
  const supabase = await getAdminSupabase()
  const { error } = await supabase.from('doctors').delete().eq('id', id)

  if (error) {
    return fail(error.message)
  }

  revalidateAdminAndPublic()
  return ok('Эмчийн бүртгэл устгагдлаа.')
}

export async function saveServiceCategory(
  input: ServiceCategoryInput
): Promise<AdminActionResult> {
  if (!input.name.trim()) {
    return fail('Ангиллын нэр шаардлагатай.')
  }

  const supabase = await getAdminSupabase()
  const payload = {
    name: input.name.trim(),
    icon: input.icon.trim() || '🏥',
    sort_order: clampNumber(input.sort_order),
    is_active: input.is_active,
  }

  const query = input.id
    ? supabase.from('service_categories').update(payload).eq('id', input.id)
    : supabase.from('service_categories').insert(payload)

  const { error } = await query

  if (error) {
    return fail(error.message)
  }

  revalidateAdminAndPublic()
  return ok('Үйлчилгээний ангилал хадгалагдлаа.')
}

export async function deleteServiceCategory(id: string): Promise<AdminActionResult> {
  const supabase = await getAdminSupabase()
  const { error } = await supabase.from('service_categories').delete().eq('id', id)

  if (error) {
    return fail('Ангиллыг устгах боломжгүй байна. Эхлээд холбоотой үйлчилгээнүүдийг шалгана уу.')
  }

  revalidateAdminAndPublic()
  return ok('Ангилал устгагдлаа.')
}

export async function saveService(input: ServiceInput): Promise<AdminActionResult> {
  if (!input.name.trim()) {
    return fail('Үйлчилгээний нэр шаардлагатай.')
  }

  const supabase = await getAdminSupabase()
  const payload = {
    name: input.name.trim(),
    category_id: input.category_id,
    description: trimToNull(input.description),
    price: clampNumber(input.price),
    duration_minutes: clampNumber(input.duration_minutes, 30),
    preparation_notice: trimToNull(input.preparation_notice),
    promotion_flag: input.promotion_flag,
    is_active: input.is_active,
    show_on_landing: input.show_on_landing,
    show_on_result: input.show_on_result,
    show_on_booking: input.show_on_booking,
    sort_order: clampNumber(input.sort_order),
  }

  const query = input.id
    ? supabase.from('services').update(payload).eq('id', input.id)
    : supabase.from('services').insert(payload)

  const { error } = await query

  if (error) {
    return fail(error.message)
  }

  revalidateAdminAndPublic()
  return ok('Үйлчилгээ хадгалагдлаа.')
}

export async function deleteService(id: string): Promise<AdminActionResult> {
  const supabase = await getAdminSupabase()
  const { error } = await supabase.from('services').delete().eq('id', id)

  if (error) {
    return fail('Үйлчилгээг устгах боломжгүй байна. Хамааралтай багц, урамшууллыг шалгана уу.')
  }

  revalidateAdminAndPublic()
  return ok('Үйлчилгээ устгагдлаа.')
}

export async function savePackage(input: ServicePackageInput): Promise<AdminActionResult> {
  if (!input.title.trim()) {
    return fail('Багцын гарчиг шаардлагатай.')
  }

  const supabase = await getAdminSupabase()
  const payload = {
    title: input.title.trim(),
    description: trimToNull(input.description),
    price: clampNumber(input.price),
    old_price: input.old_price,
    promotion_text: trimToNull(input.promotion_text),
    badge_text: trimToNull(input.badge_text),
    badge_color: input.badge_color || '#1E63B5',
    is_active: input.is_active,
    show_on_landing: input.show_on_landing,
    show_on_result: input.show_on_result,
    sort_order: clampNumber(input.sort_order),
  }

  const packageQuery = input.id
    ? supabase
        .from('service_packages')
        .update(payload)
        .eq('id', input.id)
        .select('id')
        .single()
    : supabase.from('service_packages').insert(payload).select('id').single()

  const { data, error } = await packageQuery

  if (error || !data) {
    return fail(error?.message ?? 'Багц хадгалах үед алдаа гарлаа.')
  }

  await supabase.from('package_services').delete().eq('package_id', data.id)

  if (input.service_ids.length > 0) {
    const { error: relationError } = await supabase.from('package_services').insert(
      input.service_ids.map((service_id) => ({
        package_id: data.id,
        service_id,
      }))
    )

    if (relationError) {
      return fail(relationError.message)
    }
  }

  revalidateAdminAndPublic()
  return ok('Багц хадгалагдлаа.')
}

export async function deletePackage(id: string): Promise<AdminActionResult> {
  const supabase = await getAdminSupabase()
  const { error } = await supabase.from('service_packages').delete().eq('id', id)

  if (error) {
    return fail(error.message)
  }

  revalidateAdminAndPublic()
  return ok('Багц устгагдлаа.')
}

export async function savePromotion(input: PromotionInput): Promise<AdminActionResult> {
  if (!input.title.trim() || !input.target_id) {
    return fail('Урамшууллын гарчиг болон холбох объект шаардлагатай.')
  }

  const supabase = await getAdminSupabase()
  const payload = {
    title: input.title.trim(),
    description: trimToNull(input.description),
    discount_percent: input.discount_percent,
    discount_amount: input.discount_amount,
    free_gift: trimToNull(input.free_gift),
    badge_text: input.badge_text.trim() || 'Урамшуулал',
    badge_color: input.badge_color || '#F23645',
    service_id: input.target_type === 'service' ? input.target_id : null,
    package_id: input.target_type === 'package' ? input.target_id : null,
    show_on_landing: input.show_on_landing,
    show_on_result: input.show_on_result,
    is_active: input.is_active,
    starts_at: trimToNull(input.starts_at),
    ends_at: trimToNull(input.ends_at),
  }

  const query = input.id
    ? supabase.from('promotions').update(payload).eq('id', input.id)
    : supabase.from('promotions').insert(payload)

  const { error } = await query

  if (error) {
    return fail(error.message)
  }

  revalidateAdminAndPublic()
  return ok('Урамшуулал хадгалагдлаа.')
}

export async function deletePromotion(id: string): Promise<AdminActionResult> {
  const supabase = await getAdminSupabase()
  const { error } = await supabase.from('promotions').delete().eq('id', id)

  if (error) {
    return fail(error.message)
  }

  revalidateAdminAndPublic()
  return ok('Урамшуулал устгагдлаа.')
}

export async function saveSymptomCategory(
  input: SymptomCategoryInput
): Promise<AdminActionResult> {
  if (!input.name.trim()) {
    return fail('Шинж тэмдгийн ангиллын нэр шаардлагатай.')
  }

  const supabase = await getAdminSupabase()
  const payload = {
    name: input.name.trim(),
    slug: trimToNull(input.slug),
    icon: input.icon.trim() || '🩺',
    description: trimToNull(input.description),
    sort_order: clampNumber(input.sort_order),
    is_active: input.is_active,
    show_on_landing: input.show_on_landing,
  }

  const query = input.id
    ? supabase.from('symptom_categories').update(payload).eq('id', input.id)
    : supabase.from('symptom_categories').insert(payload)

  const { error } = await query

  if (error) {
    return fail(error.message)
  }

  revalidateAdminAndPublic(['/dashboard/admin/diagnosis'])
  return ok('Шинж тэмдгийн ангилал хадгалагдлаа.')
}

export async function deleteSymptomCategory(id: string): Promise<AdminActionResult> {
  const supabase = await getAdminSupabase()
  const { error } = await supabase.from('symptom_categories').delete().eq('id', id)

  if (error) {
    return fail('Ангиллыг устгах боломжгүй байна. Хамааралтай асуултуудыг шалгана уу.')
  }

  revalidateAdminAndPublic(['/dashboard/admin/diagnosis'])
  return ok('Шинж тэмдгийн ангилал устгагдлаа.')
}

export async function saveDiagnosisQuestion(
  input: DiagnosisQuestionInput
): Promise<AdminActionResult> {
  if (!input.category_id || !input.question_text.trim()) {
    return fail('Ангилал болон асуултын текст шаардлагатай.')
  }

  const supabase = await getAdminSupabase()
  const payload = {
    category_id: input.category_id,
    question_text: input.question_text.trim(),
    help_text: trimToNull(input.help_text),
    question_type: input.question_type,
    sort_order: clampNumber(input.sort_order),
    is_required: input.is_required,
    is_active: input.is_active,
    risk_weight: clampNumber(input.risk_weight, 1),
  }

  const query = input.id
    ? supabase.from('questions').update(payload).eq('id', input.id)
    : supabase.from('questions').insert(payload)

  const { error } = await query

  if (error) {
    return fail(error.message)
  }

  revalidateAdminAndPublic(['/dashboard/admin/diagnosis', '/check'])
  return ok('Оношилгооны асуулт хадгалагдлаа.')
}

export async function deleteDiagnosisQuestion(id: string): Promise<AdminActionResult> {
  const supabase = await getAdminSupabase()
  const { error } = await supabase.from('questions').delete().eq('id', id)

  if (error) {
    return fail(error.message)
  }

  revalidateAdminAndPublic(['/dashboard/admin/diagnosis', '/check'])
  return ok('Асуулт устгагдлаа.')
}

export async function saveAnswerOption(
  input: DiagnosisAnswerOptionInput
): Promise<AdminActionResult> {
  if (!input.question_id || !input.option_text.trim()) {
    return fail('Харьяалах асуулт болон хариултын текст шаардлагатай.')
  }

  const supabase = await getAdminSupabase()
  const payload = {
    question_id: input.question_id,
    option_text: input.option_text.trim(),
    recommendation: trimToNull(input.recommendation),
    risk_score: clampNumber(input.risk_score),
    sort_order: clampNumber(input.sort_order),
    is_active: input.is_active,
  }

  const query = input.id
    ? supabase.from('answer_options').update(payload).eq('id', input.id)
    : supabase.from('answer_options').insert(payload)

  const { error } = await query

  if (error) {
    return fail(error.message)
  }

  revalidateAdminAndPublic(['/dashboard/admin/diagnosis', '/check'])
  return ok('Хариултын сонголт хадгалагдлаа.')
}

export async function deleteAnswerOption(id: string): Promise<AdminActionResult> {
  const supabase = await getAdminSupabase()
  const { error } = await supabase.from('answer_options').delete().eq('id', id)

  if (error) {
    return fail(error.message)
  }

  revalidateAdminAndPublic(['/dashboard/admin/diagnosis', '/check'])
  return ok('Хариултын сонголт устгагдлаа.')
}

export async function updateLeadStatus(
  lead_id: string,
  status: LeadStatus
): Promise<AdminActionResult> {
  const supabase = await getAdminSupabase()
  const payload = {
    status,
    is_blacklisted: status === 'blacklisted',
  }

  const { error } = await supabase.from('leads').update(payload).eq('id', lead_id)

  if (error) {
    return fail(error.message)
  }

  revalidateAdminAndPublic(['/dashboard/admin/crm'])
  return ok('Лидийн төлөв шинэчлэгдлээ.')
}

export async function toggleLeadBlacklist(
  lead_id: string,
  is_blacklisted: boolean
): Promise<AdminActionResult> {
  const supabase = await getAdminSupabase()
  const { data: currentLead, error: fetchError } = await supabase
    .from('leads')
    .select('status')
    .eq('id', lead_id)
    .single()

  if (fetchError) {
    return fail(fetchError.message)
  }

  const nextStatus =
    is_blacklisted
      ? 'blacklisted'
      : currentLead.status === 'blacklisted'
        ? 'pending'
        : currentLead.status

  const { error } = await supabase
    .from('leads')
    .update({
      is_blacklisted,
      status: nextStatus,
    })
    .eq('id', lead_id)

  if (error) {
    return fail(error.message)
  }

  revalidateAdminAndPublic(['/dashboard/admin/crm'])
  return ok(is_blacklisted ? 'Лид blacklist боллоо.' : 'Лид blacklist-ээс гарлаа.')
}

export async function addLeadNote(input: CrmNoteInput): Promise<AdminActionResult> {
  if (!input.note_text.trim()) {
    return fail('Тэмдэглэл хоосон байж болохгүй.')
  }

  const viewer = await requireRole(['super_admin'])
  const supabase = await createClient()

  const { error } = await supabase.from('crm_notes').insert({
    lead_id: input.lead_id,
    author_id: viewer.id,
    note_text: input.note_text.trim(),
  })

  if (error) {
    return fail(error.message)
  }

  const { data: lead } = await supabase
    .from('leads')
    .select('notes')
    .eq('id', input.lead_id)
    .single()

  const mergedNotes = [lead?.notes, input.note_text.trim()].filter(Boolean).join('\n')
  await supabase
    .from('leads')
    .update({ notes: mergedNotes })
    .eq('id', input.lead_id)

  revalidateAdminAndPublic(['/dashboard/admin/crm'])
  return ok('CRM тэмдэглэл хадгалагдлаа.')
}

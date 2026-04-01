'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateAssessmentRisk } from '@/lib/public/risk'
import { getDiagnosisFlowData } from '@/lib/public/data'
import { calculateOrganizationQuote } from '@/lib/public/organization'
import type {
  SubmitAppointmentInput,
  SubmitAssessmentInput,
  SubmitConsultationInput,
  SubmitOrganizationQuoteInput,
} from '@/lib/public/types'
import {
  createServiceRoleClient,
  hasServiceRoleConfig,
} from '@/lib/supabase/service-role'

type PublicActionResult<T = void> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string }

function fail<T>(error: string): PublicActionResult<T> {
  return { ok: false, error }
}

function ok<T>(data?: T, message?: string): PublicActionResult<T> {
  return { ok: true, data, message }
}

function trimToNull(value: string | null | undefined) {
  const normalized = value?.trim() ?? ''
  return normalized.length > 0 ? normalized : null
}

function isUuid(value: string | null | undefined): value is string {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value ?? ''
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('mn-MN').format(value)
}

async function getMutationClient() {
  if (hasServiceRoleConfig()) {
    return createServiceRoleClient()
  }

  return createClient()
}

async function upsertLeadFromContact(input: {
  lead_id?: string | null
  assessment_id?: string | null
  full_name: string
  phone: string
  email?: string
  source: string
}) {
  const supabase = await getMutationClient()

  if (hasServiceRoleConfig() && isUuid(input.lead_id) && isUuid(input.assessment_id)) {
    const { data: assessment } = await supabase
      .from('assessments')
      .select('id, lead_id')
      .eq('id', input.assessment_id)
      .eq('lead_id', input.lead_id)
      .maybeSingle()

    if (assessment) {
      const { error } = await supabase
        .from('leads')
        .update({
          full_name: input.full_name.trim(),
          phone: input.phone.trim(),
          email: trimToNull(input.email),
          source: input.source,
        })
        .eq('id', input.lead_id)

      if (error) {
        return { error: error.message, leadId: null as string | null }
      }

      return { error: null, leadId: input.lead_id }
    }
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      full_name: input.full_name.trim(),
      phone: input.phone.trim(),
      email: trimToNull(input.email),
      source: input.source,
      status: 'new',
    })
    .select('id')
    .single()

  if (error || !data) {
    return { error: error?.message ?? 'Лид үүсгэж чадсангүй.', leadId: null as string | null }
  }

  return { error: null, leadId: data.id }
}

export async function submitAssessment(
  input: SubmitAssessmentInput
): Promise<PublicActionResult<{ assessmentId: string; leadId: string }>> {
  if (!input.full_name.trim() || !input.phone.trim()) {
    return fail('Нэр болон утасны дугаар шаардлагатай.')
  }

  if (input.category_ids.length === 0) {
    return fail('Дор хаяж нэг шинж тэмдгийн ангилал сонгоно уу.')
  }

  if (input.answers.length === 0) {
    return fail('Асуултад хариулаад үргэлжлүүлнэ үү.')
  }

  const diagnosisData = await getDiagnosisFlowData()
  const selectedCategories = diagnosisData.categories.filter((category) =>
    input.category_ids.includes(category.id)
  )

  if (selectedCategories.length === 0) {
    return fail('Сонгосон ангиллууд идэвхгүй байна.')
  }

  const answerMap = Object.fromEntries(
    input.answers.map((answer) => [answer.question_id, answer.answer_option_id])
  )

  const requiredQuestionIds = selectedCategories.flatMap((category) =>
    category.questions.filter((question) => question.is_required).map((question) => question.id)
  )

  const missingRequiredQuestion = requiredQuestionIds.find((questionId) => !answerMap[questionId])
  if (missingRequiredQuestion) {
    return fail('Бүх шаардлагатай асуултад хариулна уу.')
  }

  const allowedQuestionIds = new Set(
    selectedCategories.flatMap((category) => category.questions.map((question) => question.id))
  )

  const normalizedAnswers = input.answers.filter((answer) => allowedQuestionIds.has(answer.question_id))
  if (normalizedAnswers.length === 0) {
    return fail('Хариултын өгөгдөл буруу байна.')
  }

  for (const answer of normalizedAnswers) {
    const question = selectedCategories
      .flatMap((category) => category.questions)
      .find((item) => item.id === answer.question_id)

    if (!question || !question.options.some((option) => option.id === answer.answer_option_id)) {
      return fail('Хариултын сонголт хүчингүй байна.')
    }
  }

  const { score, level } = calculateAssessmentRisk(selectedCategories, answerMap)
  const supabase = await getMutationClient()

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .insert({
      full_name: input.full_name.trim(),
      phone: input.phone.trim(),
      email: trimToNull(input.email),
      risk_level: level,
      risk_score: score,
      status: 'new',
      source: 'digital_health_check',
      categories_selected: selectedCategories.map((category) => category.name),
    })
    .select('id')
    .single()

  if (leadError || !lead) {
    return fail(leadError?.message ?? 'Лид хадгалах үед алдаа гарлаа.')
  }

  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .insert({
      lead_id: lead.id,
      risk_level: level,
      risk_score: score,
      summary: `${selectedCategories.map((category) => category.name).join(', ')} чиглэлээр ${score}% эрсдэлийн үнэлгээ үүслээ.`,
    })
    .select('id')
    .single()

  if (assessmentError || !assessment) {
    return fail(assessmentError?.message ?? 'Үнэлгээ хадгалах үед алдаа гарлаа.')
  }

  const { error: answersError } = await supabase.from('assessment_answers').insert(
    normalizedAnswers.map((answer) => ({
      assessment_id: assessment.id,
      question_id: answer.question_id,
      answer_option_ids: [answer.answer_option_id],
    }))
  )

  if (answersError) {
    return fail(answersError.message)
  }

  return ok({ assessmentId: assessment.id, leadId: lead.id })
}

export async function submitAppointment(
  input: SubmitAppointmentInput
): Promise<PublicActionResult<{ appointmentId: string; leadId: string }>> {
  if (!input.full_name.trim() || !input.phone.trim()) {
    return fail('Нэр болон утасны дугаар шаардлагатай.')
  }

  if (!input.service_id || !input.doctor_id || !input.appointment_date || !input.appointment_time) {
    return fail('Үйлчилгээ, эмч, өдөр, цагаа бүрэн сонгоно уу.')
  }

  const normalizedPhone = input.phone.replace(/\s+/g, '')
  if (normalizedPhone.length < 8) {
    return fail('Утасны дугаараа зөв оруулна уу.')
  }

  const appointmentDate = new Date(`${input.appointment_date}T00:00:00`)
  if (Number.isNaN(appointmentDate.getTime())) {
    return fail('Цагийн огноо буруу байна.')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (appointmentDate < today) {
    return fail('Өнгөрсөн огноонд цаг захиалах боломжгүй.')
  }

  const leadResult = await upsertLeadFromContact({
    lead_id: input.lead_id,
    assessment_id: input.assessment_id,
    full_name: input.full_name,
    phone: input.phone,
    email: input.email,
    source: 'appointment_booking',
  })

  if (leadResult.error || !leadResult.leadId) {
    return fail(leadResult.error ?? 'Лидийн мэдээлэл хадгалагдсангүй.')
  }

  const supabase = await getMutationClient()

  const [{ data: service }, { data: doctor }, { data: doctorServices, error: relationError }] =
    await Promise.all([
      supabase
        .from('services')
        .select('id, preparation_notice, is_active, show_on_booking')
        .eq('id', input.service_id)
        .maybeSingle(),
      supabase
        .from('doctors')
        .select('id, is_active, available_for_booking')
        .eq('id', input.doctor_id)
        .maybeSingle(),
      supabase
        .from('doctor_services')
        .select('service_id')
        .eq('doctor_id', input.doctor_id),
    ])

  if (!service || !service.is_active || !service.show_on_booking) {
    return fail('Сонгосон үйлчилгээ захиалгад идэвхгүй байна.')
  }

  if (!doctor || !doctor.is_active || !doctor.available_for_booking) {
    return fail('Сонгосон эмч одоогоор захиалга авах боломжгүй байна.')
  }

  if (relationError) {
    return fail(relationError.message)
  }

  if (
    (doctorServices?.length ?? 0) > 0 &&
    !doctorServices?.some((relation) => relation.service_id === input.service_id)
  ) {
    return fail('Сонгосон эмч энэ үйлчилгээтэй холбогдоогүй байна.')
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      lead_id: leadResult.leadId,
      doctor_id: input.doctor_id,
      service_id: input.service_id,
      appointment_date: input.appointment_date,
      appointment_time: input.appointment_time,
      status: 'pending',
      preparation_notice: service.preparation_notice,
    })
    .select('id')
    .single()

  if (error || !appointment) {
    return fail(error?.message ?? 'Цаг захиалгыг хадгалж чадсангүй.')
  }

  return ok({ appointmentId: appointment.id, leadId: leadResult.leadId })
}

export async function submitConsultationRequest(
  input: SubmitConsultationInput
): Promise<PublicActionResult<{ consultationId: string; leadId: string }>> {
  if (!input.full_name.trim() || !input.phone.trim()) {
    return fail('Нэр болон утасны дугаар шаардлагатай.')
  }

  const leadResult = await upsertLeadFromContact({
    lead_id: input.lead_id,
    assessment_id: input.assessment_id,
    full_name: input.full_name,
    phone: input.phone,
    email: input.email,
    source: 'phone_consultation',
  })

  if (leadResult.error || !leadResult.leadId) {
    return fail(leadResult.error ?? 'Лидийн мэдээлэл хадгалагдсангүй.')
  }

  const supabase = await getMutationClient()
  const { data: consultation, error } = await supabase
    .from('consultation_requests')
    .insert({
      lead_id: leadResult.leadId,
      preferred_callback_time: input.preferred_callback_time,
      question: trimToNull(input.question),
      status: 'new',
    })
    .select('id')
    .single()

  if (error || !consultation) {
    return fail(error?.message ?? 'Зөвлөгөөний хүсэлт хадгалагдсангүй.')
  }

  return ok({ consultationId: consultation.id, leadId: leadResult.leadId })
}

export async function submitOrganizationQuoteRequest(
  input: SubmitOrganizationQuoteInput
): Promise<PublicActionResult<{ consultationId: string; leadId: string }>> {
  if (!input.organization_name.trim() || !input.contact_name.trim() || !input.phone.trim()) {
    return fail('Байгууллагын нэр, холбоо барих хүний нэр, утасны дугаар шаардлагатай.')
  }

  if (!input.employee_band_label.trim()) {
    return fail('Ажилтны тоогоо сонгоно уу.')
  }

  const normalizedPhone = input.phone.replace(/\s+/g, '')
  if (normalizedPhone.length < 8) {
    return fail('Утасны дугаараа зөв оруулна уу.')
  }

  const quote = calculateOrganizationQuote(
    input.employee_count,
    input.sector_id,
    input.package_id
  )

  const leadResult = await upsertLeadFromContact({
    full_name: input.contact_name,
    phone: input.phone,
    email: input.email,
    source: 'organization_quote_request',
  })

  if (leadResult.error || !leadResult.leadId) {
    return fail(leadResult.error ?? 'Лидийн мэдээлэл хадгалагдсангүй.')
  }

  const requestSummary = [
    `Байгууллага: ${input.organization_name.trim()}`,
    `Сонгосон багц: ${quote.selectedPackage.title}`,
    `Ажилтны тоо: ${input.employee_band_label}`,
    `Салбар: ${quote.sector.label}`,
    `Нэг ажилтны урьдчилсан үнэ: ${formatCurrency(quote.perEmployeePrice)}₮`,
    `Тооцоолсон нийт үнэ: ${formatCurrency(quote.totalPrice)}₮`,
    `On-site зохион байгуулалт: ${quote.onsiteWindow}`,
    `Тайлан гарах хугацаа: ${quote.reportWindow}`,
    quote.recommendedPackage.id !== quote.selectedPackage.id
      ? `Системийн зөвлөмж: ${quote.recommendedPackage.title}`
      : 'Системийн зөвлөмж: Сонгосон багц тохирч байна',
  ].join('\n')

  const supabase = await getMutationClient()
  const { data: consultation, error } = await supabase
    .from('consultation_requests')
    .insert({
      lead_id: leadResult.leadId,
      preferred_callback_time: 'afternoon',
      question: requestSummary,
      status: 'new',
    })
    .select('id')
    .single()

  if (error || !consultation) {
    return fail(error?.message ?? 'Байгууллагын хүсэлтийг хадгалж чадсангүй.')
  }

  return ok({ consultationId: consultation.id, leadId: leadResult.leadId })
}

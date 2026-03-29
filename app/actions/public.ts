'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateAssessmentRisk } from '@/lib/public/risk'
import { getDiagnosisFlowData } from '@/lib/public/data'
import type {
  SubmitAppointmentInput,
  SubmitAssessmentInput,
  SubmitConsultationInput,
} from '@/lib/public/types'

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

async function upsertLeadFromContact(input: {
  lead_id?: string | null
  full_name: string
  phone: string
  email?: string
  source: string
}) {
  const supabase = await createClient()

  if (input.lead_id) {
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
  const supabase = await createClient()

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

  const leadResult = await upsertLeadFromContact({
    lead_id: input.lead_id,
    full_name: input.full_name,
    phone: input.phone,
    email: input.email,
    source: 'appointment_booking',
  })

  if (leadResult.error || !leadResult.leadId) {
    return fail(leadResult.error ?? 'Лидийн мэдээлэл хадгалагдсангүй.')
  }

  const supabase = await createClient()

  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('preparation_notice')
    .eq('id', input.service_id)
    .single()

  if (serviceError) {
    return fail(serviceError.message)
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
    full_name: input.full_name,
    phone: input.phone,
    email: input.email,
    source: 'phone_consultation',
  })

  if (leadResult.error || !leadResult.leadId) {
    return fail(leadResult.error ?? 'Лидийн мэдээлэл хадгалагдсангүй.')
  }

  const supabase = await createClient()
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

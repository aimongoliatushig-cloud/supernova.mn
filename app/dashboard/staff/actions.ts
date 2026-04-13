'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/admin/auth'
import {
  createServiceRoleClient,
  hasServiceRoleConfig,
} from '@/lib/supabase/service-role'
import type { AdminActionResult, AppointmentStatus, LeadStatus, Role } from '@/lib/admin/types'

type StaffViewerRole = Extract<
  Role,
  'office_assistant' | 'operator' | 'organization_consultant' | 'super_admin'
>

const LEAD_MANAGER_ROLES: StaffViewerRole[] = [
  'office_assistant',
  'organization_consultant',
  'super_admin',
]
const NOTE_WRITER_ROLES: StaffViewerRole[] = [
  'office_assistant',
  'operator',
  'organization_consultant',
  'super_admin',
]
const CONSULTATION_ASSIGNER_ROLES: StaffViewerRole[] = ['office_assistant', 'super_admin']
const CONSULTATION_FOLLOW_UP_ROLES: StaffViewerRole[] = ['operator', 'super_admin']
const APPOINTMENT_MANAGER_ROLES: StaffViewerRole[] = ['office_assistant', 'super_admin']
type StaffSupabase =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createServiceRoleClient>

function ok<T = void>(data?: T, message?: string): AdminActionResult<T> {
  return { ok: true, data, message }
}

export async function createAppointmentFromCalendarForStaff(input: {
  full_name: string
  phone: string
  service_id: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
}): Promise<AdminActionResult<{ appointmentId: string; leadId: string }>> {
  if (!input.full_name.trim() || !input.phone.trim()) {
    return fail('Нэр болон утасны дугаар заавал оруулна.')
  }

  const normalizedPhone = input.phone.replace(/\s+/g, '')
  if (normalizedPhone.length < 8) {
    return fail('Утасны дугаараа зөв оруулна уу.')
  }

  if (!input.service_id || !input.doctor_id) {
    return fail('Үйлчилгээ болон эмчээ заавал сонгоно.')
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.appointment_date)) {
    return fail('Өдрийн формат буруу байна.')
  }

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(input.appointment_time)) {
    return fail('Цагийн формат буруу байна.')
  }

  const { supabase } = await getStaffSupabase()
  const normalizedTime = normalizeAppointmentTime(input.appointment_time)
  const conflictResult = await findDoctorTimeConflict(supabase, {
    doctor_id: input.doctor_id,
    appointment_date: input.appointment_date,
    appointment_time: normalizedTime,
  })

  if (conflictResult.error) {
    return fail(conflictResult.error)
  }

  if (conflictResult.hasConflict) {
    return fail('Сонгосон эмч энэ өдөр, энэ цагт аль хэдийн захиалгатай байна. Өөр цаг сонгоно уу.')
  }

  const leadResult = await findOrCreateCalendarLead(supabase, {
    full_name: input.full_name,
    phone: input.phone,
  })

  if (leadResult.error || !leadResult.leadId) {
    return fail(leadResult.error ?? 'Lead үүсгэж чадсангүй.')
  }

  const appointmentResult = await createAppointmentForStaff({
    lead_id: leadResult.leadId,
    service_id: input.service_id,
    doctor_id: input.doctor_id,
    appointment_date: input.appointment_date,
    appointment_time: input.appointment_time,
  })

  if (!appointmentResult.ok || !appointmentResult.data?.appointmentId) {
    return fail(
      appointmentResult.ok ? 'Цагийн захиалга бүртгэж чадсангүй.' : appointmentResult.error
    )
  }

  return ok(
    {
      appointmentId: appointmentResult.data.appointmentId,
      leadId: leadResult.leadId,
    },
    'Цагийн захиалга бүртгэгдлээ.'
  )
}

function fail<T = void>(error: string): AdminActionResult<T> {
  return { ok: false, error }
}

async function getStaffSupabase() {
  const viewer = await requireRole([
    'office_assistant',
    'operator',
    'organization_consultant',
    'super_admin',
  ])

  const supabase =
    hasServiceRoleConfig() ? createServiceRoleClient() : await createClient()

  return {
    viewer,
    supabase,
  }
}

function hasViewerRole(role: Role, allowedRoles: StaffViewerRole[]) {
  return allowedRoles.includes(role as StaffViewerRole)
}

function revalidateCrmPaths() {
  for (const path of [
    '/dashboard/admin/crm',
    '/dashboard/assistant',
    '/dashboard/consultant',
    '/dashboard/operator',
    '/dashboard/doctor',
  ]) {
    revalidatePath(path)
  }
}

function isMissingWorkflowFunction(errorMessage: string, functionName: string) {
  return errorMessage.includes(functionName) || errorMessage.includes('assigned_doctor_id')
}

function isAppointmentStatus(value: string): value is AppointmentStatus {
  return ['pending', 'confirmed', 'cancelled', 'completed'].includes(value)
}

function normalizeAppointmentTime(value: string) {
  const [hours = '00', minutes = '00', seconds = '00'] = value.split(':')
  return `${hours}:${minutes}:${seconds}`
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

async function assertLeadScopeAccess(
  supabase: StaffSupabase,
  viewer: { role: Role },
  lead_id: string
) {
  if (viewer.role !== 'organization_consultant') {
    return null
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .select('source')
    .eq('id', lead_id)
    .single()

  if (error) {
    return error.message
  }

  if (lead.source !== 'organization_consultation_request') {
    return 'Байгууллагын зөвлөх зөвхөн компанийн хүсэлтүүд дээр ажиллана.'
  }

  return null
}

async function findDoctorTimeConflict(
  supabase: StaffSupabase,
  input: {
    doctor_id: string
    appointment_date: string
    appointment_time: string
    exclude_appointment_id?: string
  }
) {
  let query = supabase
    .from('appointments')
    .select('id')
    .eq('doctor_id', input.doctor_id)
    .eq('appointment_date', input.appointment_date)
    .eq('appointment_time', input.appointment_time)
    .neq('status', 'cancelled')

  if (input.exclude_appointment_id) {
    query = query.neq('id', input.exclude_appointment_id)
  }

  const { data, error } = await query.limit(1)

  if (error) {
    return { error: error.message, hasConflict: false }
  }

  return { error: null, hasConflict: (data?.length ?? 0) > 0 }
}

async function findOrCreateCalendarLead(
  supabase: StaffSupabase,
  input: { full_name: string; phone: string }
) {
  const fullName = input.full_name.trim()
  const phone = input.phone.trim()

  const { data: existingLeads, error: lookupError } = await supabase
    .from('leads')
    .select('id')
    .eq('phone', phone)
    .order('created_at', { ascending: false })
    .limit(1)

  if (lookupError) {
    return { error: lookupError.message, leadId: null as string | null }
  }

  const existingLead = existingLeads?.[0]

  if (existingLead) {
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        full_name: fullName,
        source: 'appointment_booking',
      })
      .eq('id', existingLead.id)

    if (updateError) {
      return { error: updateError.message, leadId: null as string | null }
    }

    return { error: null, leadId: existingLead.id }
  }

  const { data: lead, error: insertError } = await supabase
    .from('leads')
    .insert({
      full_name: fullName,
      phone,
      source: 'appointment_booking',
      status: 'new',
    })
    .select('id')
    .single()

  if (insertError || !lead) {
    return { error: insertError?.message ?? 'Lead үүсгэж чадсангүй.', leadId: null as string | null }
  }

  return { error: null, leadId: lead.id }
}

export async function updateLeadStatusForStaff(
  lead_id: string,
  status: LeadStatus
): Promise<AdminActionResult> {
  const { viewer, supabase } = await getStaffSupabase()

  if (!hasViewerRole(viewer.role, LEAD_MANAGER_ROLES)) {
    return fail('Таны role lead төлөв өөрчлөх эрхгүй байна.')
  }

  const accessError = await assertLeadScopeAccess(supabase, viewer, lead_id)
  if (accessError) {
    return fail(accessError)
  }

  const payload = {
    status,
    is_blacklisted: status === 'blacklisted',
  }

  const { error } = await supabase.from('leads').update(payload).eq('id', lead_id)

  if (error) {
    return fail(error.message)
  }

  revalidateCrmPaths()
  return ok(undefined, 'Lead-ийн төлөв шинэчлэгдлээ.')
}

export async function toggleLeadBlacklistForStaff(
  lead_id: string,
  is_blacklisted: boolean
): Promise<AdminActionResult> {
  const { viewer, supabase } = await getStaffSupabase()

  if (!hasViewerRole(viewer.role, LEAD_MANAGER_ROLES)) {
    return fail('Таны role blacklist өөрчлөх эрхгүй байна.')
  }

  const accessError = await assertLeadScopeAccess(supabase, viewer, lead_id)
  if (accessError) {
    return fail(accessError)
  }

  const { data: currentLead, error: fetchError } = await supabase
    .from('leads')
    .select('status')
    .eq('id', lead_id)
    .single()

  if (fetchError) {
    return fail(fetchError.message)
  }

  const nextStatus = is_blacklisted
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

  revalidateCrmPaths()
  return ok(undefined, is_blacklisted ? 'Lead blacklist боллоо.' : 'Lead blacklist-ээс гарлаа.')
}

export async function addLeadNoteForStaff(
  lead_id: string,
  note_text: string
): Promise<AdminActionResult> {
  if (!note_text.trim()) {
    return fail('Тэмдэглэл хоосон байж болохгүй.')
  }

  const { viewer, supabase } = await getStaffSupabase()

  if (!hasViewerRole(viewer.role, NOTE_WRITER_ROLES)) {
    return fail('Тухайн хэрэглэгч CRM тэмдэглэл хадгалах эрхгүй байна.')
  }

  const accessError = await assertLeadScopeAccess(supabase, viewer, lead_id)
  if (accessError) {
    return fail(accessError)
  }

  const { error } = await supabase.from('crm_notes').insert({
    lead_id,
    author_id: viewer.id,
    note_text: note_text.trim(),
  })

  if (error) {
    return fail(error.message)
  }

  const { data: lead } = await supabase.from('leads').select('notes').eq('id', lead_id).single()
  const mergedNotes = [lead?.notes, note_text.trim()].filter(Boolean).join('\n')

  await supabase.from('leads').update({ notes: mergedNotes }).eq('id', lead_id)

  revalidateCrmPaths()
  return ok(undefined, 'CRM тэмдэглэл хадгалагдлаа.')
}

export async function assignConsultationDoctor(
  consultation_id: string,
  doctor_id: string | null
): Promise<AdminActionResult> {
  const { viewer, supabase } = await getStaffSupabase()

  if (!hasViewerRole(viewer.role, CONSULTATION_ASSIGNER_ROLES)) {
    return fail('Consultation-ийг зөвхөн оффис эсвэл админ эмчид онооно.')
  }

  const { error } = await supabase.rpc('assign_consultation_doctor', {
    target_consultation_id: consultation_id,
    next_doctor_id: doctor_id,
  })

  if (error) {
    if (isMissingWorkflowFunction(error.message, 'assign_consultation_doctor')) {
      return fail(
        'Consultation workflow migration ажиллуулаагүй байна. Supabase SQL migration-аа apply хийнэ үү.'
      )
    }

    return fail(error.message)
  }

  revalidateCrmPaths()
  return ok(
    undefined,
    doctor_id ? 'Consultation эмчид оноогдлоо.' : 'Consultation оноолт цуцлагдлаа.'
  )
}

export async function updateConsultationStatusForStaff(
  consultation_id: string,
  status: 'called' | 'closed'
): Promise<AdminActionResult> {
  const { viewer, supabase } = await getStaffSupabase()

  if (!hasViewerRole(viewer.role, CONSULTATION_FOLLOW_UP_ROLES)) {
    return fail('Consultation follow-up төлөвийг зөвхөн оператор эсвэл админ шинэчилнэ.')
  }

  const { error } = await supabase.rpc('mark_consultation_followup_status', {
    target_consultation_id: consultation_id,
    next_status: status,
  })

  if (error) {
    if (isMissingWorkflowFunction(error.message, 'mark_consultation_followup_status')) {
      return fail(
        'Consultation workflow migration ажиллуулаагүй байна. Supabase SQL migration-аа apply хийнэ үү.'
      )
    }

    return fail(error.message)
  }

  revalidateCrmPaths()
  return ok(undefined, 'Consultation төлөв шинэчлэгдлээ.')
}

export async function updateAppointmentForStaff(input: {
  appointment_id: string
  appointment_date: string
  appointment_time: string
  status: AppointmentStatus
}): Promise<AdminActionResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.appointment_date)) {
    return fail('Огнооны формат буруу байна.')
  }

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(input.appointment_time)) {
    return fail('Цагийн формат буруу байна.')
  }

  if (!isAppointmentStatus(input.status)) {
    return fail('Appointment төлөв буруу байна.')
  }

  const { viewer, supabase } = await getStaffSupabase()

  if (!hasViewerRole(viewer.role, APPOINTMENT_MANAGER_ROLES)) {
    return fail('Appointment-г зөвхөн оффисын ажилтан эсвэл супер админ өөрчилнө.')
  }

  const normalizedTime = normalizeAppointmentTime(input.appointment_time)
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .select('id, doctor_id')
    .eq('id', input.appointment_id)
    .maybeSingle()

  if (appointmentError || !appointment) {
    return fail(appointmentError?.message ?? 'Appointment олдсонгүй.')
  }

  if (appointment.doctor_id && input.status !== 'cancelled') {
    const conflictResult = await findDoctorTimeConflict(supabase, {
      doctor_id: appointment.doctor_id,
      appointment_date: input.appointment_date,
      appointment_time: normalizedTime,
      exclude_appointment_id: input.appointment_id,
    })

    if (conflictResult.error) {
      return fail(conflictResult.error)
    }

    if (conflictResult.hasConflict) {
      return fail(
        'Сонгосон эмч энэ өдөр, энэ цагт аль хэдийн захиалгатай байна. Өөр цаг сонгоно уу.'
      )
    }
  }

  const { error } = await supabase
    .from('appointments')
    .update({
      appointment_date: input.appointment_date,
      appointment_time: normalizedTime,
      status: input.status,
    })
    .eq('id', input.appointment_id)

  if (error) {
    return fail(error.message)
  }

  revalidateCrmPaths()
  return ok(undefined, 'Appointment шинэчлэгдлээ.')
}

export async function createAppointmentForStaff(input: {
  lead_id: string
  service_id: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
  consultation_id?: string | null
}): Promise<AdminActionResult<{ appointmentId: string }>> {
  if (!input.lead_id || !input.service_id || !input.doctor_id) {
    return fail('Lead, үйлчилгээ, эмчийн мэдээлэл дутуу байна.')
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.appointment_date)) {
    return fail('Огнооны формат буруу байна.')
  }

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(input.appointment_time)) {
    return fail('Цагийн формат буруу байна.')
  }

  if (input.appointment_date < getUlaanbaatarDateKey()) {
    return fail('Өнгөрсөн өдөрт appointment үүсгэх боломжгүй.')
  }

  const { viewer, supabase } = await getStaffSupabase()

  if (!hasViewerRole(viewer.role, APPOINTMENT_MANAGER_ROLES)) {
    return fail('Appointment-г зөвхөн оффисын ажилтан эсвэл супер админ үүсгэнэ.')
  }

  const normalizedTime = normalizeAppointmentTime(input.appointment_time)

  const accessError = await assertLeadScopeAccess(supabase, viewer, input.lead_id)
  if (accessError) {
    return fail(accessError)
  }

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
    return fail('Сонгосон үйлчилгээ appointment-д идэвхгүй байна.')
  }

  if (!doctor || !doctor.is_active || !doctor.available_for_booking) {
    return fail('Сонгосон эмч одоогоор appointment авах боломжгүй байна.')
  }

  if (relationError) {
    return fail(relationError.message)
  }

  if (
    (doctorServices?.length ?? 0) > 0 &&
    !doctorServices.some((relation) => relation.service_id === input.service_id)
  ) {
    return fail('Сонгосон эмч энэ үйлчилгээтэй холбогдоогүй байна.')
  }

  const conflictResult = await findDoctorTimeConflict(supabase, {
    doctor_id: input.doctor_id,
    appointment_date: input.appointment_date,
    appointment_time: normalizedTime,
  })

  if (conflictResult.error) {
    return fail(conflictResult.error)
  }

  if (conflictResult.hasConflict) {
    return fail('Сонгосон эмч энэ өдөр, энэ цагт аль хэдийн захиалгатай байна. Өөр цаг сонгоно уу.')
  }

  const { data: appointment, error: insertError } = await supabase
    .from('appointments')
    .insert({
      lead_id: input.lead_id,
      doctor_id: input.doctor_id,
      service_id: input.service_id,
      appointment_date: input.appointment_date,
      appointment_time: normalizedTime,
      status: 'pending',
      preparation_notice: service.preparation_notice,
    })
    .select('id')
    .single()

  if (insertError || !appointment) {
    return fail(insertError?.message ?? 'Appointment үүсгэж чадсангүй.')
  }

  await supabase
    .from('leads')
    .update({ status: 'pending' })
    .eq('id', input.lead_id)

  if (input.consultation_id) {
    await supabase
      .from('consultation_requests')
      .update({ status: 'closed' })
      .eq('id', input.consultation_id)
  }

  revalidateCrmPaths()
  return ok({ appointmentId: appointment.id }, 'Appointment үүсгэгдлээ.')
}

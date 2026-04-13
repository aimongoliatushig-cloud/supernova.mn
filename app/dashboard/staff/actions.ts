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

function ok(message?: string): AdminActionResult {
  return { ok: true, message }
}

function fail(error: string): AdminActionResult {
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

async function assertLeadScopeAccess(
  supabase: Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createServiceRoleClient>,
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
  return ok('Lead-ийн төлөв шинэчлэгдлээ.')
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
  return ok(is_blacklisted ? 'Lead blacklist боллоо.' : 'Lead blacklist-ээс гарлаа.')
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
  return ok('CRM тэмдэглэл хадгалагдлаа.')
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
  return ok('Consultation төлөв шинэчлэгдлээ.')
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

  const { error } = await supabase
    .from('appointments')
    .update({
      appointment_date: input.appointment_date,
      appointment_time: input.appointment_time,
      status: input.status,
    })
    .eq('id', input.appointment_id)

  if (error) {
    return fail(error.message)
  }

  revalidateCrmPaths()
  return ok('Appointment шинэчлэгдлээ.')
}

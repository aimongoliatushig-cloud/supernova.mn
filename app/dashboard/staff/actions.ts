'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/admin/auth'
import type {
  AdminActionResult,
  AppointmentStatus,
  LeadStatus,
} from '@/lib/admin/types'
import {
  createServiceRoleClient,
  hasServiceRoleConfig,
} from '@/lib/supabase/service-role'
import { createClient } from '@/lib/supabase/server'

function ok(message?: string): AdminActionResult {
  return { ok: true, message }
}

function fail(error: string): AdminActionResult {
  return { ok: false, error }
}

async function getStaffSupabase() {
  const viewer = await requireRole(['office_assistant', 'super_admin'])

  return {
    viewer,
    supabase: hasServiceRoleConfig() ? createServiceRoleClient() : await createClient(),
  }
}

function revalidateCrmPaths() {
  for (const path of ['/dashboard/admin/crm', '/dashboard/assistant', '/dashboard/doctor']) {
    revalidatePath(path)
  }
}

function isAppointmentStatus(value: string): value is AppointmentStatus {
  return ['pending', 'confirmed', 'cancelled', 'completed'].includes(value)
}

export async function updateLeadStatusForStaff(
  lead_id: string,
  status: LeadStatus
): Promise<AdminActionResult> {
  const { supabase } = await getStaffSupabase()
  const payload = {
    status,
    is_blacklisted: status === 'blacklisted',
  }

  const { error } = await supabase.from('leads').update(payload).eq('id', lead_id)

  if (error) {
    return fail(error.message)
  }

  revalidateCrmPaths()
  return ok('Lead status updated.')
}

export async function toggleLeadBlacklistForStaff(
  lead_id: string,
  is_blacklisted: boolean
): Promise<AdminActionResult> {
  const { supabase } = await getStaffSupabase()
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

  revalidateCrmPaths()
  return ok(is_blacklisted ? 'Lead added to blacklist.' : 'Lead removed from blacklist.')
}

export async function addLeadNoteForStaff(
  lead_id: string,
  note_text: string
): Promise<AdminActionResult> {
  if (!note_text.trim()) {
    return fail('Note cannot be empty.')
  }

  const { viewer, supabase } = await getStaffSupabase()

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
  return ok('CRM note saved.')
}

export async function assignConsultationDoctor(
  consultation_id: string,
  doctor_id: string | null
): Promise<AdminActionResult> {
  const { viewer, supabase } = await getStaffSupabase()
  const payload = {
    assigned_doctor_id: doctor_id,
    assigned_by: doctor_id ? viewer.id : null,
    assigned_at: doctor_id ? new Date().toISOString() : null,
    status: doctor_id ? 'assigned' : 'new',
  }

  const { error } = await supabase
    .from('consultation_requests')
    .update(payload)
    .eq('id', consultation_id)

  if (error) {
    if (error.message.includes('assigned_doctor_id')) {
      return fail('Consultation assignment migration is missing. Apply the latest Supabase SQL.')
    }

    return fail(error.message)
  }

  revalidateCrmPaths()
  return ok(doctor_id ? 'Consultation assigned to doctor.' : 'Consultation assignment cleared.')
}

export async function updateConsultationStatusForStaff(
  consultation_id: string,
  status: 'assigned' | 'answered' | 'called' | 'closed'
): Promise<AdminActionResult> {
  const { supabase } = await getStaffSupabase()
  const { error } = await supabase
    .from('consultation_requests')
    .update({ status })
    .eq('id', consultation_id)

  if (error) {
    return fail(error.message)
  }

  revalidateCrmPaths()
  return ok('Consultation status updated.')
}

export async function updateAppointmentForStaff(input: {
  appointment_id: string
  appointment_date: string
  appointment_time: string
  status: AppointmentStatus
}): Promise<AdminActionResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.appointment_date)) {
    return fail('Appointment date format is invalid.')
  }

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(input.appointment_time)) {
    return fail('Appointment time format is invalid.')
  }

  if (!isAppointmentStatus(input.status)) {
    return fail('Appointment status is invalid.')
  }

  const { supabase } = await getStaffSupabase()
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
  return ok('Appointment updated.')
}

export async function createAppointmentForStaff(input: {
  lead_id: string
  appointment_date: string
  appointment_time: string
  status: AppointmentStatus
  service_id?: string
  doctor_id?: string
}): Promise<AdminActionResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.appointment_date)) {
    return fail('Appointment date format is invalid.')
  }

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(input.appointment_time)) {
    return fail('Appointment time format is invalid.')
  }

  if (!isAppointmentStatus(input.status)) {
    return fail('Appointment status is invalid.')
  }

  const { supabase } = await getStaffSupabase()
  const { error } = await supabase
    .from('appointments')
    .insert({
      lead_id: input.lead_id,
      appointment_date: input.appointment_date,
      appointment_time: input.appointment_time,
      status: input.status,
      service_id: input.service_id || null,
      doctor_id: input.doctor_id || null,
    })

  if (error) {
    return fail(error.message)
  }

  revalidateCrmPaths()
  return ok('Шинэ цаг үүсгэлээ.')
}

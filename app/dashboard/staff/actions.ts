'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/admin/auth'
import type { AdminActionResult, LeadStatus } from '@/lib/admin/types'

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
    supabase: await createClient(),
  }
}

function revalidateCrmPaths() {
  for (const path of ['/dashboard/admin/crm', '/dashboard/assistant', '/dashboard/doctor']) {
    revalidatePath(path)
  }
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
  return ok('Lead-ийн төлөв шинэчлэгдлээ.')
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
      return fail('Consultation assignment migration ажиллуулаагүй байна. Supabase SQL migration-аа apply хийнэ үү.')
    }

    return fail(error.message)
  }

  revalidateCrmPaths()
  return ok(doctor_id ? 'Consultation эмчид оноогдлоо.' : 'Consultation оноолт цуцлагдлаа.')
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
  return ok('Consultation төлөв шинэчлэгдлээ.')
}

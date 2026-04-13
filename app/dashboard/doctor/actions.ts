'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/admin/auth'
import { createServiceRoleClient, hasServiceRoleConfig } from '@/lib/supabase/service-role'
import { createClient } from '@/lib/supabase/server'
import type { AdminActionResult, AppointmentStatus } from '@/lib/admin/types'

function ok(message?: string): AdminActionResult {
  return { ok: true, message }
}

function fail(error: string): AdminActionResult {
  return { ok: false, error }
}

function isAppointmentStatus(value: string): value is AppointmentStatus {
  return ['pending', 'confirmed', 'cancelled', 'completed'].includes(value)
}

export async function submitDoctorResponse(
  consultation_id: string,
  doctor_id: string,
  response_text: string
): Promise<AdminActionResult> {
  if (!response_text.trim()) {
    return fail('Response cannot be empty.')
  }

  const viewer = await requireRole(['doctor', 'super_admin'])
  const supabase = hasServiceRoleConfig() ? createServiceRoleClient() : await createClient()

  if (viewer.role === 'doctor') {
    const { data: docData } = await supabase
      .from('doctors')
      .select('id')
      .eq('profile_id', viewer.id)
      .single()

    if (docData?.id !== doctor_id) {
      return fail('Unauthorized: You can only respond as yourself.')
    }
  }

  const { error: insertError } = await supabase.from('doctor_responses').insert({
    consultation_id,
    doctor_id,
    response_text: response_text.trim(),
  })

  if (insertError) {
    return fail(insertError.message)
  }

  const { error: updateError } = await supabase
    .from('consultation_requests')
    .update({ status: 'answered' })
    .eq('id', consultation_id)

  if (updateError) {
    return fail(updateError.message)
  }

  revalidatePath('/dashboard/doctor')
  return ok('Хариу илгээгдлээ.')
}

export async function updateAppointmentForDoctor(input: {
  appointment_id: string
  appointment_date: string
  appointment_time: string
  status: AppointmentStatus
}): Promise<AdminActionResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.appointment_date)) {
    return fail('Date format is invalid.')
  }

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(input.appointment_time)) {
    return fail('Time format is invalid.')
  }

  if (!isAppointmentStatus(input.status)) {
    return fail('Status is invalid.')
  }

  const viewer = await requireRole(['doctor', 'super_admin'])
  const supabase = hasServiceRoleConfig() ? createServiceRoleClient() : await createClient()

  if (viewer.role === 'doctor') {
    const { data: docData } = await supabase
      .from('doctors')
      .select('id')
      .eq('profile_id', viewer.id)
      .single()

    if (!docData?.id) {
      return fail('Unauthorized: Doctor profile not found.')
    }

    // Verify the appointment belongs to the doctor
    const { data: appointment } = await supabase
      .from('appointments')
      .select('doctor_id')
      .eq('id', input.appointment_id)
      .single()

    if (appointment?.doctor_id !== docData.id) {
      return fail('Unauthorized: You can only edit your own appointments.')
    }
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

  revalidatePath('/dashboard/doctor')
  return ok('Цагийн хуваарь шинэчлэгдлээ.')
}

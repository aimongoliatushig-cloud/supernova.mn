'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'
import type { AdminActionResult } from '@/lib/admin/types'

type DoctorResponseResult = {
  response_id: string
  doctor_id: string
  response_text: string
  created_at: string
}

function ok<T>(data: T, message?: string): AdminActionResult<T> {
  return { ok: true, data, message }
}

function fail<T = void>(error: string): AdminActionResult<T> {
  return { ok: false, error }
}

function revalidateDoctorCrmPaths() {
  for (const path of [
    '/dashboard/doctor',
    '/dashboard/operator',
    '/dashboard/assistant',
    '/dashboard/admin/crm',
  ]) {
    revalidatePath(path)
  }
}

export async function submitDoctorConsultationResponse(
  consultation_id: string,
  response_text: string
): Promise<AdminActionResult<DoctorResponseResult>> {
  const normalizedResponse = response_text.trim()

  if (!normalizedResponse) {
    return fail('Эмчийн хариулт хоосон байж болохгүй.')
  }

  await requireRole(['doctor', 'super_admin'])
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('submit_doctor_consultation_response', {
    target_consultation_id: consultation_id,
    response_body: normalizedResponse,
  })

  if (error) {
    if (error.message.includes('submit_doctor_consultation_response')) {
      return fail(
        'Consultation workflow migration ажиллуулаагүй байна. Supabase SQL migration-аа apply хийнэ үү.'
      )
    }

    return fail(error.message)
  }

  const responsePayload = Array.isArray(data) ? data[0] : data

  if (
    !responsePayload ||
    typeof responsePayload.response_id !== 'string' ||
    typeof responsePayload.doctor_id !== 'string' ||
    typeof responsePayload.response_text !== 'string' ||
    typeof responsePayload.created_at !== 'string'
  ) {
    return fail('Эмчийн хариултын үр дүн буруу ирлээ. Дахин оролдоно уу.')
  }

  revalidateDoctorCrmPaths()

  return ok(
    {
      response_id: responsePayload.response_id,
      doctor_id: responsePayload.doctor_id,
      response_text: responsePayload.response_text,
      created_at: responsePayload.created_at,
    },
    'Эмчийн хариулт хадгалагдлаа.'
  )
}

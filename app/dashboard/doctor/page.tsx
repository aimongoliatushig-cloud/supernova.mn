import DoctorDashboardClient from '@/components/dashboard/DoctorDashboardClient'
import type { DoctorAppointment } from '@/components/dashboard/DoctorAppointmentsBoard'
import type {
  DoctorConsultation,
  DoctorDashboardData,
} from '@/components/dashboard/doctor-dashboard-types'
import { requireRole } from '@/lib/admin/auth'
import {
  createServiceRoleClient,
  hasServiceRoleConfig,
} from '@/lib/supabase/service-role'

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

async function getDoctorDashboardData(viewer: {
  id: string
  full_name: string | null
  email: string
}): Promise<DoctorDashboardData> {
  const doctorLabel = viewer.full_name ?? viewer.email

  if (!hasServiceRoleConfig()) {
    return {
      doctorId: null,
      doctorLabel,
      consultations: [],
      appointments: [],
      error: 'Server-side doctor dashboard access is not configured.',
    }
  }

  const supabase = createServiceRoleClient()
  const { data: doctor, error: doctorError } = await supabase
    .from('doctors')
    .select('id, full_name')
    .eq('profile_id', viewer.id)
    .maybeSingle()

  if (doctorError) {
    return {
      doctorId: null,
      doctorLabel,
      consultations: [],
      appointments: [],
      error: doctorError.message,
    }
  }

  if (!doctor) {
    return {
      doctorId: null,
      doctorLabel,
      consultations: [],
      appointments: [],
      error: null,
    }
  }

  const [{ data: consultations, error: consultationError }, { data: appointments, error: appointmentError }] =
    await Promise.all([
      supabase
        .from('consultation_requests')
        .select(
          'id, lead_id, preferred_callback_time, question, status, assigned_doctor_id, created_at, leads(full_name, phone, risk_level), doctor_responses(id, doctor_id, response_text, created_at)'
        )
        .eq('assigned_doctor_id', doctor.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('appointments')
        .select(
          'id, appointment_date, appointment_time, status, leads(full_name, phone), services(name)'
        )
        .eq('doctor_id', doctor.id)
        .gte('appointment_date', getUlaanbaatarDateKey())
        .order('appointment_date')
        .order('appointment_time'),
    ])

  const normalizedConsultations = ((consultations ?? []) as Array<
    DoctorConsultation & {
      leads?: DoctorConsultation['leads'] | DoctorConsultation['leads'][]
      doctor_responses?: DoctorConsultation['doctor_responses']
    }
  >).map((consultation) => ({
    ...consultation,
    leads: Array.isArray(consultation.leads) ? consultation.leads[0] : consultation.leads,
    doctor_responses: Array.isArray(consultation.doctor_responses)
      ? consultation.doctor_responses
      : [],
  }))

  const normalizedAppointments = ((appointments ?? []) as Array<
    DoctorAppointment & {
      leads?: DoctorAppointment['leads'] | DoctorAppointment['leads'][]
      services?: DoctorAppointment['services'] | DoctorAppointment['services'][]
    }
  >).map((appointment) => ({
    ...appointment,
    leads: Array.isArray(appointment.leads) ? appointment.leads[0] ?? null : appointment.leads,
    services: Array.isArray(appointment.services)
      ? appointment.services[0] ?? null
      : appointment.services,
  }))

  return {
    doctorId: doctor.id,
    doctorLabel: doctor.full_name || doctorLabel,
    consultations: normalizedConsultations,
    appointments: normalizedAppointments,
    error: consultationError?.message ?? appointmentError?.message ?? null,
  }
}

export default async function DoctorDashboardPage() {
  const viewer = await requireRole(['doctor', 'super_admin'])
  const initialDashboard = await getDoctorDashboardData({
    id: viewer.id,
    full_name: viewer.full_name,
    email: viewer.email,
  })

  return <DoctorDashboardClient initialDashboard={initialDashboard} />
}

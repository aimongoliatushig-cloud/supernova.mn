import type { DoctorAppointment } from '@/components/dashboard/DoctorAppointmentsBoard'

export interface DoctorDashboardViewer {
  id: string
  full_name: string | null
  email: string
}

export interface ConsultationResponse {
  id?: string
  doctor_id: string
  response_text: string
  created_at: string
}

export interface DoctorConsultation {
  id: string
  lead_id: string
  preferred_callback_time: 'morning' | 'afternoon' | 'evening'
  question: string | null
  status: 'new' | 'assigned' | 'answered' | 'called' | 'closed'
  assigned_doctor_id?: string | null
  created_at: string
  leads?: {
    full_name: string
    phone: string
    risk_level: 'low' | 'medium' | 'high' | null
  }
  doctor_responses?: ConsultationResponse[]
}

export interface DoctorDashboardData {
  doctorId: string | null
  doctorLabel: string
  consultations: DoctorConsultation[]
  appointments: DoctorAppointment[]
  error: string | null
}

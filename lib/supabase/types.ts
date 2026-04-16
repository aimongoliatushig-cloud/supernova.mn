// ─── Supernova Database Types ─────────────────────────────────────────────
// Auto-synced with the Supabase schema defined in /supabase/schema.sql

export type Role = 'patient' | 'office_assistant' | 'operator' | 'doctor' | 'super_admin'
export type RiskLevel = 'low' | 'medium' | 'high'
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type ConsultationStatus = 'new' | 'assigned' | 'answered' | 'called' | 'closed'
export type LeadStatus = 'new' | 'contacted' | 'pending' | 'confirmed' | 'blacklisted'
export type CallbackTime = 'morning' | 'afternoon' | 'evening'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: Role
  phone: string | null
  created_at: string
  updated_at: string
}

export interface SymptomCategory {
  id: string
  name: string
  name_en: string | null
  icon: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Question {
  id: string
  category_id: string
  question_text: string
  question_type: 'single' | 'multiple' | 'slider' | 'text'
  sort_order: number
  is_required: boolean
  risk_weight: number
  created_at: string
}

export interface AnswerOption {
  id: string
  question_id: string
  option_text: string
  risk_score: number
  sort_order: number
  created_at: string
}

export interface Doctor {
  id: string
  profile_id: string | null
  full_name: string
  title: string
  specialization: string
  experience_years: number
  bio: string | null
  photo_url: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration_minutes: number
  preparation_notice: string | null
  has_last_booking_time: boolean
  last_booking_time: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Promotion {
  id: string
  service_id: string | null
  title: string
  description: string | null
  discount_percent: number | null
  discount_amount: number | null
  free_gift: string | null
  badge_text: string
  badge_color: string
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
}

export interface Lead {
  id: string
  full_name: string
  phone: string
  email: string | null
  risk_level: RiskLevel | null
  risk_score: number | null
  status: LeadStatus
  source: string | null
  notes: string | null
  categories_selected: string[] | null
  created_at: string
  updated_at: string
}

export interface Assessment {
  id: string
  lead_id: string
  risk_level: RiskLevel
  risk_score: number
  summary: string | null
  created_at: string
}

export interface AssessmentAnswer {
  id: string
  assessment_id: string
  question_id: string
  answer_option_ids: string[] | null
  slider_value: number | null
  text_answer: string | null
  created_at: string
}

export interface Appointment {
  id: string
  lead_id: string
  doctor_id: string | null
  service_id: string | null
  appointment_date: string
  appointment_time: string
  status: AppointmentStatus
  notes: string | null
  preparation_notice: string | null
  created_at: string
  updated_at: string
}

export interface ConsultationRequest {
  id: string
  lead_id: string
  preferred_callback_time: CallbackTime
  question: string | null
  status: ConsultationStatus
  assigned_doctor_id: string | null
  assigned_by: string | null
  assigned_at: string | null
  created_at: string
  updated_at: string
}

export interface DoctorResponse {
  id: string
  consultation_id: string
  doctor_id: string
  response_text: string
  created_at: string
}

export interface CrmNote {
  id: string
  lead_id: string
  author_id: string
  note_text: string
  created_at: string
}

// ─── Joined / enriched types ──────────────────────────────────────────────

export interface LeadWithRelations extends Lead {
  appointments?: Appointment[]
  consultation_requests?: ConsultationRequest[]
  crm_notes?: CrmNote[]
  assessments?: Assessment[]
}

export interface DoctorService {
  doctor_id: string
  service_id: string
}

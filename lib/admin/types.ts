export type AdminActionResult<T = void> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string }

export type Role = 'patient' | 'office_assistant' | 'doctor' | 'super_admin'
export type RiskLevel = 'low' | 'medium' | 'high'
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'pending'
  | 'confirmed'
  | 'blacklisted'
export type ConsultationWorkflowStatus =
  | 'new'
  | 'assigned'
  | 'answered'
  | 'called'
  | 'closed'

export interface AdminViewer {
  id: string
  email: string
  full_name: string | null
  role: Role
}

export interface CmsEntry {
  id: string
  key: string
  value: string | null
  label: string | null
  section: string | null
  updated_at?: string
}

export interface CmsEntryInput {
  id?: string
  key: string
  value: string
  label: string
  section: string
}

export interface ContactSettings {
  id: string
  phone: string | null
  address: string | null
  email: string | null
  map_embed: string | null
}

export interface ContactSettingsInput {
  id?: string
  phone: string
  address: string
  email: string
  map_embed: string
}

export interface SocialLink {
  id: string
  platform: string
  url: string
  is_active: boolean
  sort_order: number
}

export interface SocialLinkInput {
  id?: string
  platform: string
  url: string
  is_active: boolean
  sort_order: number
}

export interface WorkingHours {
  id: string
  day_label: string
  open_time: string
  close_time: string
  is_active: boolean
  sort_order: number
}

export interface WorkingHoursInput {
  id?: string
  day_label: string
  open_time: string
  close_time: string
  is_active: boolean
  sort_order: number
}

export interface ServiceCategory {
  id: string
  name: string
  icon: string | null
  sort_order: number
  is_active: boolean
}

export interface ServiceCategoryInput {
  id?: string
  name: string
  icon: string
  sort_order: number
  is_active: boolean
}

export interface DoctorServiceRelation {
  service_id: string
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
  schedule_summary: string | null
  is_active: boolean
  show_on_landing: boolean
  available_for_booking: boolean
  sort_order: number
  login_email?: string | null
  doctor_services?: DoctorServiceRelation[]
}

export interface DoctorInput {
  id?: string
  profile_id?: string | null
  full_name: string
  title: string
  specialization: string
  experience_years: number
  bio: string
  photo_url: string
  schedule_summary: string
  is_active: boolean
  show_on_landing: boolean
  available_for_booking: boolean
  sort_order: number
  login_email: string
  login_password: string
  service_ids: string[]
}

export interface Service {
  id: string
  name: string
  category_id: string | null
  description: string | null
  price: number
  duration_minutes: number
  preparation_notice: string | null
  promotion_flag: boolean
  is_active: boolean
  show_on_landing: boolean
  show_on_result: boolean
  show_on_booking: boolean
  sort_order: number
}

export interface ServiceInput {
  id?: string
  name: string
  category_id: string | null
  description: string
  price: number
  duration_minutes: number
  preparation_notice: string
  promotion_flag: boolean
  is_active: boolean
  show_on_landing: boolean
  show_on_result: boolean
  show_on_booking: boolean
  sort_order: number
}

export interface PackageServiceRelation {
  service_id: string
}

export interface ServicePackage {
  id: string
  title: string
  description: string | null
  price: number
  old_price: number | null
  promotion_text: string | null
  badge_text: string | null
  badge_color: string
  is_active: boolean
  show_on_landing: boolean
  show_on_result: boolean
  sort_order: number
  package_services?: PackageServiceRelation[]
}

export interface ServicePackageInput {
  id?: string
  title: string
  description: string
  price: number
  old_price: number | null
  promotion_text: string
  badge_text: string
  badge_color: string
  is_active: boolean
  show_on_landing: boolean
  show_on_result: boolean
  sort_order: number
  service_ids: string[]
}

export interface Promotion {
  id: string
  title: string
  description: string | null
  discount_percent: number | null
  discount_amount: number | null
  free_gift: string | null
  badge_text: string
  badge_color: string
  service_id: string | null
  package_id: string | null
  show_on_landing: boolean
  show_on_result: boolean
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
}

export interface PromotionInput {
  id?: string
  title: string
  description: string
  discount_percent: number | null
  discount_amount: number | null
  free_gift: string
  badge_text: string
  badge_color: string
  target_type: 'service' | 'package'
  target_id: string
  show_on_landing: boolean
  show_on_result: boolean
  is_active: boolean
  starts_at: string
  ends_at: string
}

export interface SymptomCategory {
  id: string
  name: string
  slug: string | null
  icon: string
  description: string | null
  sort_order: number
  is_active: boolean
  show_on_landing: boolean
}

export interface SymptomCategoryInput {
  id?: string
  name: string
  slug: string
  icon: string
  description: string
  sort_order: number
  is_active: boolean
  show_on_landing: boolean
}

export type QuestionType = 'single' | 'multiple' | 'slider' | 'text'

export interface DiagnosisQuestion {
  id: string
  category_id: string
  question_text: string
  help_text: string | null
  question_type: QuestionType
  sort_order: number
  is_required: boolean
  is_active: boolean
  risk_weight: number
}

export interface DiagnosisQuestionInput {
  id?: string
  category_id: string
  question_text: string
  help_text: string
  question_type: QuestionType
  sort_order: number
  is_required: boolean
  is_active: boolean
  risk_weight: number
}

export interface DiagnosisAnswerOption {
  id: string
  question_id: string
  option_text: string
  recommendation: string | null
  risk_score: number
  sort_order: number
  is_active: boolean
}

export interface DiagnosisAnswerOptionInput {
  id?: string
  question_id: string
  option_text: string
  recommendation: string
  risk_score: number
  sort_order: number
  is_active: boolean
}

export interface AppointmentSummary {
  id: string
  appointment_date: string
  appointment_time: string
  status: AppointmentStatus
  doctors?: { full_name: string | null } | null
  services?: { name: string | null } | null
}

export interface UnifiedCalendarAppointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: AppointmentStatus
  notes?: string | null
  preparation_notice?: string | null
  leads?: {
    full_name: string | null
    phone: string | null
  } | null
  doctors?: {
    full_name: string | null
    specialization?: string | null
  } | null
  services?: {
    name: string | null
  } | null
}

export interface ConsultationSummary {
  id: string
  preferred_callback_time: string
  question: string | null
  status: ConsultationWorkflowStatus
  assigned_doctor_id?: string | null
  assigned_at?: string | null
  doctors?: {
    full_name: string | null
    specialization?: string | null
  } | null
  doctor_responses?: Array<{
    id: string
    response_text: string
    created_at: string
  }>
}

export interface CrmNote {
  id: string
  author_id: string
  note_text: string
  created_at: string
}

export interface AssessmentSummary {
  id: string
  risk_level: RiskLevel
  risk_score: number
  created_at: string
}

export interface AdminLead {
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
  is_blacklisted?: boolean
  created_at: string
  updated_at: string
  assessments?: AssessmentSummary[]
  appointments?: AppointmentSummary[]
  consultation_requests?: ConsultationSummary[]
  crm_notes?: CrmNote[]
}

export interface CrmNoteInput {
  lead_id: string
  note_text: string
}

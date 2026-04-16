import type { RiskLevel } from '@/lib/admin/types'

export interface PublicContactSettings {
  phone: string | null
  address: string | null
  email: string | null
  map_embed: string | null
}

export interface PublicSocialLink {
  id: string
  platform: string
  url: string
  sort_order: number
}

export interface PublicWorkingHours {
  id: string
  day_label: string
  open_time: string
  close_time: string
  sort_order: number
}

export interface PublicDoctorServiceRelation {
  service_id: string
}

export interface PublicDoctor {
  id: string
  full_name: string
  title: string
  specialization: string
  experience_years: number
  bio: string | null
  photo_url: string | null
  schedule_summary: string | null
  doctor_services?: PublicDoctorServiceRelation[]
}

export interface PublicServiceCategory {
  id: string
  name: string
  icon: string | null
}

export interface PublicService {
  id: string
  name: string
  description: string | null
  price: number
  duration_minutes: number
  preparation_notice: string | null
  promotion_flag: boolean
  category_id: string | null
  categories?: PublicServiceCategory | null
}

export interface PublicPackageServiceRelation {
  service_id: string
  services?: {
    id: string
    name: string
  } | null
}

export interface PublicServicePackage {
  id: string
  title: string
  description: string | null
  price: number
  old_price: number | null
  promotion_text: string | null
  badge_text: string | null
  badge_color: string
  package_services?: PublicPackageServiceRelation[]
}

export interface PublicPromotion {
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
}

export interface PublicBlogCategory {
  id: string
  name: string
  slug: string
}

export interface PublicBlogArticle {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  image_url: string | null
  cta_label: string | null
  cta_link: string | null
  published_at: string | null
  publisher_name: string | null
  view_count: number
  categories?: PublicBlogCategory | null
}

export interface PublicDiagnosisOption {
  id: string
  option_text: string
  recommendation: string | null
  risk_score: number
  sort_order: number
}

export interface PublicDiagnosisQuestion {
  id: string
  category_id: string
  question_text: string
  help_text: string | null
  question_type: 'single' | 'multiple' | 'slider' | 'text'
  sort_order: number
  is_required: boolean
  risk_weight: number
  options: PublicDiagnosisOption[]
}

export interface PublicDiagnosisCategory {
  id: string
  name: string
  slug: string | null
  icon: string
  description: string | null
  sort_order: number
  questions: PublicDiagnosisQuestion[]
}

export interface PublicAssessmentResult {
  assessment_id: string
  lead_id: string
  full_name: string
  phone: string
  email: string | null
  risk_level: RiskLevel
  risk_score: number
  categories_selected: string[]
  created_at: string
}

export interface PublicCmsContent {
  entries: Record<string, string>
  contact: PublicContactSettings | null
  socials: PublicSocialLink[]
  workingHours: PublicWorkingHours[]
}

export interface PublicLandingData extends PublicCmsContent {
  doctors: PublicDoctor[]
  services: PublicService[]
  packages: PublicServicePackage[]
  promotions: PublicPromotion[]
  serviceCategories: PublicServiceCategory[]
  articles: PublicBlogArticle[]
}

export interface PublicDiagnosisData extends PublicCmsContent {
  categories: PublicDiagnosisCategory[]
}

export interface PublicAppointmentSlot {
  doctor_id: string | null
  appointment_date: string
  appointment_time: string
  duration_minutes: number
}

export interface PublicBookingData extends PublicCmsContent {
  doctors: PublicDoctor[]
  services: PublicService[]
  promotions: PublicPromotion[]
  bookedAppointments: PublicAppointmentSlot[]
}

export interface PublicResultData extends PublicCmsContent {
  assessment: PublicAssessmentResult
  doctors: PublicDoctor[]
  services: PublicService[]
  packages: PublicServicePackage[]
  promotions: PublicPromotion[]
}

export interface SubmitAssessmentInput {
  full_name: string
  phone: string
  email?: string
  category_ids: string[]
  answers: Array<{
    question_id: string
    answer_option_id: string
  }>
}

export interface SubmitAppointmentInput {
  lead_id?: string | null
  assessment_id?: string | null
  full_name: string
  phone: string
  email?: string
  service_id: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
}

export interface SubmitConsultationInput {
  lead_id?: string | null
  assessment_id?: string | null
  full_name: string
  phone: string
  email?: string
  preferred_callback_time: 'morning' | 'afternoon' | 'evening'
  question?: string
}

export interface SubmitOrganizationQuoteInput {
  organization_name: string
  organization_industry: string
  contact_name: string
  phone: string
  email: string
  employee_count: number
}

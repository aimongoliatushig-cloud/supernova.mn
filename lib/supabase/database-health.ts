import 'server-only'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient, hasServiceRoleConfig } from '@/lib/supabase/service-role'

type TableDefinition = {
  name: string
  label: string
  requiredForSeed: boolean
}

export type DatabaseTableStatus = {
  name: string
  label: string
  exists: boolean
  sampleCount: number | null
  errorCode: string | null
  error: string | null
}

export type DatabaseHealth = {
  checkedWithServiceRole: boolean
  schemaReady: boolean
  seedReady: boolean
  missingTables: string[]
  tables: DatabaseTableStatus[]
  adminAccount: {
    email: string
    authUserExists: boolean | null
    profileRole: string | null
  }
}

const REQUIRED_TABLES: TableDefinition[] = [
  { name: 'profiles', label: 'Профайл', requiredForSeed: false },
  { name: 'landing_page_content', label: 'Landing CMS', requiredForSeed: true },
  { name: 'contact_settings', label: 'Холбоо барих', requiredForSeed: true },
  { name: 'social_links', label: 'Сошиал холбоос', requiredForSeed: true },
  { name: 'working_hours', label: 'Ажлын цаг', requiredForSeed: true },
  { name: 'service_categories', label: 'Үйлчилгээний ангилал', requiredForSeed: true },
  { name: 'doctors', label: 'Эмч нар', requiredForSeed: true },
  { name: 'services', label: 'Үйлчилгээ', requiredForSeed: true },
  { name: 'service_packages', label: 'Багц', requiredForSeed: false },
  { name: 'package_services', label: 'Багц-үйлчилгээ холбоос', requiredForSeed: false },
  { name: 'promotions', label: 'Урамшуулал', requiredForSeed: false },
  { name: 'symptom_categories', label: 'Шинж тэмдгийн ангилал', requiredForSeed: true },
  { name: 'questions', label: 'Асуулт', requiredForSeed: true },
  { name: 'answer_options', label: 'Хариултын сонголт', requiredForSeed: true },
  { name: 'doctor_services', label: 'Эмч-үйлчилгээ холбоос', requiredForSeed: false },
  { name: 'leads', label: 'Лид', requiredForSeed: false },
  { name: 'assessments', label: 'Үнэлгээ', requiredForSeed: false },
  { name: 'assessment_answers', label: 'Үнэлгээний хариулт', requiredForSeed: false },
  { name: 'appointments', label: 'Цаг захиалга', requiredForSeed: false },
  { name: 'consultation_requests', label: 'Утасны зөвлөгөө', requiredForSeed: false },
  { name: 'doctor_responses', label: 'Эмчийн хариу', requiredForSeed: false },
  { name: 'crm_notes', label: 'CRM тэмдэглэл', requiredForSeed: false },
]

function isMissingTableError(error: { code?: string | null; message?: string | null } | null) {
  if (!error) {
    return false
  }

  return (
    error.code === 'PGRST205' ||
    error.message?.includes("Could not find the table 'public.") === true
  )
}

async function getDiagnosticClient() {
  if (hasServiceRoleConfig()) {
    return {
      client: createServiceRoleClient(),
      checkedWithServiceRole: true,
    }
  }

  return {
    client: await createClient(),
    checkedWithServiceRole: false,
  }
}

async function getAdminAccountStatus(
  checkedWithServiceRole: boolean,
  tables: DatabaseTableStatus[]
) {
  const adminEmail = 'admin@gmail.com'

  if (!checkedWithServiceRole) {
    return {
      email: adminEmail,
      authUserExists: null,
      profileRole: null,
    }
  }

  const supabase = createServiceRoleClient()
  const { data: users, error: authError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  })

  const authUser = authError
    ? null
    : users.users.find((user) => user.email?.toLowerCase() === adminEmail)

  const profilesStatus = tables.find((table) => table.name === 'profiles')
  if (!profilesStatus?.exists) {
    return {
      email: adminEmail,
      authUserExists: Boolean(authUser),
      profileRole: null,
    }
  }

  const { data: profile } = await createServiceRoleClient()
    .from('profiles')
    .select('role')
    .eq('email', adminEmail)
    .maybeSingle()

  return {
    email: adminEmail,
    authUserExists: Boolean(authUser),
    profileRole: profile?.role ?? null,
  }
}

export const checkDatabaseHealth = cache(async (): Promise<DatabaseHealth> => {
  const { client, checkedWithServiceRole } = await getDiagnosticClient()

  const tables = await Promise.all(
    REQUIRED_TABLES.map(async (table): Promise<DatabaseTableStatus> => {
      try {
        const { data, error } = await client
          .from(table.name)
          .select('*')
          .limit(1)

        if (error) {
          return {
            name: table.name,
            label: table.label,
            exists: !isMissingTableError(error),
            sampleCount: null,
            errorCode: error.code ?? null,
            error: error.message,
          }
        }

        return {
          name: table.name,
          label: table.label,
          exists: true,
          sampleCount: Array.isArray(data) ? data.length : 0,
          errorCode: null,
          error: null,
        }
      } catch (error: unknown) {
        return {
          name: table.name,
          label: table.label,
          exists: false,
          sampleCount: null,
          errorCode: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    })
  )

  const missingTables = tables.filter((table) => !table.exists).map((table) => table.name)
  const schemaReady = missingTables.length === 0
  const seedReady =
    schemaReady &&
    REQUIRED_TABLES.filter((table) => table.requiredForSeed).every((table) => {
      const status = tables.find((item) => item.name === table.name)
      return (status?.sampleCount ?? 0) > 0
    })

  return {
    checkedWithServiceRole,
    schemaReady,
    seedReady,
    missingTables,
    tables,
    adminAccount: await getAdminAccountStatus(checkedWithServiceRole, tables),
  }
})

import nextEnv from '@next/env'
import { createClient } from '@supabase/supabase-js'

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  process.exit(1)
}

const requiredTables = [
  'profiles',
  'landing_page_content',
  'contact_settings',
  'social_links',
  'working_hours',
  'service_categories',
  'doctors',
  'services',
  'service_packages',
  'package_services',
  'promotions',
  'symptom_categories',
  'questions',
  'answer_options',
  'doctor_services',
  'leads',
  'assessments',
  'assessment_answers',
  'appointments',
  'consultation_requests',
  'doctor_responses',
  'crm_notes',
]

const client = createClient(url, serviceRoleKey || anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

function isMissingTableError(error) {
  return (
    error?.code === 'PGRST205' ||
    String(error?.message || '').includes("Could not find the table 'public.")
  )
}

const tableResults = []

for (const table of requiredTables) {
  const { data, error } = await client.from(table).select('*').limit(1)

  tableResults.push({
    table,
    exists: error ? !isMissingTableError(error) : true,
    sampleCount: error ? null : Array.isArray(data) ? data.length : 0,
    error: error?.message ?? null,
  })
}

const missingTables = tableResults.filter((result) => !result.exists).map((result) => result.table)

console.log('')
console.log('Supabase database check')
console.log(`Client mode: ${serviceRoleKey ? 'service_role' : 'anon'}`)
console.log(`Schema ready: ${missingTables.length === 0 ? 'yes' : 'no'}`)
if (missingTables.length > 0) {
  console.log(`Missing tables: ${missingTables.join(', ')}`)
}
console.log('')
console.table(tableResults)

if (serviceRoleKey) {
  const { data: users, error: authError } = await client.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  })

  if (authError) {
    console.log('')
    console.log(`Admin auth check failed: ${authError.message}`)
  } else {
    const adminUser = users.users.find((user) => user.email?.toLowerCase() === 'admin@gmail.com')
    console.log('')
    console.log(`admin@gmail.com auth user: ${adminUser ? 'found' : 'missing'}`)

    const profilesTable = tableResults.find((result) => result.table === 'profiles')
    if (profilesTable?.exists) {
      const { data: profile, error: profileError } = await createClient(url, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
        .from('profiles')
        .select('email, role')
        .eq('email', 'admin@gmail.com')
        .maybeSingle()

      if (profileError) {
        console.log(`admin@gmail.com profile check failed: ${profileError.message}`)
      } else {
        console.log(`admin@gmail.com profile role: ${profile?.role ?? 'missing'}`)
      }
    }
  }
}

console.log('')
console.log('Recommended SQL order:')
console.log('1. supabase/schema.sql')
console.log('2. supabase/schema-v2.sql')
console.log('3. supabase/schema-v3.sql')
console.log('4. supabase/seed.sql')
console.log('5. supabase/seed-v2.sql')
console.log('6. supabase/seed-v3.sql')

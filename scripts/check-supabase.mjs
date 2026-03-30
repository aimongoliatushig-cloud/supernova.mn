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
  { name: 'profiles', minimumSeedCount: 0 },
  { name: 'landing_page_content', minimumSeedCount: 10 },
  { name: 'contact_settings', minimumSeedCount: 1 },
  { name: 'social_links', minimumSeedCount: 1 },
  { name: 'working_hours', minimumSeedCount: 1 },
  { name: 'service_categories', minimumSeedCount: 5 },
  { name: 'doctors', minimumSeedCount: 3 },
  { name: 'services', minimumSeedCount: 5 },
  { name: 'service_packages', minimumSeedCount: 1 },
  { name: 'package_services', minimumSeedCount: 1 },
  { name: 'promotions', minimumSeedCount: 1 },
  { name: 'symptom_categories', minimumSeedCount: 5 },
  { name: 'questions', minimumSeedCount: 20 },
  { name: 'answer_options', minimumSeedCount: 40 },
  { name: 'doctor_services', minimumSeedCount: 4 },
  { name: 'leads', minimumSeedCount: 0 },
  { name: 'assessments', minimumSeedCount: 0 },
  { name: 'assessment_answers', minimumSeedCount: 0 },
  { name: 'appointments', minimumSeedCount: 0 },
  { name: 'consultation_requests', minimumSeedCount: 0 },
  { name: 'doctor_responses', minimumSeedCount: 0 },
  { name: 'crm_notes', minimumSeedCount: 0 },
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
  const { count, error } = await client
    .from(table.name)
    .select('*', { count: 'exact', head: true })

  tableResults.push({
    table: table.name,
    exists: error ? !isMissingTableError(error) : true,
    sampleCount: error ? null : count ?? 0,
    minimumSeedCount: table.minimumSeedCount,
    error: error?.message ?? null,
  })
}

const missingTables = tableResults.filter((result) => !result.exists).map((result) => result.table)
const seedGaps = tableResults
  .filter((result) => result.exists && (result.sampleCount ?? 0) < result.minimumSeedCount)
  .map((result) => `${result.table}(${result.sampleCount}/${result.minimumSeedCount})`)

console.log('')
console.log('Supabase database check')
console.log(`Client mode: ${serviceRoleKey ? 'service_role' : 'anon'}`)
console.log(`Schema ready: ${missingTables.length === 0 ? 'yes' : 'no'}`)
console.log(`Seed ready: ${missingTables.length === 0 && seedGaps.length === 0 ? 'yes' : 'no'}`)
if (missingTables.length > 0) {
  console.log(`Missing tables: ${missingTables.join(', ')}`)
}
if (seedGaps.length > 0) {
  console.log(`Seed gaps: ${seedGaps.join(', ')}`)
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
console.log('7. supabase/seed-v4.sql')

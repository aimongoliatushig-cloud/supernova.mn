import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const outputPath = join(root, 'supabase', 'bootstrap.sql')
const parts = [
  'schema.sql',
  'schema-v2.sql',
  'schema-v3.sql',
  'schema-v4.sql',
  'seed.sql',
  'seed-v2.sql',
  'seed-v3.sql',
  'seed-v4.sql',
]

const header = [
  '-- SUPERNOVA remote bootstrap',
  '-- Generated file. Run this whole file in Supabase SQL Editor.',
  '-- Source order:',
  ...parts.map((part, index) => `-- ${index + 1}. ${part}`),
  '',
].join('\n')

const body = parts
  .map((part) => {
    const contents = readFileSync(join(root, 'supabase', part), 'utf8').trim()
    return [``, `-- ===== BEGIN ${part} =====`, contents, `-- ===== END ${part} =====`].join('\n')
  })
  .join('\n')

writeFileSync(outputPath, `${header}${body}\n`, 'utf8')
console.log(`Wrote ${outputPath}`)

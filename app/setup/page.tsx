import { createClient } from '@/lib/supabase/server'

type TableStatus = {
  name: string
  label: string
  count: number | null
  error: string | null
}

async function checkTable(supabase: Awaited<ReturnType<typeof createClient>>, table: string, label: string): Promise<TableStatus> {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) return { name: table, label, count: null, error: error.message }
    return { name: table, label, count: count ?? 0, error: null }
  } catch (e: unknown) {
    return { name: table, label, count: null, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export default async function SetupPage() {
  const supabase = await createClient()

  const tables: TableStatus[] = await Promise.all([
    checkTable(supabase, 'symptom_categories', 'Симптомын ангилал'),
    checkTable(supabase, 'questions',          'Асуултууд'),
    checkTable(supabase, 'answer_options',     'Хариултын сонголтууд'),
    checkTable(supabase, 'doctors',            'Эмч нар'),
    checkTable(supabase, 'services',           'Үйлчилгээ'),
    checkTable(supabase, 'promotions',         'Урамшуулал'),
    checkTable(supabase, 'leads',              'Leads (хэрэглэгч)'),
    checkTable(supabase, 'profiles',           'Профайл'),
  ])

  const allOk = tables.every(t => t.error === null)
  const hasData = tables.filter(t => t.name !== 'leads' && t.name !== 'profiles').every(t => (t.count ?? 0) > 0)

  return (
    <div className="min-h-screen bg-[#F7FAFF] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-[#E5E7EB] overflow-hidden">
        {/* Header */}
        <div className={`px-8 py-6 ${allOk ? 'bg-gradient-to-r from-[#1E63B5] to-[#154d8f]' : 'bg-gradient-to-r from-[#E8323F] to-[#c0272d]'} text-white`}>
          <div className="text-2xl font-black mb-1">⚙️ Суперновa — DB Тохиргоо</div>
          <div className="text-sm text-blue-100">
            {allOk
              ? hasData
                ? '✅ Бүх хүснэгт байна, seed өгөгдөл байна — бэлэн!'
                : '⚠️ Хүснэгтүүд байна, гэхдээ seed өгөгдөл байхгүй — seed.sql ажиллуулна уу'
              : '❌ Хүснэгтүүд олдсонгүй — schema.sql-ийг эхлээд ажиллуулна уу'}
          </div>
        </div>

        {/* Table statuses */}
        <div className="p-6 space-y-2">
          {tables.map((t) => (
            <div key={t.name} className="flex items-center justify-between bg-[#F7FAFF] rounded-xl px-4 py-3">
              <div>
                <div className="text-sm font-bold text-[#1F2937]">{t.label}</div>
                <div className="text-xs text-[#9CA3AF] font-mono">{t.name}</div>
              </div>
              <div className="text-right">
                {t.error
                  ? <span className="text-xs text-[#E8323F] font-bold">❌ Олдсонгүй</span>
                  : <span className="text-sm font-black text-[#1E63B5]">{t.count} мөр</span>
                }
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="border-t border-[#E5E7EB] px-6 py-5 bg-[#FAFAFA]">
          {!allOk && (
            <div className="mb-4">
              <div className="text-sm font-black text-[#1F2937] mb-2">1-р алхам: Schema ажиллуулах</div>
              <div className="bg-[#1F2937] text-green-300 text-xs font-mono rounded-xl px-4 py-3 leading-relaxed">
                Supabase → SQL Editor → New Query<br />
                → supabase/schema.sql-ийг paste хийж Run дарна
              </div>
            </div>
          )}
          {allOk && !hasData && (
            <div className="mb-4">
              <div className="text-sm font-black text-[#1F2937] mb-2">2-р алхам: Seed өгөгдөл оруулах</div>
              <div className="bg-[#1F2937] text-green-300 text-xs font-mono rounded-xl px-4 py-3 leading-relaxed">
                Supabase → SQL Editor → New Query<br />
                → supabase/seed.sql-ийг paste хийж Run дарна
              </div>
            </div>
          )}
          <div className="mb-4">
            <div className="text-sm font-black text-[#1F2937] mb-2">{allOk && hasData ? '3-р алхам' : '3-р алхам'}: Admin хэрэглэгч үүсгэх</div>
            <div className="bg-[#1F2937] text-green-300 text-xs font-mono rounded-xl px-4 py-3 leading-relaxed">
              Supabase → Authentication → Users → Add user<br />
              Email: admin@supernova.mn<br />
              Password: (өөрийн нууц үг)
            </div>
          </div>
          <div className="mb-4">
            <div className="text-sm font-black text-[#1F2937] mb-2">4-р алхам: Super admin роль тохируулах</div>
            <div className="bg-[#1F2937] text-green-300 text-xs font-mono rounded-xl px-4 py-3 leading-relaxed">
              Supabase → SQL Editor → New Query:<br /><br />
              UPDATE profiles<br />
              SET role = &apos;super_admin&apos;<br />
              WHERE email = &apos;admin@supernova.mn&apos;;
            </div>
          </div>
          {allOk && hasData && (
            <div className="bg-[#ECFDF5] border border-[#6EE7B7] rounded-xl px-4 py-3 text-center">
              <div className="text-sm font-black text-[#059669]">🎉 Бүх зүйл бэлэн!</div>
              <a href="/auth/login" className="text-xs text-[#059669] underline">→ /auth/login дээр нэвтрэх</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

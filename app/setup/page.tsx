import { createClient } from '@/lib/supabase/server'

type TableStatus = {
  name: string
  label: string
  count: number | null
  error: string | null
}

async function checkTable(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  label: string
): Promise<TableStatus> {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      return { name: table, label, count: null, error: error.message }
    }

    return { name: table, label, count: count ?? 0, error: null }
  } catch (error: unknown) {
    return {
      name: table,
      label,
      count: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export default async function SetupPage() {
  const supabase = await createClient()

  const tables = await Promise.all([
    checkTable(supabase, 'symptom_categories', 'Симптомын ангилал'),
    checkTable(supabase, 'questions', 'Асуултууд'),
    checkTable(supabase, 'answer_options', 'Хариултын сонголтууд'),
    checkTable(supabase, 'doctors', 'Эмч нар'),
    checkTable(supabase, 'services', 'Үйлчилгээ'),
    checkTable(supabase, 'promotions', 'Урамшуулал'),
    checkTable(supabase, 'profiles', 'Профайл'),
  ])

  const allOk = tables.every((table) => table.error === null)
  const hasSeedData = tables
    .filter((table) => table.name !== 'profiles')
    .every((table) => (table.count ?? 0) > 0)

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7FAFF_0%,#FFFFFF_100%)] px-4 py-10">
      <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-[2rem] border border-[#D8E6F6] bg-white shadow-[0_30px_100px_rgba(17,37,68,0.12)]">
        <div className={`px-8 py-7 text-white ${allOk ? 'bg-[linear-gradient(135deg,#1E63B5_0%,#154D8F_100%)]' : 'bg-[linear-gradient(135deg,#E8323F_0%,#C0272D_100%)]'}`}>
          <h1 className="text-3xl font-black tracking-tight">Системийн төлөв</h1>
          <p className="mt-3 text-sm leading-7 text-blue-50">
            Өгөгдлийн сангийн хүснэгтүүд болон seed өгөгдлийн ерөнхий төлвийг шалгана.
          </p>
        </div>

        <div className="p-6 md:p-8">
          <div className="space-y-3">
            {tables.map((table) => (
              <div
                key={table.name}
                className="flex items-center justify-between rounded-2xl border border-[#E6EEF8] bg-[#FBFDFF] px-4 py-4"
              >
                <div>
                  <p className="text-sm font-bold text-[#10233B]">{table.label}</p>
                  <p className="mt-1 text-xs text-[#7A8796]">{table.name}</p>
                </div>
                {table.error ? (
                  <span className="text-sm font-bold text-[#D63045]">Алдаа</span>
                ) : (
                  <span className="text-sm font-black text-[#1E63B5]">
                    {table.count} мөр
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-[#E6EEF8] bg-[#F8FBFF] px-5 py-4">
            <p className="text-sm font-semibold text-[#10233B]">
              {allOk
                ? hasSeedData
                  ? 'Системийн үндсэн өгөгдөл бэлэн байна.'
                  : 'Хүснэгтүүд байна, seed өгөгдөл дутуу байна.'
                : 'Өгөгдлийн сангийн тохиргоо дутуу байна.'}
            </p>
          </div>

          <div className="mt-6">
            <a
              href="/admin"
              className="inline-flex items-center justify-center rounded-2xl bg-[#1E63B5] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#154D8F]"
            >
              Админ нэвтрэх
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

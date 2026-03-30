import Link from 'next/link'
import { checkDatabaseHealth } from '@/lib/supabase/database-health'

export default async function SetupPage() {
  const health = await checkDatabaseHealth()

  const statusTone = health.schemaReady
    ? 'bg-[linear-gradient(135deg,#1E63B5_0%,#154D8F_100%)]'
    : 'bg-[linear-gradient(135deg,#E8323F_0%,#C0272D_100%)]'

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7FAFF_0%,#FFFFFF_100%)] px-4 py-10">
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[#D8E6F6] bg-white shadow-[0_30px_100px_rgba(17,37,68,0.12)]">
        <div className={`px-8 py-7 text-white ${statusTone}`}>
          <h1 className="text-3xl font-black tracking-tight">Database төлөв</h1>
          <p className="mt-3 text-sm leading-7 text-blue-50">
            {health.schemaReady
              ? health.seedReady
                ? 'Schema болон seed бүрэн бэлэн байна. Энэ хуудас нь remote Supabase дээрх холбоосуудын төлөвийг шалгана.'
                : 'Schema бэлэн боловч seed дутуу байна. Энэ хуудас нь remote Supabase дээрх дутуу өгөгдлийг шалгана.'
              : 'Remote Supabase дээр schema дутуу байна. Энэ хуудас нь алга байгаа хүснэгтүүдийг шалгана.'}
          </p>
        </div>

        <div className="p-6 md:p-8">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              {health.tables.map((table) => (
                <div
                  key={table.name}
                  className="flex items-center justify-between rounded-2xl border border-[#E6EEF8] bg-[#FBFDFF] px-4 py-4"
                >
                  <div>
                    <p className="text-sm font-bold text-[#10233B]">{table.label}</p>
                    <p className="mt-1 text-xs text-[#7A8796]">{table.name}</p>
                    {table.error && table.exists ? (
                      <p className="mt-1 text-xs text-[#D63045]">{table.error}</p>
                    ) : null}
                  </div>
                  {!table.exists ? (
                    <span className="rounded-full bg-[#FFF4F5] px-3 py-1 text-xs font-bold text-[#D63045]">
                      Missing
                    </span>
                  ) : (
                    <span className="text-sm font-black text-[#1E63B5]">
                      {(table.sampleCount ?? 0) > 0
                        ? `${table.sampleCount} мөр`
                        : 'хоосон'}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div
                className={`rounded-2xl border px-5 py-4 ${
                  health.schemaReady
                    ? 'border-[#D6E6FA] bg-[#F8FBFF]'
                    : 'border-[#FFD7DC] bg-[#FFF7F8]'
                }`}
              >
                <p className="text-sm font-bold text-[#10233B]">Schema төлөв</p>
                <p className="mt-2 text-sm leading-6 text-[#5B6877]">
                  {health.schemaReady
                    ? 'Бүх шаардлагатай хүснэгтүүд байна.'
                    : `Дутуу хүснэгтүүд: ${health.missingTables.join(', ')}`}
                </p>
              </div>

              <div className="rounded-2xl border border-[#E6EEF8] bg-[#F8FBFF] px-5 py-4">
                <p className="text-sm font-bold text-[#10233B]">Seed data</p>
                <p className="mt-2 text-sm leading-6 text-[#5B6877]">
                  {health.seedReady
                    ? 'CMS, эмч, үйлчилгээ, багц, diagnosis, doctor-service relations бүгд seed-ээр бүрдсэн байна.'
                    : 'Seed дутуу тул public flow эсвэл admin relationship хэсгүүд бүрэн ажиллахгүй байж болно.'}
                </p>
              </div>

              <div className="rounded-2xl border border-[#E6EEF8] bg-[#F8FBFF] px-5 py-4">
                <p className="text-sm font-bold text-[#10233B]">Admin account</p>
                <p className="mt-2 text-sm leading-6 text-[#5B6877]">
                  {health.checkedWithServiceRole
                    ? `Auth user: ${
                        health.adminAccount.authUserExists ? 'байгаа' : 'алга'
                      }, profile role: ${health.adminAccount.profileRole ?? 'profile үүсээгүй'}`
                    : 'Service role key тохируулаагүй тул admin auth/profile төлөвийг гүн шалгаж чадсангүй.'}
                </p>
              </div>

              {!health.schemaReady || !health.seedReady ? (
                <div className="rounded-2xl border border-[#FFD7DC] bg-[#FFF7F8] px-5 py-4">
                  <p className="text-sm font-bold text-[#B42335]">Засах дараалал</p>
                  <ol className="mt-2 space-y-1 text-sm leading-6 text-[#7A2430]">
                    <li>
                      1. Хамгийн амар зам нь `supabase/bootstrap.sql` файлыг бүтнээр нь
                      Supabase SQL Editor дээр ажиллуулах.
                    </li>
                    <li>
                      2. Хэрэв салгаж ажиллуулах бол `schema.sql`, `schema-v2.sql`,
                      `schema-v3.sql`, дараа нь `seed.sql`, `seed-v2.sql`, `seed-v3.sql`,
                      `seed-v4.sql`.
                    </li>
                    <li>
                      3. Хэрэв schema суусан ч relation data дутуу байвал `npm run db:backfill`
                      ажиллуулж live seed backfill хийж болно.
                    </li>
                    <li>4. Дараа нь `/setup` хуудсыг refresh хийж дахин шалгана.</li>
                  </ol>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl bg-[#1E63B5] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#154D8F]"
            >
              Нэвтрэх
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-[#D8E6F6] bg-white px-6 py-3 text-sm font-bold text-[#1E63B5] transition hover:border-[#1E63B5]"
            >
              Нүүр хуудас
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

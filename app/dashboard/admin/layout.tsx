import Link from 'next/link'
import { requireRole } from '@/lib/admin/auth'
import { checkDatabaseHealth } from '@/lib/supabase/database-health'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(['super_admin'])
  const health = await checkDatabaseHealth()

  if (!health.schemaReady) {
    return (
      <div className="min-h-[70vh] bg-[#F7FAFF] px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#FFD7DC] bg-white p-8 shadow-[0_20px_70px_rgba(17,37,68,0.08)]">
          <div className="rounded-2xl bg-[linear-gradient(135deg,#E8323F_0%,#C0272D_100%)] px-6 py-5 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100">
              Database Setup Required
            </p>
            <h1 className="mt-3 text-2xl font-black">Admin dashboard одоогоор ажиллахгүй байна</h1>
            <p className="mt-3 text-sm leading-7 text-red-50">
              Remote Supabase дээр app-ийн schema суусангүй. Тиймээс CRUD module-ууд raw
              хүснэгтүүдээ олж чадахгүй байна.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-[#FFE1E5] bg-[#FFF7F8] px-5 py-4">
            <p className="text-sm font-bold text-[#B42335]">Missing хүснэгтүүд</p>
            <p className="mt-2 text-sm leading-6 text-[#7A2430]">
              {health.missingTables.join(', ')}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/setup"
              className="inline-flex items-center justify-center rounded-2xl bg-[#1E63B5] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#154D8F]"
            >
              Setup статус харах
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
    )
  }

  return <>{children}</>
}

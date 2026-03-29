import { requireRole } from '@/lib/admin/auth'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(['super_admin'])

  return <>{children}</>
}

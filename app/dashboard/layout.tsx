import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import { requireDashboardViewer } from '@/lib/admin/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const viewer = await requireDashboardViewer()

  return (
    <div className="flex min-h-screen flex-col bg-[#F7FAFF] lg:flex-row">
      <DashboardSidebar
        role={viewer.role}
        user={{ full_name: viewer.full_name, email: viewer.email }}
      />
      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

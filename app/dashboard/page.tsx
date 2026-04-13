import { redirect } from 'next/navigation'
import { requireDashboardViewer } from '@/lib/admin/auth'

export default async function DashboardPage() {
  const viewer = await requireDashboardViewer()

  const destinations: Record<string, string> = {
    office_assistant: '/dashboard/assistant',
    doctor: '/dashboard/doctor',
    super_admin: '/dashboard/admin/crm',
  }

  redirect(destinations[viewer.role] ?? '/')
}

import DoctorDashboardClient from '@/components/dashboard/DoctorDashboardClient'
import { requireRole } from '@/lib/admin/auth'

export default async function DoctorDashboardPage() {
  const viewer = await requireRole(['doctor', 'super_admin'])

  return (
    <DoctorDashboardClient
      viewer={{
        id: viewer.id,
        full_name: viewer.full_name,
        email: viewer.email,
      }}
    />
  )
}

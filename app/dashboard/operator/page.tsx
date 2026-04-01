import CrmManager from '@/components/admin/CrmManager'
import { requireRole } from '@/lib/admin/auth'
import { getCrmStaffData } from '@/lib/admin/data'

export default async function OperatorDashboardPage() {
  await requireRole(['operator', 'super_admin'])
  const { leads, doctors } = await getCrmStaffData()

  return <CrmManager initialLeads={leads} doctors={doctors} viewerRole="operator" />
}

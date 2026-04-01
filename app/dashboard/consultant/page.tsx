import CrmManager from '@/components/admin/CrmManager'
import { requireRole } from '@/lib/admin/auth'
import { getOrganizationConsultantCrmData } from '@/lib/admin/data'

export default async function OrganizationConsultantDashboardPage() {
  await requireRole(['organization_consultant', 'super_admin'])
  const { leads, doctors } = await getOrganizationConsultantCrmData()

  return (
    <CrmManager
      initialLeads={leads}
      doctors={doctors}
      viewerRole="organization_consultant"
    />
  )
}

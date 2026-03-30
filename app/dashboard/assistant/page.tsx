import CrmManager from '@/components/admin/CrmManager'
import { getCrmStaffData } from '@/lib/admin/data'

export default async function AssistantDashboardPage() {
  const { leads, doctors } = await getCrmStaffData()

  return <CrmManager initialLeads={leads} doctors={doctors} viewerRole="office_assistant" />
}

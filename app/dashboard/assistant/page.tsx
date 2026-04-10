import CrmManager from '@/components/admin/CrmManager'
import { getCrmStaffData } from '@/lib/admin/data'

export default async function AssistantDashboardPage() {
  const { leads, doctors, appointments } = await getCrmStaffData()

  return (
    <CrmManager
      initialLeads={leads}
      appointments={appointments}
      doctors={doctors}
      viewerRole="office_assistant"
    />
  )
}

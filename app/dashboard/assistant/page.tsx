import CrmManager from '@/components/admin/CrmManager'
import { requireRole } from '@/lib/admin/auth'
import { getCrmStaffData } from '@/lib/admin/data'

export default async function AssistantDashboardPage() {
  await requireRole(['office_assistant', 'super_admin'])
  const { leads, doctors, appointments, calendarDays, services } = await getCrmStaffData()

  return (
    <CrmManager
      initialLeads={leads}
      appointments={appointments}
      calendarDays={calendarDays}
      doctors={doctors}
      services={services}
      viewerRole="office_assistant"
    />
  )
}

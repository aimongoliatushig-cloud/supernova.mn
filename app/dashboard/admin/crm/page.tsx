import CrmManager from '@/components/admin/CrmManager'
import { getCrmAdminData } from '@/lib/admin/data'

export default async function AdminCrmPage() {
  const { leads, doctors, appointments, calendarDays } = await getCrmAdminData()

  return (
    <CrmManager
      initialLeads={leads}
      appointments={appointments}
      calendarDays={calendarDays}
      doctors={doctors}
      viewerRole="super_admin"
    />
  )
}

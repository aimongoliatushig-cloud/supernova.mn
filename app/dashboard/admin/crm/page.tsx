import CrmManager from '@/components/admin/CrmManager'
import { getCrmAdminData } from '@/lib/admin/data'

export default async function AdminCrmPage() {
  const { leads, doctors, appointments, calendarDays, services } = await getCrmAdminData()

  return (
    <CrmManager
      initialLeads={leads}
      appointments={appointments}
      calendarDays={calendarDays}
      doctors={doctors}
      services={services}
      viewerRole="super_admin"
    />
  )
}

import CrmManager from '@/components/admin/CrmManager'
import { getCrmAdminData } from '@/lib/admin/data'

export default async function AdminCrmPage() {
  const { leads, doctors, appointments } = await getCrmAdminData()

  return (
    <CrmManager
      initialLeads={leads}
      appointments={appointments}
      doctors={doctors}
      viewerRole="super_admin"
    />
  )
}

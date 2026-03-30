import CrmManager from '@/components/admin/CrmManager'
import { getCrmAdminData } from '@/lib/admin/data'

export default async function AdminCrmPage() {
  const { leads, doctors } = await getCrmAdminData()

  return <CrmManager initialLeads={leads} doctors={doctors} viewerRole="super_admin" />
}

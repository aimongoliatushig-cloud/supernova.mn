import CrmManager from '@/components/admin/CrmManager'
import { getCrmAdminData } from '@/lib/admin/data'

export default async function AdminCrmPage() {
  const leads = await getCrmAdminData()

  return <CrmManager initialLeads={leads} />
}

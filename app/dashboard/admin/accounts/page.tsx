import StaffAccountsManager from '@/components/admin/StaffAccountsManager'
import { getStaffAccountsAdminData } from '@/lib/admin/data'

export default async function AdminAccountsPage() {
  const accounts = await getStaffAccountsAdminData()

  return <StaffAccountsManager initialAccounts={accounts} />
}

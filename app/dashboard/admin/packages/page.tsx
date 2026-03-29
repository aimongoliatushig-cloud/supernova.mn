import PackagesManager from '@/components/admin/PackagesManager'
import { getPackagesAdminData } from '@/lib/admin/data'

export default async function AdminPackagesPage() {
  const { packages, services } = await getPackagesAdminData()

  return <PackagesManager initialPackages={packages} services={services} />
}

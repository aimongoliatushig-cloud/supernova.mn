import ServicesManager from '@/components/admin/ServicesManager'
import { getServicesAdminData } from '@/lib/admin/data'

export default async function AdminServicesPage() {
  const { categories, services } = await getServicesAdminData()

  return <ServicesManager initialCategories={categories} initialServices={services} />
}

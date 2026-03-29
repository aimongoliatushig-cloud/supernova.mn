import DoctorsManager from '@/components/admin/DoctorsManager'
import { getDoctorsAdminData } from '@/lib/admin/data'

export default async function AdminDoctorsPage() {
  const { doctors, services } = await getDoctorsAdminData()

  return <DoctorsManager initialDoctors={doctors} services={services} />
}

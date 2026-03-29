import PromotionsManager from '@/components/admin/PromotionsManager'
import { getPromotionsAdminData } from '@/lib/admin/data'

export default async function AdminPromotionsPage() {
  const { promotions, services, packages } = await getPromotionsAdminData()

  return (
    <PromotionsManager
      initialPromotions={promotions}
      services={services}
      packages={packages}
    />
  )
}

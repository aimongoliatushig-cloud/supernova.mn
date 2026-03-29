import CmsManager from '@/components/admin/CmsManager'
import { getCmsAdminData } from '@/lib/admin/data'

export default async function AdminCmsPage() {
  const { entries, contact, socials, hours } = await getCmsAdminData()

  return (
    <CmsManager
      initialEntries={entries}
      initialContact={contact}
      initialSocials={socials}
      initialHours={hours}
    />
  )
}

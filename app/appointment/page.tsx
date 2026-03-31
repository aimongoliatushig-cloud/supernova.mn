import AppointmentFlow from '@/components/public/AppointmentFlow'
import { getBookingPageData } from '@/lib/public/data'

type AppointmentSearchParams = Promise<{
  lead?: string
  assessment?: string
  name?: string
  phone?: string
  email?: string
  categories?: string
}>

export default async function AppointmentPage({
  searchParams,
}: {
  searchParams: AppointmentSearchParams
}) {
  const data = await getBookingPageData()
  const params = await searchParams
  const initialSelectedCategories = (params.categories ?? '')
    .split('|')
    .map((category) => category.trim())
    .filter(Boolean)

  return (
    <AppointmentFlow
      doctors={data.doctors}
      services={data.services}
      privacyText={
        data.entries.privacy_notice ||
        'Таны мэдээлэл аюулгүй хадгалагдаж, зөвхөн эмнэлгийн үйлчилгээний зорилгоор ашиглагдана.'
      }
      initialLeadId={params.lead ?? null}
      initialAssessmentId={params.assessment ?? null}
      initialName={params.name ?? ''}
      initialPhone={params.phone ?? ''}
      initialEmail={params.email ?? ''}
      initialSelectedCategories={initialSelectedCategories}
    />
  )
}

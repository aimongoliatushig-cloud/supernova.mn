import ConsultationFlow from '@/components/public/ConsultationFlow'
import { getBookingPageData } from '@/lib/public/data'

type ConsultationSearchParams = Promise<{
  lead?: string
  assessment?: string
  name?: string
  phone?: string
  email?: string
}>

export default async function ConsultationPage({
  searchParams,
}: {
  searchParams: ConsultationSearchParams
}) {
  const data = await getBookingPageData()
  const params = await searchParams

  return (
    <ConsultationFlow
      privacyText={
        data.entries.privacy_notice ||
        'Таны мэдээлэл аюулгүй хадгалагдаж, зөвхөн эмнэлгийн үйлчилгээний зорилгоор ашиглагдана.'
      }
      initialLeadId={params.lead ?? null}
      initialAssessmentId={params.assessment ?? null}
      initialName={params.name ?? ''}
      initialPhone={params.phone ?? ''}
      initialEmail={params.email ?? ''}
    />
  )
}

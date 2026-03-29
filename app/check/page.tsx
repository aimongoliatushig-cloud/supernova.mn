import CheckFlow from '@/components/public/CheckFlow'
import { getDiagnosisFlowData } from '@/lib/public/data'

export default async function CheckPage() {
  const data = await getDiagnosisFlowData()

  return (
    <CheckFlow
      categories={data.categories}
      privacyText={
        data.entries.privacy_notice ||
        'Таны мэдээлэл аюулгүй хадгалагдаж, зөвхөн эмнэлгийн үйлчилгээний зорилгоор ашиглагдана.'
      }
    />
  )
}

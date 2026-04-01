import type { Metadata } from 'next'
import Footer from '@/components/layout/Footer'
import Navbar from '@/components/layout/Navbar'
import OrganizationConsultationSection from '@/components/public/OrganizationQuoteCalculator'
import { getLandingPageData } from '@/lib/public/data'

export const metadata: Metadata = {
  title: 'Байгууллагын үйлчилгээ | СУПЕРНОВА',
  description:
    'Байгууллагад зориулсан урьдчилан сэргийлэх үзлэг, on-site зохион байгуулалт, эмчийн тайлбарын үйлчилгээний танилцуулга болон зөвлөгөө авах хэсэг.',
}

export default async function OrganizationPage() {
  const data = await getLandingPageData()
  const phone = data.contact?.phone ?? '7000 0303'
  const privacyText =
    data.entries.privacy_notice ||
    'Таны мэдээлэл аюулгүй хадгалагдаж, зөвхөн эмнэлгийн үйлчилгээний зорилгоор ашиглагдана.'

  return (
    <>
      <Navbar phone={phone} />

      <main className="overflow-x-hidden">
        <OrganizationConsultationSection />
      </main>

      <Footer
        contact={data.contact}
        socials={data.socials}
        workingHours={data.workingHours}
        privacyText={privacyText}
      />
    </>
  )
}

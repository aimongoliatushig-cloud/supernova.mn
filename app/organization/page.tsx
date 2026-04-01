import type { Metadata } from 'next'
import Footer from '@/components/layout/Footer'
import Navbar from '@/components/layout/Navbar'
import OrganizationQuoteCalculator from '@/components/public/OrganizationQuoteCalculator'
import { getLandingPageData } from '@/lib/public/data'

export const metadata: Metadata = {
  title: 'Байгууллагын багц | СУПЕРНОВА',
  description:
    'Байгууллагын ажилтны тоо болон компанийн чиглэлд тохирсон шинжилгээний багц, урьдчилсан үнийн тооцоолол.',
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
        <OrganizationQuoteCalculator />
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

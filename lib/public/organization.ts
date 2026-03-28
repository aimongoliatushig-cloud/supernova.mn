export type OrganizationSectorId =
  | 'office'
  | 'finance'
  | 'retail'
  | 'education'
  | 'manufacturing'
  | 'construction'
  | 'logistics'

export interface OrganizationSector {
  id: OrganizationSectorId
  label: string
  description: string
  multiplier: number
}

export interface OrganizationPackage {
  id: string
  title: string
  headcountLabel: string
  priceLabel: string
  description: string
  bestFor: string
  highlights: string[]
}

export const organizationSectors: OrganizationSector[] = [
  {
    id: 'office',
    label: 'Оффис, IT, үйлчилгээний төв',
    description: 'Суурин ажлын байртай, бага эрсдэлтэй орчин.',
    multiplier: 1,
  },
  {
    id: 'finance',
    label: 'Санхүү, банк, даатгал',
    description: 'Нүд, зүрх, стрессийн үзүүлэлт нэмэлтээр чухалчилна.',
    multiplier: 1.04,
  },
  {
    id: 'retail',
    label: 'Ритэйл, зочлох үйлчилгээ',
    description: 'Ээлжийн хуваарь, олон хүнтэй харьцах ачаалалтай орчин.',
    multiplier: 1.07,
  },
  {
    id: 'education',
    label: 'Боловсрол, төрийн байгууллага',
    description: 'Дуу хоолой, ачаалал, улирлын давтамжийг тооцно.',
    multiplier: 1.03,
  },
  {
    id: 'manufacturing',
    label: 'Үйлдвэрлэл, хүнс, үйлдвэр',
    description: 'Физик ачаалал, тоосжилт, ажлын байрны эрсдэл өндөр.',
    multiplier: 1.14,
  },
  {
    id: 'construction',
    label: 'Барилга, дэд бүтэц',
    description: 'Хөдөлмөрийн аюулгүй байдал, үе мөч, уушгины хяналт чухал.',
    multiplier: 1.16,
  },
  {
    id: 'logistics',
    label: 'Тээвэр, ложистик, агуулах',
    description: 'Ээлж, хөдөлгөөн, зүрх судасны ачаалалтай орчин.',
    multiplier: 1.12,
  },
]

export const organizationPackages: OrganizationPackage[] = [
  {
    id: 'core',
    title: 'Суурь урьдчилан сэргийлэх',
    headcountLabel: '15-60 ажилтан',
    priceLabel: 'Нэг ажилтанд 165,000₮-с',
    description:
      'Оффис болон дунд эрсдэлтэй багуудад зориулсан анхан шатны багц. Дижитал тайлан, ангилсан зөвлөмжтэй.',
    bestFor: 'Оффис, IT, боловсрол, санхүүгийн байгууллага',
    highlights: [
      'Ерөнхий эмчийн үзлэг',
      'Суурь лабораторийн шинжилгээ',
      'Дижитал нэгдсэн тайлан',
    ],
  },
  {
    id: 'growth',
    title: 'Өсөлтийн багц',
    headcountLabel: '61-180 ажилтан',
    priceLabel: 'Нэг ажилтанд 149,000₮-с',
    description:
      'Хэд хэдэн баг, салбар нэгжтэй компаниудад тохирсон. Хэсэг тус бүрээр тайлан гаргаж, follow-up зөвлөмж өгнө.',
    bestFor: 'Өсөлтийн шатанд байгаа компани, сүлжээ үйлчилгээ',
    highlights: [
      'Баг тус бүрийн эрсдэлийн тайлан',
      'ЭКГ, хэвлийн эхо сонголттой',
      'Менежментийн дүгнэлт, зөвлөмж',
    ],
  },
  {
    id: 'industry',
    title: 'Үйлдвэрлэлийн иж бүрэн',
    headcountLabel: '180+ ажилтан эсвэл өндөр эрсдэлтэй орчин',
    priceLabel: 'Нэг ажилтанд 138,000₮-с',
    description:
      'Физик ачаалалтай болон талбай дээрх багуудад зориулсан уян төлөвлөлттэй багц. On-site урсгал, ахисан хяналт багтана.',
    bestFor: 'Үйлдвэрлэл, барилга, ложистик, олон салбартай компани',
    highlights: [
      'On-site зохион байгуулалтын урсгал',
      'Өндөр эрсдэлийн нэмэлт үзүүлэлт',
      'Удирдлагын товч дашбоард тайлан',
    ],
  },
]

function resolveBasePrice(headcount: number) {
  if (headcount >= 300) return 138000
  if (headcount >= 150) return 149000
  if (headcount >= 60) return 158000
  return 165000
}

function resolveRecommendedPackage(headcount: number, sectorId: OrganizationSectorId) {
  if (
    sectorId === 'manufacturing' ||
    sectorId === 'construction' ||
    sectorId === 'logistics' ||
    headcount >= 180
  ) {
    return organizationPackages[2]
  }

  if (headcount >= 61) {
    return organizationPackages[1]
  }

  return organizationPackages[0]
}

export function calculateOrganizationQuote(headcount: number, sectorId: OrganizationSectorId) {
  const normalizedHeadcount = Number.isFinite(headcount) ? Math.max(15, Math.round(headcount)) : 15
  const sector = organizationSectors.find((item) => item.id === sectorId) ?? organizationSectors[0]
  const perEmployeePrice =
    Math.round((resolveBasePrice(normalizedHeadcount) * sector.multiplier) / 1000) * 1000
  const totalPrice = perEmployeePrice * normalizedHeadcount
  const recommendedPackage = resolveRecommendedPackage(normalizedHeadcount, sector.id)
  const onsiteWindow =
    normalizedHeadcount >= 180 ? '2-4 өдөр' : normalizedHeadcount >= 60 ? '1-2 өдөр' : '1 өдөр'
  const reportWindow =
    normalizedHeadcount >= 180
      ? '72 цагийн дотор'
      : normalizedHeadcount >= 60
        ? '48 цагийн дотор'
        : '24 цагийн дотор'

  return {
    headcount: normalizedHeadcount,
    sector,
    perEmployeePrice,
    totalPrice,
    recommendedPackage,
    onsiteWindow,
    reportWindow,
  }
}

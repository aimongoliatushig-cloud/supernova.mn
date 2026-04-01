export type OrganizationSectorId =
  | 'office'
  | 'finance'
  | 'retail'
  | 'education'
  | 'manufacturing'
  | 'construction'
  | 'logistics'

export type OrganizationPackageId = 'core' | 'growth' | 'industry'

export interface OrganizationSector {
  id: OrganizationSectorId
  label: string
  description: string
  multiplier: number
}

export interface OrganizationPackage {
  id: OrganizationPackageId
  title: string
  headcountLabel: string
  priceLabel: string
  basePrice: number
  pricingMode: 'starting' | 'custom'
  description: string
  bestFor: string
  highlights: string[]
}

export interface OrganizationHeadcountOption {
  id: string
  label: string
  estimateHeadcount: number
  recommendedPackageId: OrganizationPackageId
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
    label: 'Тээвэр, логистик, агуулах',
    description: 'Ээлж, хөдөлгөөн, зүрх судасны ачаалалтай орчин.',
    multiplier: 1.12,
  },
]

export const organizationPackages: OrganizationPackage[] = [
  {
    id: 'core',
    title: 'Суурь урьдчилан сэргийлэх',
    headcountLabel: '15-60 ажилтан',
    priceLabel: '165,000₮-с',
    basePrice: 165000,
    pricingMode: 'starting',
    description:
      'Оффис болон дунд эрсдэлтэй багуудад зориулсан нэг мөр, ойлгомжтой эхний санал.',
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
    priceLabel: '149,000₮-с',
    basePrice: 149000,
    pricingMode: 'starting',
    description:
      'Олон баг, салбар нэгжтэй байгууллагад зориулсан илүү уян, менежментийн түвшний санал.',
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
    priceLabel: 'Захиалгат үнэ',
    basePrice: 138000,
    pricingMode: 'custom',
    description:
      'Физик ачаалалтай болон талбай дээрх багуудад зориулсан on-site зохион байгуулалттай багц.',
    bestFor: 'Үйлдвэрлэл, барилга, логистик, олон салбартай компани',
    highlights: [
      'On-site зохион байгуулалтын урсгал',
      'Өндөр эрсдэлийн нэмэлт үзүүлэлт',
      'Удирдлагын товч дашбоард тайлан',
    ],
  },
]

export const organizationHeadcountOptions: OrganizationHeadcountOption[] = [
  {
    id: '15-30',
    label: '15-30',
    estimateHeadcount: 20,
    recommendedPackageId: 'core',
  },
  {
    id: '31-60',
    label: '31-60',
    estimateHeadcount: 45,
    recommendedPackageId: 'core',
  },
  {
    id: '61-120',
    label: '61-120',
    estimateHeadcount: 90,
    recommendedPackageId: 'growth',
  },
  {
    id: '121-250',
    label: '121-250',
    estimateHeadcount: 180,
    recommendedPackageId: 'industry',
  },
  {
    id: '250+',
    label: '250+',
    estimateHeadcount: 300,
    recommendedPackageId: 'industry',
  },
]

export function getOrganizationPackageById(packageId: OrganizationPackageId) {
  return organizationPackages.find((item) => item.id === packageId) ?? organizationPackages[0]
}

function resolveRecommendedPackage(headcount: number, sectorId: OrganizationSectorId) {
  if (
    sectorId === 'manufacturing' ||
    sectorId === 'construction' ||
    sectorId === 'logistics' ||
    headcount >= 180
  ) {
    return getOrganizationPackageById('industry')
  }

  if (headcount >= 61) {
    return getOrganizationPackageById('growth')
  }

  return getOrganizationPackageById('core')
}

export function calculateOrganizationQuote(
  headcount: number,
  sectorId: OrganizationSectorId,
  packageId?: OrganizationPackageId
) {
  const normalizedHeadcount = Number.isFinite(headcount) ? Math.max(15, Math.round(headcount)) : 15
  const sector = organizationSectors.find((item) => item.id === sectorId) ?? organizationSectors[0]
  const recommendedPackage = resolveRecommendedPackage(normalizedHeadcount, sector.id)
  const selectedPackage = packageId ? getOrganizationPackageById(packageId) : recommendedPackage
  const perEmployeePrice =
    Math.round((selectedPackage.basePrice * sector.multiplier) / 1000) * 1000
  const totalPrice = perEmployeePrice * normalizedHeadcount
  const onsiteWindow =
    normalizedHeadcount >= 180
      ? '2-4 өдөр'
      : normalizedHeadcount >= 60
        ? '1-2 өдөр'
        : '1 өдөр'
  const reportWindow =
    normalizedHeadcount >= 180
      ? '72 цагийн дотор'
      : normalizedHeadcount >= 60
        ? '48 цагийн дотор'
        : '24 цагийн дотор'

  return {
    headcount: normalizedHeadcount,
    sector,
    selectedPackage,
    perEmployeePrice,
    totalPrice,
    recommendedPackage,
    onsiteWindow,
    reportWindow,
  }
}

import Link from 'next/link'
import {
  AdminMessage,
  AdminPageHeader,
  AdminSectionCard,
  AdminStatCard,
} from '@/components/admin/AdminPrimitives'
import { getAdminOverviewData } from '@/lib/admin/data'
import { checkDatabaseHealth } from '@/lib/supabase/database-health'

const modules = [
  {
    href: '/dashboard/admin/cms',
    title: 'Landing Page CMS',
    description:
      'Hero, танилцуулга, технологи, нууцлал, хаяг, ажиллах цаг, сошиал холбоосыг удирдана.',
  },
  {
    href: '/dashboard/admin/doctors',
    title: 'Эмч нар',
    description:
      'Профайл, мэргэшил, захиалгад харагдах эсэх болон үйлчилгээтэй хамаарлыг удирдана.',
  },
  {
    href: '/dashboard/admin/services',
    title: 'Үйлчилгээ ба ангилал',
    description:
      'Ангилал, үнэ, бэлтгэл заавар, landing/result/book урсгалд харагдах төлөвийг удирдана.',
  },
  {
    href: '/dashboard/admin/packages',
    title: 'Багцууд',
    description:
      'Олон үйлчилгээг нэг багц болгон холбож, landing болон result урсгалын санал болгох блокуудыг удирдана.',
  },
  {
    href: '/dashboard/admin/promotions',
    title: 'Урамшуулал',
    description:
      'Үйлчилгээ эсвэл багцтай холбосон badge, хөнгөлөлт, үнэгүй бэлэг, хугацааг удирдана.',
  },
  {
    href: '/dashboard/admin/diagnosis',
    title: 'Оношилгооны систем',
    description:
      'Шинж тэмдгийн ангилал, асуулт, хариултын сонголт, эрсдэлийн онооны логикийг удирдана.',
  },
  {
    href: '/dashboard/admin/crm',
    title: 'CRM хяналт',
    description:
      'Лид, эрсдэлийн түвшин, цаг захиалга, зөвлөгөөний төлөв, blacklist ба тэмдэглэлийг хянаж шинэчилнэ.',
  },
]

export default async function AdminOverviewPage() {
  const [stats, health] = await Promise.all([getAdminOverviewData(), checkDatabaseHealth()])

  return (
    <div className="space-y-8 p-6 md:p-8">
      <AdminPageHeader
        eyebrow="Super Admin"
        title="Админ удирдлагын төв"
        description="Нийтийн сайт, оношилгооны урсгал, санал болгох үйлчилгээ болон CRM-ийн суурь өгөгдлийг нэг цэгээс удирдах төв самбар."
      />

      {!health.schemaReady ? (
        <AdminMessage tone="error">
          Remote database schema дутуу байна. Missing хүснэгтүүд: {health.missingTables.join(', ')}.
          `/setup` хуудас дээр SQL ажиллуулах дарааллыг шалгана уу.
        </AdminMessage>
      ) : null}

      {health.schemaReady && !health.seedReady ? (
        <AdminMessage tone="info">
          Schema суусан боловч seed data дутуу байна. CMS, эмч, үйлчилгээ, оношилгооны
          асуултуудыг бөглөсний дараа public тал хэвийн data авч эхэлнэ.
        </AdminMessage>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="CMS талбар" value={stats.cms_entries} />
        <AdminStatCard label="Эмчийн бүртгэл" value={stats.doctors} tone="green" />
        <AdminStatCard
          label="Үйлчилгээ ба багц"
          value={stats.services + stats.packages}
          tone="yellow"
        />
        <AdminStatCard label="CRM лид" value={stats.leads} tone="red" />
      </div>

      <AdminSectionCard
        title="Админ модуль бүрийн үүрэг"
        description="Эдгээр модуль бүр нь нийтийн сайт, оношилгооны flow болон CRM-ийн өгөгдлийг хөдөлгөдөг."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#B8D5FB] hover:shadow-md"
            >
              <div className="space-y-2">
                <h2 className="text-base font-bold text-[#1F2937]">{module.title}</h2>
                <p className="text-sm leading-6 text-[#6B7280]">{module.description}</p>
                <span className="inline-flex items-center text-sm font-semibold text-[#1E63B5]">
                  Модуль нээх
                  <span className="ml-1" aria-hidden="true">
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </AdminSectionCard>
    </div>
  )
}

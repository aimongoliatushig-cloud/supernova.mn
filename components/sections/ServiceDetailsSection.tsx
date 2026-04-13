import Link from 'next/link'
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  Microscope,
  Phone,
  Shield,
  Stethoscope,
} from 'lucide-react'

type ServiceGroup = {
  title: string
  items: Array<{
    name: string
    price: number
    detail?: string
  }>
}

const serviceGroups: ServiceGroup[] = [
  {
    title: 'Дүрс оношилгоо',
    items: [
      { name: 'Уушиг, цээжний рентген', price: 40000 },
      { name: 'Хэвлийн эхо (5 цул эрхтэн)', price: 50000 },
      { name: 'Бамбайн эхо', price: 50000 },
      { name: 'Түрүү булчирхайн эхо', price: 50000 },
      { name: 'Өвдөгний эхо', price: 45000 },
      { name: 'Яс сийрэгжилтийн шинжилгээ', price: 45000 },
    ],
  },
  {
    title: 'Зүрх судас',
    items: [
      { name: 'Зүрхний эхо', price: 90000 },
      { name: '24 цагийн холтер', price: 98000 },
      { name: 'Зүрхний 1 минутын цахилгаан бичлэг', price: 35000 },
    ],
  },
  {
    title: 'Дуран ба тест',
    items: [
      { name: 'Ходоодны дуран', price: 98000, detail: '30-40 минут' },
      { name: 'Хеликобактерийн амьсгалын тест', price: 75000, detail: '10-15 минут' },
    ],
  },
  {
    title: 'Бусад',
    items: [
      { name: 'Умайн хүзүүний AI дуран', price: 209000, detail: 'Эмч Бадралмаа' },
      { name: 'Багажийн шинжилгээний хариу уншуулах', price: 30000 },
    ],
  },
]

const quickStats = [
  {
    label: 'Ходоодны дуран',
    value: '98,000₮',
    detail: '30-40 минут үргэлжилнэ',
  },
  {
    label: 'Хеликобактерийн амьсгалын тест',
    value: '75,000₮',
    detail: 'Хариу 10 минутын дотор гарна',
  },
  {
    label: 'Цусны шинжилгээ',
    value: '08:40-13:30',
    detail: 'Бямба гарагт 09:00-11:30',
  },
]

const preparationCards = [
  {
    title: 'Ходоодны дурангийн бэлтгэл',
    items: [
      'Орой 18:00 цагаас хойш хоол идэхгүй.',
      'Орой 22:00 цагаас хойш ус, шингэн зүйл уухгүй.',
      'Шинжилгээний өмнө тамхи татахгүй.',
      'Өглөө шүд, амаа угаахгүй, усаар зайлахгүй.',
    ],
  },
  {
    title: 'Хеликобактерийн тестийн бэлтгэл',
    items: [
      'Ходоодны дурантай ижил бэлтгэл мөрдөнө.',
      'Шинжилгээ 10-15 минут үргэлжилнэ.',
      'Хариу 10 минутын дотор бэлэн болно.',
      'Цус, өтгөний шинжилгээнээс илүү мэдрэг амьсгалын тест.',
    ],
  },
]

const scheduleItems = [
  'Цусны шинжилгээ Даваа-Баасан 08:40-13:30 хүртэл авна.',
  'Бямба гарагт цусны шинжилгээ 09:00-11:30 хүртэл авна.',
  'Цусны шинжилгээний хариу 14:00 цагаас хойш гарна.',
  'И-мэйл хаяг үлдээвэл хариуг мэйлээр илгээж болно.',
  'Бямба гарагт ходоодны дуран 09:00-14:00 цагийн хооронд хийнэ.',
]

const notes = [
  'Манайх зөвхөн ходоод болон 12 хуруу гэдэсний эхэн хэсгийг дурандана. Бүдүүн, нарийн гэдэсний дуран хийхгүй.',
  'Ходоодны дурангийн аппарат 2.4 голчтой тул харьцангуй эвтэйхэн, айдас төрдөг хүмүүст эмч урьдчилан тайлбарлаж бэлтгэнэ.',
  'Амнаас эвгүй үнэр гарах, хоол боловсруулалт муудах үед хеликобактерийн амьсгалын тест тохиромжтой.',
  'Зүрхний титэм судасны томограф хийгдэхгүй. Бриллиант эсвэл Улсын хоёрдугаар төв эмнэлэгт хандана.',
  'MRI үйлчилгээ байхгүй.',
]

function formatPrice(price: number) {
  return `${new Intl.NumberFormat('mn-MN').format(price)}₮`
}

interface ServiceDetailsSectionProps {
  phone?: string | null
}

export default function ServiceDetailsSection({
  phone = '70170303',
}: ServiceDetailsSectionProps) {
  const resolvedPhone = phone ?? '70170303'
  const telHref = resolvedPhone.replaceAll(' ', '').replaceAll('-', '')

  return (
    <div className="mt-10 rounded-[2rem] border border-[#D6E6FA] bg-white p-6 shadow-[0_24px_70px_rgba(16,35,59,0.08)] md:p-8">
      <div className="flex flex-col gap-5 border-b border-[#E7EEF8] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#EAF3FF] px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
            <Microscope size={13} />
            Түгээмэл шинжилгээний мэдээлэл
          </p>
          <h3 className="mt-5 text-2xl font-black tracking-tight text-[#10233B] md:text-3xl">
            Үнэ, үргэлжлэх хугацаа, бэлтгэлийн зааврыг нэг дороос харна
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5B6877] md:text-base">
            Ходоодны дуран, хеликобактерийн амьсгалын тест, зүрх судас, эхо болон
            дүрс оношилгооны үнэ, цагийн хуваарь, бэлтгэлийн шаардлагыг орууллаа.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={`tel:${telHref}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#BCD4F4] px-5 py-3 text-sm font-bold text-[#1E63B5] transition hover:bg-[#EAF3FF]"
          >
            <Phone size={16} />
            {resolvedPhone}
          </a>
          <Link
            href="/appointment"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1E63B5] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#154D8F]"
          >
            <Calendar size={16} />
            Цаг захиалах
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {quickStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[1.5rem] border border-[#E5EDF7] bg-[linear-gradient(180deg,#FBFDFF_0%,#F4F9FF_100%)] p-5"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E63B5]">
              {stat.label}
            </p>
            <p className="mt-3 text-2xl font-black text-[#10233B]">{stat.value}</p>
            <p className="mt-2 text-sm leading-6 text-[#5B6877]">{stat.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {serviceGroups.map((group) => (
            <article
              key={group.title}
              className="rounded-[1.75rem] border border-[#E5EDF7] bg-[#FBFDFF] p-5"
            >
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-[#EAF3FF] p-2 text-[#1E63B5]">
                  <Stethoscope size={15} />
                </div>
                <h4 className="text-lg font-black text-[#10233B]">{group.title}</h4>
              </div>

              <div className="mt-5 space-y-3">
                {group.items.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-2xl border border-[#E7EEF8] bg-white px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold leading-6 text-[#10233B]">{item.name}</p>
                        {item.detail ? (
                          <p className="mt-1 text-xs font-medium text-[#6B7A89]">{item.detail}</p>
                        ) : null}
                      </div>
                      <p className="shrink-0 text-sm font-black text-[#1E63B5]">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="space-y-4">
          {preparationCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.75rem] border border-[#E5EDF7] bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-[#FFF1F2] p-2 text-[#E8323F]">
                  <CheckCircle2 size={15} />
                </div>
                <h4 className="text-lg font-black text-[#10233B]">{card.title}</h4>
              </div>

              <div className="mt-4 space-y-3">
                {card.items.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="mt-1 shrink-0 text-[#1E63B5]" />
                    <p className="text-sm leading-7 text-[#5B6877]">{item}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}

          <article className="rounded-[1.75rem] border border-[#D7E5F6] bg-[#0F2947] p-5 text-white shadow-[0_20px_55px_rgba(15,41,71,0.18)]">
            <div className="flex items-center gap-2">
              <Clock3 size={18} className="text-[#78B3F6]" />
              <h4 className="text-lg font-black">Цагийн хуваарь ба хариу</h4>
            </div>

            <div className="mt-4 space-y-3">
              {scheduleItems.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                  <p className="text-sm leading-7 text-blue-50">{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-[#E5EDF7] bg-[#FBFDFF] p-5">
            <div className="flex items-center gap-2">
              <Shield size={17} className="text-[#1E63B5]" />
              <h4 className="text-lg font-black text-[#10233B]">Нэмэлт мэдээлэл</h4>
            </div>

            <div className="mt-4 space-y-3">
              {notes.map((item) => (
                <div key={item} className="rounded-2xl border border-[#E7EEF8] bg-white px-4 py-3">
                  <p className="text-sm leading-7 text-[#5B6877]">{item}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}

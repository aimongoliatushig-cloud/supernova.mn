import Image from 'next/image'
import Link from 'next/link'
import { Clock3, Mail, MapPin, Phone, Shield } from 'lucide-react'
import type {
  PublicContactSettings,
  PublicSocialLink,
  PublicWorkingHours,
} from '@/lib/public/types'

interface FooterProps {
  contact: PublicContactSettings | null
  socials: PublicSocialLink[]
  workingHours: PublicWorkingHours[]
  privacyText: string
}

const socialLabels: Record<string, string> = {
  facebook: 'FB',
  instagram: 'IG',
  youtube: 'YT',
  tiktok: 'TT',
}

const fallbackHours = [
  {
    id: 'fallback-weekday',
    day_label: 'Даваа - Баасан',
    open_time: '08:30',
    close_time: '18:00',
    sort_order: 1,
  },
  {
    id: 'fallback-saturday',
    day_label: 'Бямба',
    open_time: '09:00',
    close_time: '15:00',
    sort_order: 2,
  },
]

export default function Footer({
  contact,
  socials,
  workingHours,
  privacyText,
}: FooterProps) {
  const hours = workingHours.length > 0 ? workingHours : fallbackHours
  const phone = contact?.phone ?? '1330-033'
  const email = contact?.email ?? 'info@supernova.mn'
  const address = contact?.address ?? 'Улаанбаатар хот, байршлын мэдээллийг админ дээрээс шинэчилнэ.'

  return (
    <footer id="contact" className="relative overflow-hidden bg-[#0D2542] text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
        <div className="grid gap-8 rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_24px_70px_rgba(5,14,28,0.25)] backdrop-blur md:grid-cols-[1.1fr_0.9fr_0.9fr] md:p-8">
          <div>
            <Link href="/" className="inline-flex items-center">
              <span className="relative block h-14 w-40">
                <Image
                  src="/logo.png"
                  alt="СУПЕРНОВА эмнэлэг"
                  fill
                  sizes="160px"
                  className="object-contain brightness-0 invert"
                />
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300">
              Эрүүл мэндийн эрсдэлийг эрт илрүүлэх, оношилгооны урсгалыг ойлгомжтой болгох,
              цаг захиалга болон зөвлөгөөг нэг цэгээс удирдах дижитал үйлчилгээ.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {socials.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/8 text-xs font-bold text-white transition hover:border-[#6CAAF2] hover:bg-[#1E63B5]"
                >
                  {socialLabels[social.platform] ?? social.platform.slice(0, 2).toUpperCase()}
                </a>
              ))}
              <Link
                href="/admin"
                className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-xs font-bold tracking-[0.14em] text-slate-200 transition hover:border-[#6CAAF2] hover:text-white"
              >
                Ажилтны нэвтрэх
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-slate-300">
              Холбоо барих
            </h3>
            <div className="mt-5 space-y-3">
              <a
                href={`tel:${phone.replaceAll('-', '')}`}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-100 transition hover:border-[#6CAAF2]"
              >
                <Phone size={16} className="mt-0.5 shrink-0 text-[#78B3F6]" />
                <span>{phone}</span>
              </a>
              <a
                href={`mailto:${email}`}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-100 transition hover:border-[#6CAAF2]"
              >
                <Mail size={16} className="mt-0.5 shrink-0 text-[#78B3F6]" />
                <span>{email}</span>
              </a>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-100">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[#78B3F6]" />
                <span>{address}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-slate-300">
              Ажлын цаг
            </h3>
            <div className="mt-5 space-y-3">
              {hours.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-100"
                >
                  <Clock3 size={16} className="mt-0.5 shrink-0 text-[#78B3F6]" />
                  <span>
                    {item.day_label}: {item.open_time} - {item.close_time}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/check"
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[#E8323F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#c0272d]"
            >
              Эрсдэлийн шалгалт эхлэх
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-2 text-xs leading-6 text-slate-400">
            <Shield size={14} className="mt-1 shrink-0 text-[#78B3F6]" />
            <span>{privacyText}</span>
          </div>
          <p className="text-xs text-slate-500">
            © 2026 СУПЕРНОВА эмнэлэг. Бүх эрх хуулиар хамгаалагдсан.
          </p>
        </div>
      </div>
    </footer>
  )
}

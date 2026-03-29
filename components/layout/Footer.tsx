import { Phone, MapPin, Clock, Mail, Shield } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
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

export default function Footer({
  contact,
  socials,
  workingHours,
  privacyText,
}: FooterProps) {
  return (
    <footer className="bg-[#0F2947] text-white" id="contact">
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

          {/* Brand */}
          <div>
            <div className="mb-4">
              <Image
                src="/logo.png"
                alt="Супернова эмнэлэг"
                width={130}
                height={52}
                className="h-12 w-auto object-contain brightness-0 invert"
              />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              Японы стандартын дагуу иж бүрэн эрүүл мэндийн шинжилгээ хийдэг
              орчин үеийн оношлогооны эмнэлэг.
            </p>
            <div className="flex gap-3">
              {socials.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full bg-slate-700 hover:bg-[#1E63B5] flex items-center justify-center text-xs font-bold transition-colors"
                >
                  {socialLabels[social.platform] ?? social.platform.slice(0, 2).toUpperCase()}
                </a>
              ))}
            </div>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              Холбоо барих
            </h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <Phone size={15} className="mt-0.5 text-[#1E63B5] shrink-0" />
                <a
                  href={`tel:${(contact?.phone ?? '1330-033').replaceAll('-', '')}`}
                  className="hover:text-white transition-colors"
                >
                  {contact?.phone ?? '1330-033'}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail size={15} className="mt-0.5 text-[#1E63B5] shrink-0" />
                <a
                  href={`mailto:${contact?.email ?? 'info@supernova.mn'}`}
                  className="hover:text-white transition-colors"
                >
                  {contact?.email ?? 'info@supernova.mn'}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="mt-0.5 text-[#1E63B5] shrink-0" />
                <span>{contact?.address ?? 'Улаанбаатар хот'}</span>
              </li>
            </ul>
          </div>

          {/* Working hours */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              Ажлын цаг
            </h4>
            <ul className="space-y-2 text-sm text-slate-300">
              {workingHours.map((hours) => (
                <li key={hours.id} className="flex items-center gap-2.5">
                  <Clock size={14} className="text-[#1E63B5] shrink-0" />
                  <span>
                    {hours.day_label}: {hours.open_time} - {hours.close_time}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Link
                href="/check"
                className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-[#E8323F] hover:bg-[#c0272d] text-white font-bold text-sm transition-colors"
              >
                Эрүүл мэндийн шинжилгээ эхлэх →
              </Link>
            </div>
          </div>
        </div>

        {/* Privacy notice */}
        <div className="border-t border-slate-700 pt-6 flex flex-col md:flex-row items-start md:items-center gap-3 justify-between">
          <div className="flex items-start gap-2 text-xs text-slate-500">
            <Shield size={14} className="shrink-0 mt-0.5 text-[#1E63B5]" />
            <span>{privacyText}</span>
          </div>
          <p className="text-xs text-slate-600 shrink-0">
            © 2026 Супернова эмнэлэг. Бүх эрх хуулиар хамгаалагдсан.
          </p>
        </div>
      </div>
    </footer>
  )
}

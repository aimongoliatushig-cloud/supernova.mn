'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Phone, Calendar } from 'lucide-react'

const navLinks = [
  { label: 'Тухай',        href: '/#about' },
  { label: 'Эмч нар',      href: '/#doctors' },
  { label: 'Үйлчилгээ',    href: '/#services' },
  { label: 'Технологи',    href: '/#technology' },
  { label: 'Холбоо барих', href: '/#contact' },
]

interface NavbarProps {
  phone?: string | null
}

export default function Navbar({ phone = '1330-033' }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const resolvedPhone = phone ?? '1330-033'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/98 backdrop-blur-md shadow-sm border-b border-[#E5E7EB]'
        : 'bg-white border-b border-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-[72px]">

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/logo.png"
              alt="Супернова эмнэлэг"
              width={160}
              height={56}
              className="h-14 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="relative px-3 py-2 text-sm text-[#4B5563] hover:text-[#1E63B5] font-medium transition-colors rounded-lg hover:bg-[#EAF3FF] group"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* CTA area */}
          <div className="hidden md:flex items-center gap-2">
            <a
              href={`tel:${resolvedPhone.replaceAll('-', '')}`}
              className="flex items-center gap-1.5 text-sm text-[#1E63B5] font-semibold px-3 py-2 rounded-lg hover:bg-[#EAF3FF] transition-colors"
            >
              <Phone size={14} />
              {resolvedPhone}
            </a>
            <Link
              href="/appointment"
              className="flex items-center gap-1.5 text-sm text-[#1E63B5] font-semibold border border-[#1E63B5] px-4 py-2 rounded-xl hover:bg-[#EAF3FF] transition-colors"
            >
              <Calendar size={14} />
              Цаг захиалах
            </Link>
            <Link
              href="/check"
              className="flex items-center gap-1.5 bg-[#E8323F] hover:bg-[#c0272d] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-md shadow-[#E8323F]/20"
            >
              Шинжилгээ эхлэх
            </Link>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-[#1F2937] hover:text-[#1E63B5] transition-colors rounded-lg hover:bg-[#EAF3FF]"
            aria-label="цэс"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[#E5E7EB] bg-white px-4 py-3 space-y-0.5 shadow-lg">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center py-3 px-2 text-sm font-medium text-[#1F2937] hover:text-[#1E63B5] hover:bg-[#EAF3FF] rounded-lg transition-colors"
            >
              {l.label}
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2 border-t border-[#F3F4F6] mt-2">
            <a
              href={`tel:${resolvedPhone.replaceAll('-', '')}`}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#1E63B5] text-[#1E63B5] font-semibold text-sm hover:bg-[#EAF3FF] transition-colors"
            >
              <Phone size={16} /> {resolvedPhone} дугаарт залгах
            </a>
            <Link
              href="/appointment"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#1E63B5] bg-[#EAF3FF] text-[#1E63B5] font-semibold text-sm"
            >
              <Calendar size={16} /> Цаг захиалах
            </Link>
            <Link
              href="/check"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center py-3 rounded-xl bg-[#E8323F] text-white font-bold text-sm shadow-md shadow-[#E8323F]/20"
            >
              Шинжилгээ эхлэх
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

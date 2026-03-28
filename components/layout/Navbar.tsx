'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, LogIn, Menu, Phone, X } from 'lucide-react'

const navLinks = [
  { label: 'Тухай', href: '/#about' },
  { label: 'Эмч нар', href: '/#doctors' },
  { label: 'Үйлчилгээ', href: '/#services' },
  { label: 'Байгууллага', href: '/organization' },
  { label: 'Технологи', href: '/#technology' },
  { label: 'Холбоо барих', href: '/#contact' },
]

interface NavbarProps {
  phone?: string | null
}

export default function Navbar({ phone = '7000 0303' }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const resolvedPhone = phone ?? '7000 0303'

  useEffect(() => {
    setMounted(true)

    const onScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    onScroll()
    window.addEventListener('scroll', onScroll)

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const headerClassName = mounted && scrolled
    ? 'sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/98 shadow-sm backdrop-blur-md transition-all duration-300'
    : 'sticky top-0 z-50 border-b border-transparent bg-white transition-all duration-300'

  return (
    <header className={headerClassName}>
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-[72px] items-center justify-between md:h-[76px]">
          <Link href="/" className="flex shrink-0 items-center">
            <span className="relative block h-16 w-44 overflow-visible md:h-[4.5rem] md:w-52">
              <Image
                src="/logo.png"
                alt="СУПЕРНОВА эмнэлэг"
                fill
                sizes="(max-width: 768px) 176px, 208px"
                className="object-contain object-left scale-[1.55] origin-left md:scale-[1.7]"
                priority
              />
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#4B5563] transition-colors hover:bg-[#EAF3FF] hover:text-[#1E63B5]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-xl border border-[#D8E6F6] bg-[#F8FBFF] px-4 py-2 text-sm font-bold text-[#10233B] transition hover:border-[#1E63B5] hover:text-[#1E63B5]"
            >
              <LogIn size={14} />
              Нэвтрэх
            </Link>
            <a
              href={`tel:${resolvedPhone.replaceAll('-', '')}`}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#1E63B5] transition-colors hover:bg-[#EAF3FF]"
            >
              <Phone size={14} />
              {resolvedPhone}
            </a>
            <Link
              href="/appointment"
              className="flex items-center gap-1.5 rounded-xl border border-[#1E63B5] px-4 py-2 text-sm font-semibold text-[#1E63B5] transition-colors hover:bg-[#EAF3FF]"
            >
              <Calendar size={14} />
              Цаг захиалах
            </Link>
            <Link
              href="/check"
              className="flex items-center gap-1.5 rounded-xl bg-[#E8323F] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#E8323F]/20 transition-all hover:bg-[#c0272d] active:scale-95"
            >
              Шинжилгээ эхлэх
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="rounded-lg p-2 text-[#1F2937] transition-colors hover:bg-[#EAF3FF] hover:text-[#1E63B5] md:hidden"
            aria-label="Цэс"
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[#E5E7EB] bg-white px-4 py-3 shadow-lg md:hidden">
          <div className="space-y-0.5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center rounded-lg px-2 py-3 text-sm font-medium text-[#1F2937] transition-colors hover:bg-[#EAF3FF] hover:text-[#1E63B5]"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="mt-2 flex flex-col gap-2 border-t border-[#F3F4F6] pt-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#D8E6F6] bg-[#F8FBFF] py-3 text-sm font-bold text-[#10233B]"
            >
              <LogIn size={16} />
              Нэвтрэх
            </Link>
            <a
              href={`tel:${resolvedPhone.replaceAll('-', '')}`}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#1E63B5] py-3 text-sm font-semibold text-[#1E63B5] transition-colors hover:bg-[#EAF3FF]"
            >
              <Phone size={16} />
              {resolvedPhone} дугаарт залгах
            </a>
            <Link
              href="/appointment"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#1E63B5] bg-[#EAF3FF] py-3 text-sm font-semibold text-[#1E63B5]"
            >
              <Calendar size={16} />
              Цаг захиалах
            </Link>
            <Link
              href="/check"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center rounded-xl bg-[#E8323F] py-3 text-sm font-bold text-white shadow-md shadow-[#E8323F]/20"
            >
              Шинжилгээ эхлэх
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

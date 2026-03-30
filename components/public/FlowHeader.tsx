'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface FlowHeaderProps {
  title: string
  backHref?: string
  backLabel?: string
  onBack?: () => void
  rightSlot?: React.ReactNode
  maxWidthClassName?: string
  children?: React.ReactNode
}

export default function FlowHeader({
  title,
  backHref,
  backLabel = 'Буцах',
  onBack,
  rightSlot,
  maxWidthClassName = 'max-w-4xl',
  children,
}: FlowHeaderProps) {
  const backControl = onBack ? (
    <button
      type="button"
      onClick={onBack}
      className="flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] transition hover:text-[#1E63B5]"
    >
      <ArrowLeft size={18} />
      <span className="hidden sm:inline">{backLabel}</span>
    </button>
  ) : backHref ? (
    <Link
      href={backHref}
      className="flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] transition hover:text-[#1E63B5]"
    >
      <ArrowLeft size={18} />
      <span className="hidden sm:inline">{backLabel}</span>
    </Link>
  ) : (
    <div className="w-8 sm:w-20" />
  )

  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
      <div
        className={`mx-auto grid min-h-[82px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2 ${maxWidthClassName}`}
      >
        <div className="justify-self-start">{backControl}</div>

        <div className="flex flex-col items-center justify-center">
          <span className="relative block h-8 w-24 overflow-visible">
            <Image
              src="/logo.png"
              alt="СУПЕРНОВА эмнэлэг"
              fill
              sizes="96px"
              className="object-contain object-center scale-[1.4] origin-center"
              priority
            />
          </span>
          <span className="mt-1 text-center text-sm font-bold leading-tight text-[#1F2937]">
            {title}
          </span>
        </div>

        <div className="min-w-8 justify-self-end text-right text-xs font-semibold text-[#6B7280]">
          {rightSlot ?? <span className="inline-block w-8 sm:w-20" />}
        </div>
      </div>

      {children ? <div className={`mx-auto ${maxWidthClassName}`}>{children}</div> : null}
    </header>
  )
}

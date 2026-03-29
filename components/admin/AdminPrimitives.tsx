import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#E5E7EB] pb-6 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1E63B5]">
          {eyebrow}
        </p>
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-[#1F2937] md:text-3xl">{title}</h1>
          <p className="max-w-3xl text-sm text-[#6B7280] md:text-base">{description}</p>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function AdminStatCard({
  label,
  value,
  tone = 'blue',
}: {
  label: string
  value: ReactNode
  tone?: 'blue' | 'red' | 'green' | 'yellow'
}) {
  const tones = {
    blue: 'border-[#D6E6FA] bg-[#F7FAFF] text-[#1E63B5]',
    red: 'border-[#F9D2D6] bg-[#FFF7F8] text-[#F23645]',
    green: 'border-[#CDEDD8] bg-[#F5FCF8] text-[#16A34A]',
    yellow: 'border-[#FDE9B6] bg-[#FFFBF1] text-[#D97706]',
  }

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  )
}

export function AdminSectionCard({
  title,
  description,
  children,
  action,
  className = '',
}: {
  title: string
  description?: string
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <Card className={`overflow-hidden ${className}`} padding="none">
      <div className="flex flex-col gap-3 border-b border-[#E5E7EB] px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#1F2937]">{title}</h2>
          {description ? <p className="text-sm text-[#6B7280]">{description}</p> : null}
        </div>
        {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  )
}

export function AdminField({
  label,
  hint,
  children,
  required = false,
}: {
  label: string
  hint?: string
  children: ReactNode
  required?: boolean
}) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-semibold text-[#1F2937]">
        {label}
        {required ? <span className="ml-1 text-[#F23645]">*</span> : null}
      </span>
      {children}
      {hint ? <span className="block text-xs text-[#6B7280]">{hint}</span> : null}
    </label>
  )
}

export function AdminInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        'w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm text-[#1F2937] outline-none transition',
        'placeholder:text-[#9CA3AF] focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]',
        props.className ?? '',
      ].join(' ')}
    />
  )
}

export function AdminTextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        'w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm text-[#1F2937] outline-none transition',
        'placeholder:text-[#9CA3AF] focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]',
        props.className ?? '',
      ].join(' ')}
    />
  )
}

export function AdminSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        'w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1F2937] outline-none transition',
        'focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]',
        props.className ?? '',
      ].join(' ')}
    />
  )
}

export function AdminToggle({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition',
        active
          ? 'border-[#B8D5FB] bg-[#EAF3FF] text-[#1E63B5]'
          : 'border-[#E5E7EB] bg-white text-[#6B7280]',
      ].join(' ')}
    >
      <span
        className={[
          'h-2.5 w-2.5 rounded-full transition',
          active ? 'bg-[#1E63B5]' : 'bg-[#9CA3AF]',
        ].join(' ')}
      />
      {label}
    </button>
  )
}

export function AdminMessage({
  tone,
  children,
}: {
  tone: 'error' | 'success' | 'info'
  children: ReactNode
}) {
  const tones = {
    error: 'border-[#F9D2D6] bg-[#FFF7F8] text-[#C2253D]',
    success: 'border-[#CDEDD8] bg-[#F5FCF8] text-[#15803D]',
    info: 'border-[#D6E6FA] bg-[#F7FAFF] text-[#1E63B5]',
  }

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>
}

export function AdminEmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-[#FAFBFD] px-6 py-10 text-center">
      <h3 className="text-base font-bold text-[#1F2937]">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-[#6B7280]">{description}</p>
      {actionLabel && onAction ? (
        <div className="mt-5">
          <Button onClick={onAction} size="sm">
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

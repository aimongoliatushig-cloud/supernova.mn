'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Activity,
  BotMessageSquare,
  Brain,
  FileText,
  Gift,
  LayoutDashboard,
  LogOut,
  Package,
  Stethoscope,
  UserCog,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Role =
  | 'office_assistant'
  | 'operator'
  | 'organization_consultant'
  | 'doctor'
  | 'super_admin'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
}

const navByRole: Record<Role, NavItem[]> = {
  office_assistant: [
    { href: '/dashboard/assistant', label: 'Хяналтын самбар', icon: <LayoutDashboard size={18} /> },
    { href: '/dashboard/assistant', label: 'Лидүүд ба CRM', icon: <Users size={18} /> },
    { href: '/dashboard/assistant/chatbot', label: 'Чатбот', icon: <BotMessageSquare size={18} /> },
  ],
  operator: [
    { href: '/dashboard/operator', label: 'Хяналтын самбар', icon: <LayoutDashboard size={18} /> },
    { href: '/dashboard/operator', label: 'Лидүүд ба CRM', icon: <Users size={18} /> },
  ],
  organization_consultant: [
    { href: '/dashboard/consultant', label: 'Хяналтын самбар', icon: <LayoutDashboard size={18} /> },
    { href: '/dashboard/consultant', label: 'Байгууллагын хүсэлтүүд', icon: <Users size={18} /> },
  ],
  doctor: [{ href: '/dashboard/doctor', label: 'Хяналтын самбар', icon: <LayoutDashboard size={18} /> }],
  super_admin: [
    { href: '/dashboard/admin', label: 'Тойм', icon: <LayoutDashboard size={18} /> },
    { href: '/dashboard/admin/cms', label: 'Landing CMS', icon: <FileText size={18} /> },
    { href: '/dashboard/admin/accounts', label: 'Ажилтны эрх', icon: <UserCog size={18} /> },
    { href: '/dashboard/admin/doctors', label: 'Эмч нар', icon: <Stethoscope size={18} /> },
    { href: '/dashboard/admin/services', label: 'Үйлчилгээ', icon: <Activity size={18} /> },
    { href: '/dashboard/admin/packages', label: 'Багцууд', icon: <Package size={18} /> },
    { href: '/dashboard/admin/promotions', label: 'Урамшуулал', icon: <Gift size={18} /> },
    { href: '/dashboard/admin/blog', label: 'Блог', icon: <FileText size={18} /> },
    { href: '/dashboard/admin/diagnosis', label: 'Оношилгоо', icon: <Brain size={18} /> },
    { href: '/dashboard/admin/crm', label: 'CRM', icon: <Users size={18} /> },
    { href: '/dashboard/admin/chatbot', label: 'Чатбот', icon: <BotMessageSquare size={18} /> },
  ],
}

const roleLabels: Record<Role, string> = {
  office_assistant: 'Оффисын туслах',
  operator: 'Оператор',
  organization_consultant: 'Байгууллагын зөвлөх',
  doctor: 'Эмч',
  super_admin: 'Супер админ',
}

interface SidebarProps {
  role: string
  user: { full_name?: string | null; email?: string | null } | null
}

function Brand() {
  return (
    <div className="text-base font-black tracking-[0.16em]">
      <span className="text-[#F23645]">SUPER</span>
      <span className="text-[#1E63B5]">NOVA</span>
    </div>
  )
}

function UserBadge({ user }: { user: SidebarProps['user'] }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#F7FAFF] px-3 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1E63B5] text-xs font-black text-white">
        {(user?.full_name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#1F2937]">
          {user?.full_name ?? 'Ажилтан'}
        </p>
        <p className="truncate text-xs text-[#9CA3AF]">{user?.email}</p>
      </div>
    </div>
  )
}

export default function DashboardSidebar({ role, user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const navigation = navByRole[role as Role] ?? navByRole.office_assistant
  const roleLabel = roleLabels[role as Role] ?? 'Ажилтан'

  function isActiveHref(href: string) {
    const cleanHref = href.split('?')[0]

    return cleanHref === '/dashboard/admin'
      ? pathname === '/dashboard/admin'
      : pathname.startsWith(cleanHref)
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (error) {
      console.error('Failed to sign out cleanly.', error)
    }

    router.replace('/login')
    router.refresh()
  }

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white/95 backdrop-blur lg:hidden">
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Brand />
              <p className="mt-1 text-xs font-medium text-[#9CA3AF]">{roleLabel}</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm text-[#6B7280] transition hover:bg-[#FFF1F2] hover:text-[#F23645]"
            >
              <LogOut size={16} />
              Гарах
            </button>
          </div>

          <div className="mt-4">
            <UserBadge user={user} />
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-4 pb-4">
          {navigation.map((item) => (
            <Link
              key={`${item.href}:${item.label}:mobile`}
              href={item.href}
              className={[
                'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition',
                isActiveHref(item.href)
                  ? 'border-[#B8D5FB] bg-[#EAF3FF] text-[#1E63B5]'
                  : 'border-[#E5E7EB] bg-white text-[#6B7280]',
              ].join(' ')}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-[#E5E7EB] bg-white lg:flex">
        <div className="border-b border-[#E5E7EB] px-5 py-5">
          <Brand />
          <p className="mt-1 text-xs font-medium text-[#9CA3AF]">{roleLabel}</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => (
            <Link
              key={`${item.href}:${item.label}`}
              href={item.href}
              className={[
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActiveHref(item.href)
                  ? 'bg-[#EAF3FF] text-[#1E63B5]'
                  : 'text-[#6B7280] hover:bg-[#F7FAFF] hover:text-[#1F2937]',
              ].join(' ')}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-[#E5E7EB] px-3 py-4">
          <UserBadge user={user} />
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#6B7280] transition hover:bg-[#FFF1F2] hover:text-[#F23645]"
          >
            <LogOut size={16} />
            Гарах
          </button>
        </div>
      </aside>
    </>
  )
}

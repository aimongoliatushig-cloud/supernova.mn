'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Activity,
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

type Role = 'office_assistant' | 'doctor' | 'super_admin'

const navByRole: Record<Role, { href: string; label: string; icon: React.ReactNode }[]> = {
  office_assistant: [
    { href: '/dashboard/assistant', label: 'Хяналтын самбар', icon: <LayoutDashboard size={18} /> },
    { href: '/dashboard/assistant', label: 'Лидүүд ба CRM', icon: <Users size={18} /> },
  ],
  doctor: [
    { href: '/dashboard/doctor', label: 'Хяналтын самбар', icon: <LayoutDashboard size={18} /> },
  ],
  super_admin: [
    { href: '/dashboard/admin', label: 'Тойм', icon: <LayoutDashboard size={18} /> },
    { href: '/dashboard/admin/cms', label: 'Landing CMS', icon: <FileText size={18} /> },
    { href: '/dashboard/admin/accounts', label: 'Ажилтны эрх', icon: <UserCog size={18} /> },
    { href: '/dashboard/admin/doctors', label: 'Эмч нар', icon: <Stethoscope size={18} /> },
    { href: '/dashboard/admin/services', label: 'Үйлчилгээ', icon: <Activity size={18} /> },
    { href: '/dashboard/admin/packages', label: 'Багцууд', icon: <Package size={18} /> },
    { href: '/dashboard/admin/promotions', label: 'Урамшуулал', icon: <Gift size={18} /> },
    { href: '/dashboard/admin/diagnosis', label: 'Оношилгоо', icon: <Brain size={18} /> },
    { href: '/dashboard/admin/crm', label: 'CRM', icon: <Users size={18} /> },
  ],
}

const roleLabels: Record<Role, string> = {
  office_assistant: 'Оффисын туслах',
  doctor: 'Эмч',
  super_admin: 'Супер админ',
}

interface SidebarProps {
  role: string
  user: { full_name?: string | null; email?: string | null } | null
}

export default function DashboardSidebar({ role, user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const navigation = navByRole[role as Role] ?? navByRole.office_assistant

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-[#E5E7EB] bg-white lg:flex">
      <div className="border-b border-[#E5E7EB] px-5 py-5">
        <div className="text-base font-black">
          <span className="text-[#F23645]">СУПЕР</span>
          <span className="text-[#1E63B5]">НОВА</span>
        </div>
        <p className="mt-1 text-xs font-medium text-[#9CA3AF]">
          {roleLabels[role as Role] ?? 'Ажилтан'}
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const cleanHref = item.href.split('?')[0]
          const active =
            cleanHref === '/dashboard/admin'
              ? pathname === '/dashboard/admin'
              : pathname.startsWith(cleanHref)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                active
                  ? 'bg-[#EAF3FF] text-[#1E63B5]'
                  : 'text-[#6B7280] hover:bg-[#F7FAFF] hover:text-[#1F2937]',
              ].join(' ')}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-[#E5E7EB] px-3 py-4">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-[#F7FAFF] px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E63B5] text-xs font-black text-white">
            {(user?.full_name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[#1F2937]">
              {user?.full_name ?? 'Ажилтан'}
            </p>
            <p className="truncate text-xs text-[#9CA3AF]">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#6B7280] transition hover:bg-[#FFF1F2] hover:text-[#F23645]"
        >
          <LogOut size={16} />
          Гарах
        </button>
      </div>
    </aside>
  )
}

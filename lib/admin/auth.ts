import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AdminViewer, Role } from '@/lib/admin/types'

export const getCurrentViewer = cache(async (): Promise<AdminViewer | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return null
  }

  return profile as AdminViewer
})

export async function requireDashboardViewer() {
  const viewer = await getCurrentViewer()

  if (!viewer) {
    redirect('/auth/login')
  }

  return viewer
}

export async function requireRole(roles: Role[]) {
  const viewer = await requireDashboardViewer()

  if (!roles.includes(viewer.role)) {
    redirect('/dashboard')
  }

  return viewer
}

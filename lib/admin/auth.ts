import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AdminViewer, Role } from '@/lib/admin/types'
import {
  createServiceRoleClient,
  hasServiceRoleConfig,
} from '@/lib/supabase/service-role'

const FALLBACK_SUPER_ADMIN_EMAIL = 'admin@gmail.com'

async function ensureProfile(
  user: {
    id: string
    email?: string | null
    user_metadata?: Record<string, unknown>
  },
  existingProfile: AdminViewer | null
) {
  if (!hasServiceRoleConfig()) {
    return existingProfile
  }

  const normalizedEmail = user.email?.toLowerCase() ?? null
  const desiredRole: Role =
    normalizedEmail === FALLBACK_SUPER_ADMIN_EMAIL ? 'super_admin' : existingProfile?.role ?? 'patient'

  if (existingProfile && existingProfile.role === desiredRole) {
    return existingProfile
  }

  const fullName =
    existingProfile?.full_name ||
    (typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name.trim()
      : '') ||
    (desiredRole === 'super_admin' ? 'Supernova Admin' : '')

  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email ?? existingProfile?.email ?? '',
          full_name: fullName,
          role: desiredRole,
        },
        { onConflict: 'id' }
      )
      .select('id, email, full_name, role')
      .single()

    if (error) {
      return existingProfile
    }

    return data as AdminViewer
  } catch {
    return existingProfile
  }
}

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
    .maybeSingle()

  const ensuredProfile = await ensureProfile(user, (profile as AdminViewer | null) ?? null)
  if (ensuredProfile) {
    return ensuredProfile
  }

  if (user.email?.toLowerCase() === FALLBACK_SUPER_ADMIN_EMAIL) {
    return {
      id: user.id,
      email: user.email,
      full_name: 'Supernova Admin',
      role: 'super_admin' as Role,
    }
  }

  return null
})

export async function requireDashboardViewer() {
  const viewer = await getCurrentViewer()

  if (!viewer) {
    redirect('/login')
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

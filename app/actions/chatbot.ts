'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function getPublicChatbotConfig() {
  try {
    const supabase = createServiceRoleClient()
    const { data } = await supabase
      .from('chatbot_settings')
      .select('is_active, avatar_url')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()

    if (!data) return null

    return {
      isActive: data.is_active,
      avatarUrl: data.avatar_url,
    }
  } catch (error) {
    console.error('Failed to get chatbot config', error)
    return null
  }
}

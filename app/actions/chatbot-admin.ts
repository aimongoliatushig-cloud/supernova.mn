'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { encodeChatbotSettings, parseChatbotSettings } from '@/lib/chatbot/settings'
import { revalidatePath } from 'next/cache'
import type { ChatConversation } from '@/components/dashboard/ChatConversationsBoard'

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001'
const DEFAULT_SYSTEM_PROMPT =
  'Та бол СУПЕРНОВА эмнэлгийн хиймэл оюун ухаант туслах юм. Таны зорилго бол өвчтөнүүдэд эелдэг бөгөөд мэргэжлийн түвшинд монгол хэлээр зөвлөгөө өгч, эмнэлгийн үйлчилгээний талаар мэдээлэл өгөх.'

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

export async function getChatbotSettings() {
  const supabase = createServiceRoleClient()

  await supabase
    .from('chatbot_settings')
    .upsert(
      {
        id: SETTINGS_ID,
        is_active: false,
        avatar_url: '',
        openai_api_key: '',
        system_prompt: DEFAULT_SYSTEM_PROMPT,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )

  const { data, error } = await supabase
    .from('chatbot_settings')
    .select('*')
    .eq('id', SETTINGS_ID)
    .single()

  if (error) throw new Error(`Failed to load chatbot settings: ${error.message}`)

  const parsed = parseChatbotSettings(data.system_prompt)

  return {
    ...data,
    assistant_id: parsed.assistantId,
    system_prompt: parsed.systemPrompt || DEFAULT_SYSTEM_PROMPT,
  }
}

export async function updateChatbotSettings(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const isActive = formData.get('isActive') === 'on'
  const avatarUrl = formData.get('avatarUrl')?.toString() || ''
  const assistantId = formData.get('assistantId')?.toString() || ''
  const systemPrompt = formData.get('systemPrompt')?.toString() || ''
  const openaiApiKey = formData.get('openaiApiKey')?.toString() || ''

  const { error } = await supabase
    .from('chatbot_settings')
    .update({
      is_active: isActive,
      avatar_url: avatarUrl,
      system_prompt: encodeChatbotSettings({ assistantId, systemPrompt }),
      openai_api_key: openaiApiKey,
      updated_at: new Date().toISOString(),
    })
    .eq('id', SETTINGS_ID)

  if (error) {
    console.error(error)
    throw new Error('Failed to update chatbot settings')
  }

  revalidatePath('/dashboard/admin/chatbot')
}

export async function getChatConversations(): Promise<ChatConversation[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('chat_conversations')
    .select(`
      id,
      session_id,
      status,
      created_at,
      leads (
        id,
        full_name,
        phone
      ),
      chat_messages (
        id,
        role,
        content,
        created_at
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return []
  }

  return (data ?? []).map((conversation) => ({
    id: conversation.id,
    session_id: conversation.session_id,
    status: conversation.status,
    created_at: conversation.created_at,
    leads: unwrapRelation(conversation.leads),
    chat_messages: Array.isArray(conversation.chat_messages) ? conversation.chat_messages : [],
  }))
}

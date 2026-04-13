import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { parseChatbotSettings } from '@/lib/chatbot/settings'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'

export const maxDuration = 30

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type AssistantRunStatus =
  | 'queued'
  | 'in_progress'
  | 'requires_action'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired'

function shouldFallbackFromAssistant(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()

  return (
    message.includes('openai assistants api 401') ||
    message.includes('insufficient permissions') ||
    message.includes('missing scopes') ||
    message.includes('api.threads.write')
  )
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchAssistantApi<T>(
  apiKey: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`https://api.openai.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`OpenAI Assistants API ${response.status}: ${errorBody}`)
  }

  return response.json() as Promise<T>
}

async function getAssistantResponse({
  apiKey,
  assistantId,
  additionalInstructions,
  messages,
}: {
  apiKey: string
  assistantId: string
  additionalInstructions: string
  messages: ChatMessage[]
}) {
  const thread = await fetchAssistantApi<{ id: string }>(apiKey, '/threads', {
    method: 'POST',
    body: JSON.stringify({
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    }),
  })

  const run = await fetchAssistantApi<{ id: string; status: AssistantRunStatus }>(
    apiKey,
    `/threads/${thread.id}/runs`,
    {
      method: 'POST',
      body: JSON.stringify({
        assistant_id: assistantId,
        ...(additionalInstructions
          ? { additional_instructions: additionalInstructions }
          : {}),
      }),
    },
  )

  let status = run.status
  const startedAt = Date.now()

  while (status === 'queued' || status === 'in_progress') {
    if (Date.now() - startedAt > 25000) {
      throw new Error('OpenAI assistant run timed out.')
    }

    await sleep(1000)

    const updatedRun = await fetchAssistantApi<{ status: AssistantRunStatus }>(
      apiKey,
      `/threads/${thread.id}/runs/${run.id}`,
      { method: 'GET' },
    )

    status = updatedRun.status
  }

  if (status === 'requires_action') {
    throw new Error('The configured OpenAI assistant requires tools that are not handled by this chat widget.')
  }

  if (status !== 'completed') {
    throw new Error(`OpenAI assistant run ended with status: ${status}`)
  }

  const threadMessages = await fetchAssistantApi<{
    data: Array<{
      role: 'user' | 'assistant'
      content: Array<{
        type: string
        text?: {
          value: string
        }
      }>
    }>
  }>(apiKey, `/threads/${thread.id}/messages?order=desc&limit=20`, {
    method: 'GET',
  })

  const assistantMessage = threadMessages.data.find((message) => message.role === 'assistant')
  const text = assistantMessage?.content
    ?.filter((item) => item.type === 'text' && item.text?.value)
    .map((item) => item.text!.value)
    .join('\n')
    .trim()

  if (!text) {
    throw new Error('OpenAI assistant completed without returning text.')
  }

  return text
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, sessionId, guestInfo } = body as {
      messages?: Array<{ role: 'user' | 'assistant'; content: string }>
      sessionId?: string
      guestInfo?: { name?: string; phone?: string }
    }

    if (!sessionId) {
      return new Response('No session ID provided', { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const { data: settings } = await supabase
      .from('chatbot_settings')
      .select('is_active, openai_api_key, system_prompt')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()

    if (!settings?.is_active || !settings?.openai_api_key) {
      return new Response('Chatbot not available', { status: 503 })
    }

    const parsedSettings = parseChatbotSettings(settings.system_prompt)
    const normalizedMessages: ChatMessage[] = (messages ?? [])
      .filter((message): message is ChatMessage =>
        (message?.role === 'user' || message?.role === 'assistant') &&
        typeof message.content === 'string' &&
        message.content.trim().length > 0,
      )
      .map((message) => ({
        role: message.role,
        content: message.content,
      }))

    let conversationId: string | null = null
    const { data: existingConv } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle()

    if (existingConv) {
      conversationId = existingConv.id
    } else {
      let leadId: string | null = null

      if (guestInfo?.name && guestInfo?.phone) {
        const { data: newLead } = await supabase
          .from('leads')
          .insert({ full_name: guestInfo.name, phone: guestInfo.phone, source: 'ai_chatbot' })
          .select('id')
          .single()

        if (newLead) leadId = newLead.id
      }

      const { data: newConv } = await supabase
        .from('chat_conversations')
        .insert({ session_id: sessionId, lead_id: leadId })
        .select('id')
        .single()

      if (newConv) conversationId = newConv.id
    }

    const persistMessage = async (role: 'user' | 'assistant', content: string) => {
      if (!conversationId || !content) return

      const { error } = await supabase.from('chat_messages').insert({
        conversation_id: conversationId,
        role,
        content,
      })

      if (error) {
        console.error(`Failed to persist ${role} chat message:`, error)
      }
    }

    const lastMsg = normalizedMessages[normalizedMessages.length - 1]
    if (lastMsg?.role === 'user') {
      await persistMessage('user', lastMsg.content)
    }

    if (parsedSettings.assistantId) {
      try {
        const assistantText = await getAssistantResponse({
          apiKey: settings.openai_api_key,
          assistantId: parsedSettings.assistantId,
          additionalInstructions: parsedSettings.systemPrompt,
          messages: normalizedMessages,
        })

        await persistMessage('assistant', assistantText)

        return new Response(assistantText, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        })
      } catch (assistantError) {
        if (!shouldFallbackFromAssistant(assistantError)) {
          throw assistantError
        }

        console.warn(
          'Assistant API unavailable for current key; falling back to direct model response.',
          assistantError,
        )
      }
    }

    const openai = createOpenAI({
      apiKey: settings.openai_api_key,
    })

    const result = streamText({
      model: openai('gpt-4.1-mini'),
      system: parsedSettings.systemPrompt || 'You are a helpful assistant.',
      messages: normalizedMessages,
      async onFinish({ text }) {
        await persistMessage('assistant', text)
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Internal error', { status: 500 })
  }
}

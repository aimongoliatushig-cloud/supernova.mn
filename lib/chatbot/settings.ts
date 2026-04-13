const ASSISTANT_MARKER = '<!-- OPENAI_ASSISTANT_ID:'

export type ParsedChatbotSettings = {
  assistantId: string
  systemPrompt: string
}

export function parseChatbotSettings(rawValue: string | null | undefined): ParsedChatbotSettings {
  const raw = rawValue ?? ''

  if (!raw.startsWith(ASSISTANT_MARKER)) {
    return {
      assistantId: '',
      systemPrompt: raw,
    }
  }

  const markerEnd = raw.indexOf('-->')
  if (markerEnd === -1) {
    return {
      assistantId: '',
      systemPrompt: raw,
    }
  }

  const assistantId = raw.slice(ASSISTANT_MARKER.length, markerEnd).trim()
  const systemPrompt = raw.slice(markerEnd + 3).replace(/^\s+/, '')

  return {
    assistantId,
    systemPrompt,
  }
}

export function encodeChatbotSettings({
  assistantId,
  systemPrompt,
}: ParsedChatbotSettings): string {
  const normalizedAssistantId = assistantId.trim()
  const normalizedSystemPrompt = systemPrompt.trim()

  if (!normalizedAssistantId) {
    return normalizedSystemPrompt
  }

  if (!normalizedSystemPrompt) {
    return `${ASSISTANT_MARKER} ${normalizedAssistantId} -->`
  }

  return `${ASSISTANT_MARKER} ${normalizedAssistantId} -->\n${normalizedSystemPrompt}`
}

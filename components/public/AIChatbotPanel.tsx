/* eslint-disable @next/next/no-img-element */

'use client'

import { useEffect, useRef, useState } from 'react'
import { BotMessageSquare, ChevronDown, Send } from 'lucide-react'

type Message = { id: string; role: 'user' | 'assistant'; content: string }

interface AIChatbotPanelProps {
  config: {
    avatarUrl: string | null
  }
  className?: string
  onClose?: () => void
  showCloseButton?: boolean
  starterPrompts?: readonly string[]
}

export default function AIChatbotPanel({
  config,
  className = '',
  onClose,
  showCloseButton = false,
  starterPrompts = [],
}: AIChatbotPanelProps) {
  const [sessionId, setSessionId] = useState('')
  const [isGuestInfoSet, setIsGuestInfoSet] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const guestInfoSentRef = useRef(false)

  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let session = localStorage.getItem('supernova_chat_session')
    if (!session) {
      session = crypto.randomUUID()
      localStorage.setItem('supernova_chat_session', session)
    }
    setSessionId(session)

    const savedName = localStorage.getItem('supernova_chat_guest_name')
    const savedPhone = localStorage.getItem('supernova_chat_guest_phone')
    if (savedName && savedPhone) {
      setGuestName(savedName)
      setGuestPhone(savedPhone)
      setIsGuestInfoSet(true)
      guestInfoSentRef.current = true
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  async function sendMessage(rawText?: string) {
    const trimmed = (rawText ?? text).trim()
    if (!trimmed || isLoading || !sessionId) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    const history = [...messages, userMsg]
    setMessages(history)
    setText('')
    setIsLoading(true)
    setStreamingContent('')

    const guestInfo = !guestInfoSentRef.current && guestName && guestPhone
      ? { name: guestName, phone: guestPhone }
      : undefined

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          guestInfo,
          messages: history.map((message) => ({ role: message.role, content: message.content })),
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (guestInfo) guestInfoSentRef.current = true

      const decoder = new TextDecoder()
      let assistantText = ''
      const reader = res.body?.getReader()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          assistantText += decoder.decode(value, { stream: true })
          setStreamingContent(assistantText)
        }
      } else {
        assistantText = await res.text()
      }

      assistantText = `${assistantText}${decoder.decode()}`.trim()

      if (!assistantText) {
        throw new Error('Empty assistant response')
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantText,
      }
      setMessages((prev) => [...prev, assistantMsg])
      setStreamingContent('')
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Уучлаарай, алдаа гарлаа. Дахин оролдоно уу.',
        },
      ])
    } finally {
      setIsLoading(false)
      setStreamingContent('')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    void sendMessage()
  }

  function handleStarterClick(prompt: string) {
    setText(prompt)
    if (isGuestInfoSet) {
      void sendMessage(prompt)
    }
  }

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 ${className}`.trim()}
    >
      <div className="flex items-center justify-between bg-gradient-to-r from-[#1E63B5] to-[#154D8F] px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          {config.avatarUrl ? (
            <img src={config.avatarUrl} alt="Chatbot avatar" className="h-10 w-10 rounded-full bg-white object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <BotMessageSquare size={20} />
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold">СУПЕРНОВА Туслах</h3>
            <p className="text-[11px] text-blue-100">Онлайн тусламж</p>
          </div>
        </div>
        {showCloseButton ? (
          <button onClick={onClose} className="rounded-full p-1.5 transition hover:bg-white/20" aria-label="Чатыг хаах">
            <ChevronDown size={20} />
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto bg-[#F9FAFB] p-4 text-sm">
        {!isGuestInfoSet ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF3FF] text-[#1E63B5]">
              <BotMessageSquare size={28} />
            </div>
            <h4 className="mb-2 text-base font-bold text-[#1F2937]">Сайн байна уу?</h4>
            <p className="mb-6 max-w-md text-sm text-[#6B7280]">
              Танд туслахад бэлэн байна. Эхлээд нэр, утсаа оруулаад чатаа эхлүүлнэ үү.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (guestName.trim() && guestPhone.trim()) {
                  localStorage.setItem('supernova_chat_guest_name', guestName)
                  localStorage.setItem('supernova_chat_guest_phone', guestPhone)
                  setIsGuestInfoSet(true)
                }
              }}
              className="w-full max-w-md space-y-3"
            >
              <input
                type="text"
                required
                placeholder="Таны нэр"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#1E63B5] focus:outline-none focus:ring-1 focus:ring-[#1E63B5]"
              />
              <input
                type="tel"
                required
                placeholder="Утасны дугаар"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#1E63B5] focus:outline-none focus:ring-1 focus:ring-[#1E63B5]"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-[#1E63B5] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#154D8F]"
              >
                Чатлах
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.length === 0 && !isLoading ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#D8E6F6] bg-white p-4 text-center shadow-sm">
                  <p className="text-sm font-semibold text-[#1F2937]">Туслахдаа асуултаа бичнэ үү.</p>
                  <p className="mt-1 text-xs leading-6 text-[#6B7280]">
                    Эмч, үйлчилгээ, цаг авах, урьдчилан сэргийлэх багцын талаар асууж болно.
                  </p>
                </div>

                {starterPrompts.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#6B7280]">
                      Түгээмэл асуулт
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {starterPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => handleStarterClick(prompt)}
                          className="rounded-full border border-[#C8DCF5] bg-[#F8FBFF] px-3 py-2 text-left text-xs font-semibold text-[#1E63B5] transition hover:border-[#1E63B5] hover:bg-[#EAF3FF]"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    message.role === 'user'
                      ? 'rounded-br-none bg-[#1E63B5] text-white'
                      : 'rounded-bl-none border border-gray-100 bg-white text-[#1F2937] shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}

            {streamingContent ? (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-none border border-gray-100 bg-white px-4 py-2.5 text-[#1F2937] shadow-sm">
                  <p className="whitespace-pre-wrap leading-relaxed">{streamingContent}</p>
                </div>
              </div>
            ) : null}

            {isLoading && !streamingContent ? (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-none border border-gray-100 bg-white px-4 py-2 shadow-sm">
                  <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {isGuestInfoSet ? (
        <div className="border-t border-gray-100 bg-white p-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void sendMessage()
                }
              }}
              placeholder="Энд бичнэ үү..."
              className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E63B5]"
            />
            <button
              type="submit"
              disabled={!text.trim() || isLoading}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1E63B5] text-white transition hover:bg-[#154D8F] disabled:opacity-50"
            >
              <Send size={16} className="ml-0.5" />
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}

'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { BotMessageSquare, Send, ChevronDown } from 'lucide-react'
import { getPublicChatbotConfig } from '@/app/actions/chatbot'

type Message = { id: string; role: 'user' | 'assistant'; content: string }

export default function AIChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<{ isActive: boolean; avatarUrl: string | null } | null>(null)
  const [sessionId, setSessionId] = useState('')

  const [isGuestInfoSet, setIsGuestInfoSet] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const guestInfoSentRef = useRef(false)

  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')

  const pathname = usePathname()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getPublicChatbotConfig().then((cfg) => { if (cfg) setConfig(cfg) })

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

  async function sendMessage() {
    const trimmed = text.trim()
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

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          assistantText += decoder.decode(value, { stream: true })
          setStreamingContent(assistantText)
        }
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantText || '...',
      }
      setMessages((prev) => [...prev, assistantMsg])
      setStreamingContent('')
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Уучлаарай, алдаа гарлаа. Дахин оролдоно уу.',
      }])
    } finally {
      setIsLoading(false)
      setStreamingContent('')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage()
  }

  if (!config?.isActive) return null
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/login') || pathname.startsWith('/setup')) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 flex h-[520px] w-[350px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 sm:w-[400px]">
          <div className="flex items-center justify-between bg-gradient-to-r from-[#1E63B5] to-[#154D8F] px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              {config.avatarUrl ? (
                <img src={config.avatarUrl} alt="Avatar" className="h-8 w-8 rounded-full bg-white object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <BotMessageSquare size={18} />
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold">СУПЕРНОВА Туслах</h3>
                <p className="text-[10px] text-blue-100">Онлайн байна</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-full p-1.5 transition hover:bg-white/20">
              <ChevronDown size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#F9FAFB] p-4 text-sm">
            {!isGuestInfoSet ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF3FF] text-[#1E63B5]">
                  <BotMessageSquare size={24} />
                </div>
                <h4 className="mb-2 text-base font-bold text-[#1F2937]">Сайн байна уу?</h4>
                <p className="mb-6 text-sm text-[#6B7280]">Танд туслахад бэлэн байна. Эхлээд мэдээллээ оруулна уу.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (guestName.trim() && guestPhone.trim()) {
                      localStorage.setItem('supernova_chat_guest_name', guestName)
                      localStorage.setItem('supernova_chat_guest_phone', guestPhone)
                      setIsGuestInfoSet(true)
                    }
                  }}
                  className="w-full space-y-3 px-4"
                >
                  <input type="text" required placeholder="Таны нэр" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#1E63B5] focus:outline-none focus:ring-1 focus:ring-[#1E63B5]" />
                  <input type="tel" required placeholder="Утасны дугаар" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#1E63B5] focus:outline-none focus:ring-1 focus:ring-[#1E63B5]" />
                  <button type="submit" className="w-full rounded-xl bg-[#1E63B5] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#154D8F]">Чатлах</button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.length === 0 && !isLoading && (
                  <div className="mt-4 text-center text-xs text-gray-400">Та асуултаа бичнэ үү.</div>
                )}
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      message.role === 'user'
                        ? 'rounded-br-none bg-[#1E63B5] text-white'
                        : 'rounded-bl-none border border-gray-100 bg-white text-[#1F2937] shadow-sm'
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}
                {streamingContent && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl rounded-bl-none border border-gray-100 bg-white px-4 py-2.5 text-[#1F2937] shadow-sm">
                      <p className="whitespace-pre-wrap leading-relaxed">{streamingContent}</p>
                    </div>
                  </div>
                )}
                {isLoading && !streamingContent && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-none border border-gray-100 bg-white px-4 py-2 shadow-sm">
                      <div className="flex gap-1">
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {isGuestInfoSet && (
            <div className="border-t border-gray-100 bg-white p-3">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Энд бичнэ үү..."
                  className="flex-1 rounded-xl bg-gray-100 px-4 py-2 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E63B5]"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || isLoading}
                  className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[#1E63B5] text-white transition hover:bg-[#154D8F] disabled:opacity-50"
                >
                  <Send size={16} className="ml-1" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#1E63B5] shadow-lg transition-transform hover:scale-110 active:scale-95"
        >
          <div className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-[#F23645] opacity-75" />
          <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#F23645]" />
          <BotMessageSquare size={26} className="text-white transition-transform group-hover:-rotate-12" />
        </button>
      )}
    </div>
  )
}

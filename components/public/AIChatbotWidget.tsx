'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { BotMessageSquare } from 'lucide-react'
import { getPublicChatbotConfig } from '@/app/actions/chatbot'
import AIChatbotPanel from '@/components/public/AIChatbotPanel'

export default function AIChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<{ isActive: boolean; avatarUrl: string | null } | null>(null)

  const pathname = usePathname()

  useEffect(() => {
    getPublicChatbotConfig().then((cfg) => {
      if (cfg) setConfig(cfg)
    })
  }, [])

  if (!config?.isActive) return null
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/setup') ||
    pathname.startsWith('/chatbotai')
  ) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <AIChatbotPanel
          config={config}
          showCloseButton
          onClose={() => setIsOpen(false)}
          className="mb-4 h-[560px] w-[380px] sm:w-[420px]"
        />
      ) : null}

      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#1E63B5] shadow-lg transition-transform hover:scale-110 active:scale-95"
        >
          <div className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-[#F23645] opacity-75" />
          <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#F23645]" />
          <BotMessageSquare size={26} className="text-white transition-transform group-hover:-rotate-12" />
        </button>
      ) : null}
    </div>
  )
}

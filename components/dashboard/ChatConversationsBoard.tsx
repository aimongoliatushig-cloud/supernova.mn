'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { User, Bot, Search } from 'lucide-react'

type Message = {
  id: string
  role: string
  content: string
  created_at: string
}

export type ChatConversation = {
  id: string
  session_id: string
  status: string
  created_at: string
  leads: {
    id: string
    full_name: string
    phone: string
  } | null
  chat_messages: Message[]
}

export default function ChatConversationsBoard({ initialData }: { initialData: ChatConversation[] }) {
  const [conversations] = useState<ChatConversation[]>(initialData)
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(conversations[0] || null)
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = conversations.filter((conversation) => {
    const nameMatch = conversation.leads?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const phoneMatch = conversation.leads?.phone?.includes(searchTerm)
    return nameMatch || phoneMatch
  })

  return (
    <div className="flex h-[800px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex w-1/3 flex-col border-r border-gray-200">
        <div className="border-b border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Нэр, утсаар хайх..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">Харилцан яриа олдсонгүй.</div>
          ) : (
            filtered.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedChat(conversation)}
                className={`w-full border-b border-gray-100 p-4 text-left transition hover:bg-gray-50 focus:outline-none ${
                  selectedChat?.id === conversation.id ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{conversation.leads ? conversation.leads.full_name : 'Зочин'}</p>
                  <p className="text-xs text-gray-400">{format(new Date(conversation.created_at), 'HH:mm')}</p>
                </div>
                {conversation.leads && <p className="mt-1 text-xs text-gray-500">{conversation.leads.phone}</p>}
                <p className="mt-2 line-clamp-1 text-sm text-gray-500">
                  {conversation.chat_messages && conversation.chat_messages.length > 0
                    ? conversation.chat_messages[conversation.chat_messages.length - 1].content
                    : 'Шинэ харилцан яриа'}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-gray-50">
        {selectedChat ? (
          <>
            <div className="z-10 flex items-center justify-between border-b border-gray-200 bg-white p-4 shadow-sm">
              <div>
                <h3 className="font-bold text-gray-900">{selectedChat.leads ? selectedChat.leads.full_name : 'Танихгүй зочин'}</h3>
                {selectedChat.leads && <p className="text-sm text-gray-500">{selectedChat.leads.phone}</p>}
              </div>
              <div className="text-xs text-gray-400">Эхэлсэн: {format(new Date(selectedChat.created_at), 'yyyy-MM-dd HH:mm')}</div>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {(() => {
                const sortedMessages = [...(selectedChat.chat_messages || [])].sort(
                  (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
                )

                if (sortedMessages.length === 0) {
                  return <div className="mt-10 text-center text-sm text-gray-400">Мессеж алга байна.</div>
                }

                return sortedMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'rounded-br-none bg-blue-600 text-white'
                          : 'rounded-bl-none border border-gray-200 bg-white text-gray-800 shadow-sm'
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        {message.role === 'user' ? (
                          <User size={12} className="opacity-70" />
                        ) : (
                          <Bot size={12} className="text-blue-500" />
                        )}
                        <span className={`text-[10px] ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                          {format(new Date(message.created_at), 'HH:mm')}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    </div>
                  </div>
                ))
              })()}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-400">Харилцсан ярианаас сонгоно уу.</p>
          </div>
        )}
      </div>
    </div>
  )
}

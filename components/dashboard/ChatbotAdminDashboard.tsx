'use client'

import { type ReactNode, useMemo, useState } from 'react'
import {
  BotMessageSquare,
  MessageCircle,
  Settings,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import ChatConversationsBoard, { type ChatConversation } from '@/components/dashboard/ChatConversationsBoard'

type ChatbotSettings = {
  is_active: boolean
  openai_api_key: string | null
  assistant_id?: string
  avatar_url: string | null
  system_prompt: string | null
}

type ChatbotAdminDashboardProps = {
  conversations: ChatConversation[]
  settings: ChatbotSettings
  updateSettingsAction: (formData: FormData) => Promise<{ success: boolean }>
}

function StatCard({
  label,
  value,
  help,
  icon,
}: {
  label: string
  value: string | number
  help: string
  icon: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">{icon}</div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-3xl font-black tracking-tight text-gray-900">{value}</p>
        <p className="text-sm leading-6 text-gray-500">{help}</p>
      </div>
    </div>
  )
}

export default function ChatbotAdminDashboard({
  conversations,
  settings,
  updateSettingsAction,
}: ChatbotAdminDashboardProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const stats = useMemo(() => {
    const leads = new Set<string>()
    const users = new Set<string>()
    let messageCount = 0

    for (const conversation of conversations) {
      if (conversation.leads?.id) {
        leads.add(conversation.leads.id)
      }

      if (conversation.leads?.phone) {
        users.add(conversation.leads.phone)
      } else if (conversation.session_id) {
        users.add(conversation.session_id)
      }

      messageCount += conversation.chat_messages?.length ?? 0
    }

    return {
      contactedUsers: users.size,
      collectedLeads: leads.size,
      conversations: conversations.length,
      messages: messageCount,
    }
  }, [conversations])

  return (
    <>
      <div className="space-y-8 p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg">
              <BotMessageSquare size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">AI Чатбот удирдлага</h1>
              <p className="text-sm font-medium text-gray-500">
                Чатботын гүйцэтгэл, цугларсан лид болон хадгалсан ярианы түүх
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`rounded-full px-3 py-1 text-xs font-bold ${
              settings.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {settings.is_active ? 'Чатбот идэвхтэй' : 'Чатбот унтраалттай'}
            </div>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              <Settings size={16} />
              Тохиргоо
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Холбогдсон хэрэглэгчид"
            value={stats.contactedUsers}
            help="Чатбот руу бодитоор мессеж илгээсэн хэрэглэгчдийн тоо."
            icon={<Users size={22} />}
          />
          <StatCard
            label="Цугларсан лид"
            value={stats.collectedLeads}
            help="Нэр, утас үлдээгээд хадгалагдсан лидийн тоо."
            icon={<UserRound size={22} />}
          />
          <StatCard
            label="Нийт яриа"
            value={stats.conversations}
            help="Системд хадгалагдсан харилцан ярианы session-ууд."
            icon={<MessageCircle size={22} />}
          />
          <StatCard
            label="Хадгалсан мессеж"
            value={stats.messages}
            help="DB дээр хадгалсан хэрэглэгч болон ботын бүх мессеж."
            icon={<BotMessageSquare size={22} />}
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900">Хадгалсан ярианы түүх</h2>
              <p className="text-sm text-gray-500">
                Энд харагдаж байгаа ярианууд нь бодит бөгөөд `chat_conversations` болон `chat_messages` хүснэгтүүдээс уншигдаж байна.
              </p>
            </div>
            <div className="text-xs font-semibold text-gray-400">
              Сүүлд хадгалсан: {stats.conversations > 0 ? 'тийм' : 'өгөгдөл алга'}
            </div>
          </div>

          <div className="mt-5">
            <ChatConversationsBoard initialData={conversations} />
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-black text-gray-900">Чатботын тохиргоо</h2>
                <p className="text-sm text-gray-500">
                  Энд хийсэн өөрчлөлт нь олон нийтэд харагдах chatbot болон OpenAI холболтод шууд нөлөөлнө.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close settings"
              >
                <X size={18} />
              </button>
            </div>

            <form action={updateSettingsAction} className="space-y-6 px-6 py-6">
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                <div>
                  <p className="font-bold text-gray-900">Чатбот идэвхжүүлэх</p>
                  <p className="text-sm text-gray-500">Нүүр хуудсанд chatbot харагдах эсэх</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" name="isActive" defaultChecked={settings.is_active} className="peer sr-only" />
                  <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">OpenAI API Key</label>
                <input
                  name="openaiApiKey"
                  type="password"
                  defaultValue={settings.openai_api_key ?? ''}
                  placeholder="sk-..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">OpenAI Assistant ID</label>
                <input
                  name="assistantId"
                  type="text"
                  defaultValue={settings.assistant_id ?? ''}
                  placeholder="asst_..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">
                  Assistant ID оруулбал chatbot таны OpenAI Assistant-ийн заавар, knowledge, tools-ийг ашиглана.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Аватар зураг (URL)</label>
                <input
                  name="avatarUrl"
                  type="url"
                  defaultValue={settings.avatar_url ?? ''}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Нэмэлт заавар / System Prompt</label>
                <textarea
                  name="systemPrompt"
                  rows={6}
                  defaultValue={settings.system_prompt ?? ''}
                  placeholder="Чатботын зан төлөв, хариултын өнгө аяс, анхаарах дүрмийг энд бичнэ..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">
                  Assistant ID ашиглаж байгаа бол энэ текст нь тухайн assistant дээр нэмэлт instruction болж очно.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Болих
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  Хадгалах
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

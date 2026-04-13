import { getChatbotSettings, updateChatbotSettings, getChatConversations } from '@/app/actions/chatbot-admin'
import ChatConversationsBoard, { type ChatConversation } from '@/components/dashboard/ChatConversationsBoard'
import { BotMessageSquare, Settings } from 'lucide-react'

export const metadata = {
  title: 'Чатбот тохиргоо | Admin',
}

export default async function AdminChatbotPage() {
  const settings = await getChatbotSettings()
  const conversations = await getChatConversations()

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg">
          <BotMessageSquare size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">AI Чатбот удирдлага</h1>
          <p className="text-sm font-medium text-gray-500">Чатботыг тохируулах болон харилцан яриануудыг хянах</p>
        </div>
      </div>

      <div className="mb-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
          <Settings size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Үндсэн тохиргоо</h2>
        </div>

        <form action={updateChatbotSettings} className="max-w-2xl space-y-6">
          <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
            <div>
              <p className="font-bold text-gray-900">Чатбот идэвхжүүлэх</p>
              <p className="text-sm text-gray-500">Нүүр хуудсанд чатбот харагдах эсэх</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" name="isActive" defaultChecked={settings?.is_active} className="peer sr-only" />
              <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">OpenAI API Key</label>
            <input
              name="openaiApiKey"
              type="password"
              defaultValue={settings?.openai_api_key}
              placeholder="sk-..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">OpenAI Assistant ID</label>
            <input
              name="assistantId"
              type="text"
              defaultValue={(settings as { assistant_id?: string } | null)?.assistant_id ?? ''}
              placeholder="asst_..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">
              Хэрэв Assistant ID оруулбал чатбот таны OpenAI Assistant-ийн заавар, knowledge, tools-ийг ашиглана.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Аватар зураг (URL)</label>
            <input
              name="avatarUrl"
              type="url"
              defaultValue={settings?.avatar_url}
              placeholder="https://..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Нэмэлт заавар / System Prompt</label>
            <textarea
              name="systemPrompt"
              rows={5}
              defaultValue={settings?.system_prompt}
              placeholder="Чатботын зан төлөв, хариултын өнгө аяс, анхаарах дүрмийг энд бичнэ..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">
              Assistant ID ашиглаж байгаа бол энэ текст нь тухайн assistant дээр нэмэлт instruction болж очно.
            </p>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-700">
              Тохиргоог хадгалах
            </button>
          </div>
        </form>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Сүүлийн харилцан ярианууд</h2>
      </div>

      <ChatConversationsBoard initialData={conversations as ChatConversation[]} />
    </div>
  )
}

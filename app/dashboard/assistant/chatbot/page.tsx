import { getChatConversations } from '@/app/actions/chatbot-admin'
import ChatConversationsBoard from '@/components/dashboard/ChatConversationsBoard'
import { BotMessageSquare } from 'lucide-react'

export const metadata = {
  title: 'Чатбот ярианууд | Туслах',
}

export default async function AssistantChatbotPage() {
  const conversations = await getChatConversations()

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg">
          <BotMessageSquare size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Чатбот харилцан ярианууд</h1>
          <p className="text-sm font-medium text-gray-500">Үйлчлүүлэгчдийн AI туслахтай хийсэн яриаг хянах</p>
        </div>
      </div>

      <ChatConversationsBoard initialData={conversations} />
    </div>
  )
}

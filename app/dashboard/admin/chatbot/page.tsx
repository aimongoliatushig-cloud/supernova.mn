import { getChatbotSettings, updateChatbotSettings, getChatConversations } from '@/app/actions/chatbot-admin'
import ChatbotAdminDashboard from '@/components/dashboard/ChatbotAdminDashboard'

export const metadata = {
  title: 'Чатбот удирдлага | Admin',
}

export default async function AdminChatbotPage() {
  const [settings, conversations] = await Promise.all([
    getChatbotSettings(),
    getChatConversations(),
  ])

  return (
    <ChatbotAdminDashboard
      settings={settings}
      conversations={conversations}
      updateSettingsAction={updateChatbotSettings}
    />
  )
}

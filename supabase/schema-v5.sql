CREATE TABLE IF NOT EXISTS chatbot_settings (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_active      BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url     TEXT,
  openai_api_key TEXT,
  system_prompt  TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_conversations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id        UUID REFERENCES leads(id) ON DELETE SET NULL,
  session_id     TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE chatbot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- public can NOT read full settings! Admin only.
CREATE POLICY "admin_select_chatbot" ON chatbot_settings FOR SELECT USING (current_user_role() = 'super_admin');
CREATE POLICY "admin_all_chatbot" ON chatbot_settings FOR ALL USING (current_user_role() = 'super_admin');

-- public can insert and read their own conversations by session / anon
CREATE POLICY "public_insert_conv" ON chat_conversations FOR INSERT WITH CHECK (TRUE);
-- public shouldn't generally read all convs. They don't need to read after they refresh unless we store session_id.
-- Let's allow anon to select their own if they have session_id? No, anon can't easily verify. Just staff.
CREATE POLICY "staff_read_conv" ON chat_conversations FOR SELECT USING (current_user_role() IN ('office_assistant', 'super_admin', 'operator', 'doctor'));
CREATE POLICY "staff_update_conv" ON chat_conversations FOR UPDATE USING (current_user_role() IN ('office_assistant', 'super_admin'));

CREATE POLICY "public_insert_messages" ON chat_messages FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "staff_read_messages" ON chat_messages FOR SELECT USING (current_user_role() IN ('office_assistant', 'super_admin', 'operator', 'doctor'));

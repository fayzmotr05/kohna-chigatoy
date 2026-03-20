-- Telegram Mini App user registration
-- Stores verified phone + name from WebApp.requestContact()

CREATE TABLE telegram_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  language_code TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_telegram_users_tid ON telegram_users(telegram_id);

-- RLS
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;

-- All writes go through service_role (bypasses RLS)
CREATE POLICY "insert telegram_users" ON telegram_users FOR INSERT WITH CHECK (true);
CREATE POLICY "read telegram_users" ON telegram_users FOR SELECT USING (true);

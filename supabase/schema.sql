-- ═══════════════════════════════════════════════════════════════════════════
--  СУПЕРНОВА — Supabase PostgreSQL Schema
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUM types ──────────────────────────────────────────────────────────────
CREATE TYPE user_role          AS ENUM ('patient', 'office_assistant', 'doctor', 'super_admin');
CREATE TYPE risk_level         AS ENUM ('low', 'medium', 'high');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE consultation_status AS ENUM ('new', 'answered', 'called', 'closed');
CREATE TYPE lead_status        AS ENUM ('new', 'contacted', 'pending', 'confirmed', 'blacklisted');
CREATE TYPE callback_time      AS ENUM ('morning', 'afternoon', 'evening');
CREATE TYPE question_type      AS ENUM ('single', 'multiple', 'slider', 'text');

-- ─── profiles ─────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        user_role NOT NULL DEFAULT 'patient',
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'patient'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Backfill profiles if auth users existed before this schema was applied.
INSERT INTO profiles (id, email, full_name, role)
SELECT
  users.id,
  users.email,
  COALESCE(users.raw_user_meta_data->>'full_name', ''),
  'patient'::user_role
FROM auth.users AS users
ON CONFLICT (id) DO NOTHING;

-- ─── symptom_categories ───────────────────────────────────────────────────────
CREATE TABLE symptom_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  name_en     TEXT,
  icon        TEXT NOT NULL DEFAULT '🏥',
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── questions ────────────────────────────────────────────────────────────────
CREATE TABLE questions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id   UUID NOT NULL REFERENCES symptom_categories(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL DEFAULT 'single',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_required   BOOLEAN NOT NULL DEFAULT TRUE,
  risk_weight   NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── answer_options ───────────────────────────────────────────────────────────
CREATE TABLE answer_options (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id  UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text  TEXT NOT NULL,
  risk_score   NUMERIC(4,2) NOT NULL DEFAULT 0,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── doctors ──────────────────────────────────────────────────────────────────
CREATE TABLE doctors (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  full_name        TEXT NOT NULL,
  title            TEXT NOT NULL DEFAULT 'Эмч',
  specialization   TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 0,
  bio              TEXT,
  photo_url        TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── services ─────────────────────────────────────────────────────────────────
CREATE TABLE services (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  description         TEXT,
  price               NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes    INTEGER NOT NULL DEFAULT 30,
  preparation_notice  TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── doctor_services (many-to-many) ───────────────────────────────────────────
CREATE TABLE doctor_services (
  doctor_id   UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  service_id  UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (doctor_id, service_id)
);

-- ─── promotions ───────────────────────────────────────────────────────────────
CREATE TABLE promotions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id       UUID REFERENCES services(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  discount_percent NUMERIC(5,2),
  discount_amount  NUMERIC(10,2),
  free_gift        TEXT,
  badge_text       TEXT NOT NULL DEFAULT 'Урамшуулал',
  badge_color      TEXT NOT NULL DEFAULT '#E8323F',
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at        TIMESTAMPTZ,
  ends_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── leads ────────────────────────────────────────────────────────────────────
CREATE TABLE leads (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name            TEXT NOT NULL,
  phone                TEXT NOT NULL,
  email                TEXT,
  risk_level           risk_level,
  risk_score           NUMERIC(5,2),
  status               lead_status NOT NULL DEFAULT 'new',
  source               TEXT,
  notes                TEXT,
  categories_selected  TEXT[],
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── assessments ──────────────────────────────────────────────────────────────
CREATE TABLE assessments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  risk_level  risk_level NOT NULL,
  risk_score  NUMERIC(5,2) NOT NULL,
  summary     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── assessment_answers ───────────────────────────────────────────────────────
CREATE TABLE assessment_answers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id     UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_id       UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_option_ids UUID[],
  slider_value      NUMERIC(5,2),
  text_answer       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── appointments ─────────────────────────────────────────────────────────────
CREATE TABLE appointments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id             UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  doctor_id           UUID REFERENCES doctors(id) ON DELETE SET NULL,
  service_id          UUID REFERENCES services(id) ON DELETE SET NULL,
  appointment_date    DATE NOT NULL,
  appointment_time    TIME NOT NULL,
  status              appointment_status NOT NULL DEFAULT 'pending',
  notes               TEXT,
  preparation_notice  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── consultation_requests ────────────────────────────────────────────────────
CREATE TABLE consultation_requests (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id                 UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  preferred_callback_time callback_time NOT NULL DEFAULT 'morning',
  question                TEXT,
  status                  consultation_status NOT NULL DEFAULT 'new',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── doctor_responses ────────────────────────────────────────────────────────
CREATE TABLE doctor_responses (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id  UUID NOT NULL REFERENCES consultation_requests(id) ON DELETE CASCADE,
  doctor_id        UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  response_text    TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── crm_notes ────────────────────────────────────────────────────────────────
CREATE TABLE crm_notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note_text   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_consultation_updated_at
  BEFORE UPDATE ON consultation_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Row-Level Security ───────────────────────────────────────────────────────
ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_options         ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors                ENABLE ROW LEVEL SECURITY;
ALTER TABLE services               ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_answers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_responses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_notes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_services        ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role LANGUAGE sql SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Public read: categories, questions, answer_options, doctors, services, promotions
CREATE POLICY "public_read_categories"     ON symptom_categories  FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_questions"      ON questions           FOR SELECT USING (TRUE);
CREATE POLICY "public_read_options"        ON answer_options      FOR SELECT USING (TRUE);
CREATE POLICY "public_read_doctors"        ON doctors             FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_services"       ON services            FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_promotions"     ON promotions          FOR SELECT USING (is_active = TRUE);

-- Leads: anyone can INSERT (lead capture), staff can SELECT/UPDATE
CREATE POLICY "anon_insert_leads"     ON leads FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "staff_select_leads"    ON leads FOR SELECT
  USING (current_user_role() IN ('office_assistant', 'doctor', 'super_admin'));
CREATE POLICY "staff_update_leads"    ON leads FOR UPDATE
  USING (current_user_role() IN ('office_assistant', 'super_admin'));

-- Assessments & answers: anon insert, staff read
CREATE POLICY "anon_insert_assessments"  ON assessments         FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "anon_insert_aa"           ON assessment_answers  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "staff_read_assessments"   ON assessments         FOR SELECT
  USING (current_user_role() IN ('office_assistant', 'doctor', 'super_admin'));

-- Appointments: anon insert, staff manage
CREATE POLICY "anon_insert_appointments" ON appointments FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "staff_manage_appointments" ON appointments FOR ALL
  USING (current_user_role() IN ('office_assistant', 'super_admin'));

-- Consultation requests: anon insert, doctors & staff read
CREATE POLICY "anon_insert_consultations" ON consultation_requests FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "staff_manage_consultations" ON consultation_requests FOR ALL
  USING (current_user_role() IN ('office_assistant', 'doctor', 'super_admin'));

-- Doctor responses: doctors can insert, staff can read
CREATE POLICY "doctor_insert_responses" ON doctor_responses FOR INSERT
  WITH CHECK (current_user_role() IN ('doctor', 'super_admin'));
CREATE POLICY "staff_read_responses" ON doctor_responses FOR SELECT
  USING (current_user_role() IN ('office_assistant', 'doctor', 'super_admin'));

-- CRM notes: staff can manage
CREATE POLICY "staff_manage_crm_notes" ON crm_notes FOR ALL
  USING (current_user_role() IN ('office_assistant', 'super_admin'));

-- Profiles: users see own, admins see all
CREATE POLICY "user_read_own_profile"  ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "admin_read_all_profiles" ON profiles FOR SELECT
  USING (current_user_role() = 'super_admin');
CREATE POLICY "admin_update_profiles"   ON profiles FOR UPDATE
  USING (current_user_role() = 'super_admin');

-- Super admin full CRUD on config tables
CREATE POLICY "admin_manage_categories" ON symptom_categories FOR ALL
  USING (current_user_role() = 'super_admin');
CREATE POLICY "admin_manage_questions"  ON questions FOR ALL
  USING (current_user_role() = 'super_admin');
CREATE POLICY "admin_manage_options"    ON answer_options FOR ALL
  USING (current_user_role() = 'super_admin');
CREATE POLICY "admin_manage_doctors"    ON doctors FOR ALL
  USING (current_user_role() = 'super_admin');
CREATE POLICY "admin_manage_services"   ON services FOR ALL
  USING (current_user_role() = 'super_admin');
CREATE POLICY "admin_manage_promotions" ON promotions FOR ALL
  USING (current_user_role() = 'super_admin');

-- doctor_services: public read, admin manage
CREATE POLICY "public_read_doctor_services" ON doctor_services FOR SELECT USING (TRUE);
CREATE POLICY "admin_manage_doctor_services" ON doctor_services FOR ALL
  USING (current_user_role() = 'super_admin');

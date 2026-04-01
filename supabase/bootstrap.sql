-- SUPERNOVA remote bootstrap
-- Generated file. Run this whole file in Supabase SQL Editor.
-- Source order:
-- 1. schema.sql
-- 2. schema-v2.sql
-- 3. schema-v3.sql
-- 4. schema-v4.sql
-- 5. seed.sql
-- 6. seed-v2.sql
-- 7. seed-v3.sql
-- 8. seed-v4.sql

-- ===== BEGIN schema.sql =====
-- ═══════════════════════════════════════════════════════════════════════════
--  СУПЕРНОВА — Supabase PostgreSQL Schema
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUM types ──────────────────────────────────────────────────────────────
CREATE TYPE user_role          AS ENUM ('patient', 'office_assistant', 'operator', 'organization_consultant', 'doctor', 'super_admin');
CREATE TYPE risk_level         AS ENUM ('low', 'medium', 'high');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE consultation_status AS ENUM ('new', 'assigned', 'answered', 'called', 'closed');
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
  assigned_doctor_id      UUID REFERENCES doctors(id) ON DELETE SET NULL,
  assigned_by             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at             TIMESTAMPTZ,
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

CREATE INDEX idx_consultation_requests_assigned_doctor_id
  ON consultation_requests(assigned_doctor_id);

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

CREATE OR REPLACE FUNCTION assign_consultation_doctor(
  target_consultation_id UUID,
  next_doctor_id UUID
)
RETURNS consultation_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role user_role;
  consultation_row consultation_requests%ROWTYPE;
BEGIN
  actor_role := current_user_role();

  IF actor_role IS NULL OR actor_role NOT IN ('office_assistant', 'super_admin') THEN
    RAISE EXCEPTION 'Only office staff can assign consultations.';
  END IF;

  SELECT *
  INTO consultation_row
  FROM consultation_requests
  WHERE id = target_consultation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consultation not found.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM leads
    WHERE id = consultation_row.lead_id
      AND source = 'organization_consultation_request'
  ) THEN
    RAISE EXCEPTION 'Organization consultations cannot be assigned to doctors.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM doctor_responses
    WHERE consultation_id = target_consultation_id
  ) THEN
    RAISE EXCEPTION 'Doctor has already responded to this consultation.';
  END IF;

  IF consultation_row.status IN ('answered', 'called', 'closed') THEN
    RAISE EXCEPTION 'Answered or closed consultations cannot be reassigned.';
  END IF;

  UPDATE consultation_requests
  SET assigned_doctor_id = next_doctor_id,
      assigned_by = CASE WHEN next_doctor_id IS NULL THEN NULL ELSE auth.uid() END,
      assigned_at = CASE WHEN next_doctor_id IS NULL THEN NULL ELSE NOW() END,
      status = CASE WHEN next_doctor_id IS NULL THEN 'new' ELSE 'assigned' END
  WHERE id = target_consultation_id
  RETURNING *
  INTO consultation_row;

  RETURN consultation_row;
END;
$$;

CREATE OR REPLACE FUNCTION mark_consultation_followup_status(
  target_consultation_id UUID,
  next_status consultation_status
)
RETURNS consultation_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role user_role;
  consultation_row consultation_requests%ROWTYPE;
BEGIN
  actor_role := current_user_role();

  IF actor_role IS NULL OR actor_role NOT IN ('operator', 'super_admin') THEN
    RAISE EXCEPTION 'Only operators can update consultation follow-up status.';
  END IF;

  IF next_status IS NULL OR next_status NOT IN ('called', 'closed') THEN
    RAISE EXCEPTION 'Only called or closed are valid follow-up statuses.';
  END IF;

  SELECT *
  INTO consultation_row
  FROM consultation_requests
  WHERE id = target_consultation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consultation not found.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM leads
    WHERE id = consultation_row.lead_id
      AND source = 'organization_consultation_request'
  ) THEN
    RAISE EXCEPTION 'Organization consultations are handled by organization consultants.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM doctor_responses
    WHERE consultation_id = target_consultation_id
  ) THEN
    RAISE EXCEPTION 'Doctor response is required before operator follow-up.';
  END IF;

  IF consultation_row.status NOT IN ('answered', 'called', 'closed') THEN
    RAISE EXCEPTION 'Only answered consultations can move to operator follow-up.';
  END IF;

  IF consultation_row.status = 'closed' AND next_status <> 'closed' THEN
    RAISE EXCEPTION 'Closed consultations cannot be reopened by operator follow-up.';
  END IF;

  IF consultation_row.status = next_status THEN
    RETURN consultation_row;
  END IF;

  UPDATE consultation_requests
  SET status = next_status
  WHERE id = target_consultation_id
  RETURNING *
  INTO consultation_row;

  RETURN consultation_row;
END;
$$;

CREATE OR REPLACE FUNCTION submit_doctor_consultation_response(
  target_consultation_id UUID,
  response_body TEXT
)
RETURNS TABLE (
  response_id UUID,
  doctor_id UUID,
  response_text TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role user_role;
  actor_doctor_id UUID;
  consultation_row consultation_requests%ROWTYPE;
BEGIN
  actor_role := current_user_role();

  IF actor_role IS NULL OR actor_role NOT IN ('doctor', 'super_admin') THEN
    RAISE EXCEPTION 'Only doctors can submit consultation responses.';
  END IF;

  IF NULLIF(BTRIM(COALESCE(response_body, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Doctor response cannot be empty.';
  END IF;

  SELECT *
  INTO consultation_row
  FROM consultation_requests
  WHERE id = target_consultation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consultation not found.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM leads
    WHERE id = consultation_row.lead_id
      AND source = 'organization_consultation_request'
  ) THEN
    RAISE EXCEPTION 'Organization consultations cannot receive doctor responses.';
  END IF;

  IF actor_role = 'doctor' THEN
    SELECT id
    INTO actor_doctor_id
    FROM doctors
    WHERE profile_id = auth.uid();

    IF actor_doctor_id IS NULL THEN
      RAISE EXCEPTION 'Doctor profile is not linked to this account.';
    END IF;

    IF consultation_row.assigned_doctor_id IS DISTINCT FROM actor_doctor_id THEN
      RAISE EXCEPTION 'This consultation is not assigned to the current doctor.';
    END IF;
  ELSE
    actor_doctor_id := consultation_row.assigned_doctor_id;

    IF actor_doctor_id IS NULL THEN
      RAISE EXCEPTION 'Consultation must be assigned before a doctor response is recorded.';
    END IF;
  END IF;

  IF consultation_row.status <> 'assigned' THEN
    IF EXISTS (
      SELECT 1
      FROM doctor_responses
      WHERE consultation_id = target_consultation_id
    ) THEN
      RAISE EXCEPTION 'This consultation already has a doctor response.';
    END IF;

    RAISE EXCEPTION 'Only assigned consultations can be answered.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM doctor_responses
    WHERE consultation_id = target_consultation_id
  ) THEN
    RAISE EXCEPTION 'This consultation already has a doctor response.';
  END IF;

  INSERT INTO doctor_responses (
    consultation_id,
    doctor_id,
    response_text
  )
  VALUES (
    target_consultation_id,
    actor_doctor_id,
    BTRIM(response_body)
  )
  RETURNING
    doctor_responses.id,
    doctor_responses.doctor_id,
    doctor_responses.response_text,
    doctor_responses.created_at
  INTO response_id, doctor_id, response_text, created_at;

  UPDATE consultation_requests
  SET status = 'answered'
  WHERE id = target_consultation_id;

  RETURN NEXT;
END;
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
  USING (
    current_user_role() = 'super_admin'
    OR (
      current_user_role() = 'organization_consultant'
      AND source = 'organization_consultation_request'
    )
    OR (
      current_user_role() IN ('office_assistant', 'operator', 'doctor')
      AND (source IS NULL OR source <> 'organization_consultation_request')
    )
  );
CREATE POLICY "staff_update_leads"    ON leads FOR UPDATE
  USING (
    current_user_role() = 'super_admin'
    OR (
      current_user_role() = 'organization_consultant'
      AND source = 'organization_consultation_request'
    )
    OR (
      current_user_role() = 'office_assistant'
      AND (source IS NULL OR source <> 'organization_consultation_request')
    )
  )
  WITH CHECK (
    current_user_role() = 'super_admin'
    OR (
      current_user_role() = 'organization_consultant'
      AND source = 'organization_consultation_request'
    )
    OR (
      current_user_role() = 'office_assistant'
      AND (source IS NULL OR source <> 'organization_consultation_request')
    )
  );

-- Assessments & answers: anon insert, staff read
CREATE POLICY "anon_insert_assessments"  ON assessments         FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "anon_insert_aa"           ON assessment_answers  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "staff_read_assessments"   ON assessments         FOR SELECT
  USING (current_user_role() IN ('office_assistant', 'operator', 'doctor', 'super_admin'));

-- Appointments: anon insert, staff manage
CREATE POLICY "anon_insert_appointments" ON appointments FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "staff_manage_appointments" ON appointments FOR ALL
  USING (current_user_role() IN ('office_assistant', 'super_admin'))
  WITH CHECK (current_user_role() IN ('office_assistant', 'super_admin'));
CREATE POLICY "staff_read_appointments" ON appointments FOR SELECT
  USING (current_user_role() IN ('office_assistant', 'operator', 'super_admin'));

-- Consultation requests: anon insert, doctors & staff read
CREATE POLICY "anon_insert_consultations" ON consultation_requests FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "staff_read_consultations" ON consultation_requests FOR SELECT
  USING (
    current_user_role() = 'super_admin'
    OR (
      current_user_role() = 'organization_consultant'
      AND EXISTS (
        SELECT 1
        FROM leads
        WHERE leads.id = consultation_requests.lead_id
          AND leads.source = 'organization_consultation_request'
      )
    )
    OR (
      current_user_role() IN ('office_assistant', 'operator')
      AND EXISTS (
        SELECT 1
        FROM leads
        WHERE leads.id = consultation_requests.lead_id
          AND (leads.source IS NULL OR leads.source <> 'organization_consultation_request')
      )
    )
  );
CREATE POLICY "admin_manage_consultations" ON consultation_requests FOR ALL
  USING (current_user_role() = 'super_admin')
  WITH CHECK (current_user_role() = 'super_admin');
CREATE POLICY "doctor_read_assigned_consultations" ON consultation_requests FOR SELECT
  USING (
    current_user_role() = 'doctor'
    AND EXISTS (
      SELECT 1
      FROM leads
      WHERE leads.id = consultation_requests.lead_id
        AND (leads.source IS NULL OR leads.source <> 'organization_consultation_request')
    )
    AND (
      assigned_doctor_id IN (
        SELECT id FROM doctors WHERE profile_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM doctor_responses dr
        JOIN doctors d ON d.id = dr.doctor_id
        WHERE dr.consultation_id = consultation_requests.id
          AND d.profile_id = auth.uid()
      )
    )
  );

-- Doctor responses: staff and doctors can read
CREATE POLICY "staff_read_responses" ON doctor_responses FOR SELECT
  USING (
    current_user_role() = 'super_admin'
    OR (
      current_user_role() = 'organization_consultant'
      AND EXISTS (
        SELECT 1
        FROM consultation_requests cr
        JOIN leads l ON l.id = cr.lead_id
        WHERE cr.id = doctor_responses.consultation_id
          AND l.source = 'organization_consultation_request'
      )
    )
    OR (
      current_user_role() IN ('office_assistant', 'operator', 'doctor')
      AND EXISTS (
        SELECT 1
        FROM consultation_requests cr
        JOIN leads l ON l.id = cr.lead_id
        WHERE cr.id = doctor_responses.consultation_id
          AND (l.source IS NULL OR l.source <> 'organization_consultation_request')
      )
    )
  );

-- CRM notes: staff can manage
CREATE POLICY "staff_manage_crm_notes" ON crm_notes FOR ALL
  USING (
    current_user_role() = 'super_admin'
    OR (
      current_user_role() = 'organization_consultant'
      AND EXISTS (
        SELECT 1
        FROM leads
        WHERE leads.id = crm_notes.lead_id
          AND leads.source = 'organization_consultation_request'
      )
    )
    OR (
      current_user_role() IN ('office_assistant', 'operator')
      AND EXISTS (
        SELECT 1
        FROM leads
        WHERE leads.id = crm_notes.lead_id
          AND (leads.source IS NULL OR leads.source <> 'organization_consultation_request')
      )
    )
  )
  WITH CHECK (
    current_user_role() = 'super_admin'
    OR (
      current_user_role() = 'organization_consultant'
      AND EXISTS (
        SELECT 1
        FROM leads
        WHERE leads.id = crm_notes.lead_id
          AND leads.source = 'organization_consultation_request'
      )
    )
    OR (
      current_user_role() IN ('office_assistant', 'operator')
      AND EXISTS (
        SELECT 1
        FROM leads
        WHERE leads.id = crm_notes.lead_id
          AND (leads.source IS NULL OR leads.source <> 'organization_consultation_request')
      )
    )
  );

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
-- ===== END schema.sql =====

-- ===== BEGIN schema-v2.sql =====
-- ═══════════════════════════════════════════════════════════════════════════
--  СУПЕРНОВА — Schema v2 Additions
--  Run AFTER schema.sql in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── landing_page_content (CMS key-value store) ───────────────────────────
CREATE TABLE IF NOT EXISTS landing_page_content (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key        TEXT NOT NULL UNIQUE,
  value      TEXT,
  label      TEXT,           -- human-readable label for admin UI
  section    TEXT,           -- 'hero' | 'about' | 'technology' | 'contact' etc.
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE landing_page_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_cms"  ON landing_page_content FOR SELECT USING (TRUE);
CREATE POLICY "admin_manage_cms" ON landing_page_content FOR ALL
  USING (current_user_role() = 'super_admin');

-- ─── service_categories ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  icon       TEXT DEFAULT '🏥',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_svc_cats"  ON service_categories FOR SELECT USING (is_active = TRUE);
CREATE POLICY "admin_manage_svc_cats" ON service_categories FOR ALL
  USING (current_user_role() = 'super_admin');

-- ─── Alter services table ─────────────────────────────────────────────────
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS category_id      UUID REFERENCES service_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS show_on_landing  BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_on_result   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_on_booking  BOOLEAN NOT NULL DEFAULT TRUE;

-- ─── Alter doctors table ──────────────────────────────────────────────────
ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS show_on_landing      BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS available_for_booking BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS schedule_summary      TEXT;

-- ─── service_packages ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_packages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(10,2) NOT NULL DEFAULT 0,
  old_price       NUMERIC(10,2),
  promotion_text  TEXT,
  badge_text      TEXT,
  badge_color     TEXT DEFAULT '#1E63B5',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  show_on_landing BOOLEAN NOT NULL DEFAULT TRUE,
  show_on_result  BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_packages"  ON service_packages FOR SELECT USING (is_active = TRUE);
CREATE POLICY "admin_manage_packages" ON service_packages FOR ALL
  USING (current_user_role() = 'super_admin');

CREATE TRIGGER set_packages_updated_at
  BEFORE UPDATE ON service_packages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── package_services (junction) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS package_services (
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (package_id, service_id)
);

ALTER TABLE package_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_pkg_svcs"  ON package_services FOR SELECT USING (TRUE);
CREATE POLICY "admin_manage_pkg_svcs" ON package_services FOR ALL
  USING (current_user_role() = 'super_admin');

-- ─── Alter promotions to link to packages ─────────────────────────────────
ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES service_packages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS show_on_landing BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_on_result  BOOLEAN NOT NULL DEFAULT TRUE;

-- ─── contact_settings (single-row config) ────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_settings (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone     TEXT DEFAULT '7000 0303',
  address   TEXT DEFAULT 'БЗД 14-р хороо ХӨСҮТ-ийн замын урд ВSB-тэй байрны баруун талаар байран дундуур ороход 1 давхартаа СU-тэй 4 давхар барилга, "СУПЕРНОВА ЭМНЭЛЭГ", Ulaanbaatar, Mongolia',
  email     TEXT DEFAULT 'marketing@supernova.mn',
  map_embed TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contact_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_contact"  ON contact_settings FOR SELECT USING (TRUE);
CREATE POLICY "admin_manage_contact" ON contact_settings FOR ALL
  USING (current_user_role() = 'super_admin');

-- ─── social_links ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_links (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform   TEXT NOT NULL,  -- 'facebook' | 'instagram' | 'youtube'
  url        TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_social"  ON social_links FOR SELECT USING (is_active = TRUE);
CREATE POLICY "admin_manage_social" ON social_links FOR ALL
  USING (current_user_role() = 'super_admin');

-- ─── working_hours ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS working_hours (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_label  TEXT NOT NULL,   -- "Даваа — Баасан"
  open_time  TEXT NOT NULL,   -- "08:00"
  close_time TEXT NOT NULL,   -- "18:00"
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_hours"  ON working_hours FOR SELECT USING (TRUE);
CREATE POLICY "admin_manage_hours" ON working_hours FOR ALL
  USING (current_user_role() = 'super_admin');
-- ===== END schema-v2.sql =====

-- ===== BEGIN schema-v3.sql =====
-- SUPERNOVA admin engine additions
-- Run after schema.sql and schema-v2.sql

-- Audit columns for admin-driven content tables
ALTER TABLE landing_page_content
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE service_categories
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE social_links
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE working_hours
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE symptom_categories
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS show_on_landing BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS help_text TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE answer_options
  ADD COLUMN IF NOT EXISTS recommendation TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS promotion_flag BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS symptom_categories_slug_key
  ON symptom_categories (slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_category_id ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_answer_options_question_id ON answer_options(question_id);
CREATE INDEX IF NOT EXISTS idx_assessments_profile_id ON assessments(profile_id);
CREATE INDEX IF NOT EXISTS idx_leads_status_created_at ON leads(status, created_at DESC);

UPDATE profiles
SET role = 'super_admin', full_name = COALESCE(NULLIF(full_name, ''), 'Supernova Admin')
WHERE LOWER(email) = 'admin@gmail.com';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'promotions_single_target_check'
  ) THEN
    ALTER TABLE promotions
      ADD CONSTRAINT promotions_single_target_check
      CHECK (
        ((service_id IS NOT NULL)::INT + (package_id IS NOT NULL)::INT) = 1
      ) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_landing_page_content_updated_at') THEN
    CREATE TRIGGER set_landing_page_content_updated_at
      BEFORE UPDATE ON landing_page_content
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_service_categories_updated_at') THEN
    CREATE TRIGGER set_service_categories_updated_at
      BEFORE UPDATE ON service_categories
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_social_links_updated_at') THEN
    CREATE TRIGGER set_social_links_updated_at
      BEFORE UPDATE ON social_links
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_working_hours_updated_at') THEN
    CREATE TRIGGER set_working_hours_updated_at
      BEFORE UPDATE ON working_hours
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_doctors_updated_at') THEN
    CREATE TRIGGER set_doctors_updated_at
      BEFORE UPDATE ON doctors
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_services_updated_at') THEN
    CREATE TRIGGER set_services_updated_at
      BEFORE UPDATE ON services
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_promotions_updated_at') THEN
    CREATE TRIGGER set_promotions_updated_at
      BEFORE UPDATE ON promotions
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_symptom_categories_updated_at') THEN
    CREATE TRIGGER set_symptom_categories_updated_at
      BEFORE UPDATE ON symptom_categories
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_questions_updated_at') THEN
    CREATE TRIGGER set_questions_updated_at
      BEFORE UPDATE ON questions
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_answer_options_updated_at') THEN
    CREATE TRIGGER set_answer_options_updated_at
      BEFORE UPDATE ON answer_options
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
-- ===== END schema-v3.sql =====

-- ===== BEGIN schema-v4.sql =====
-- Consultation workflow guards and stricter CRM access

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'consultation_status'
      AND e.enumlabel = 'assigned'
  ) THEN
    ALTER TYPE consultation_status ADD VALUE 'assigned' AFTER 'new';
  END IF;
END $$;

ALTER TABLE consultation_requests
  ADD COLUMN IF NOT EXISTS assigned_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_consultation_requests_assigned_doctor_id
  ON consultation_requests(assigned_doctor_id);

CREATE OR REPLACE FUNCTION assign_consultation_doctor(
  target_consultation_id UUID,
  next_doctor_id UUID
)
RETURNS consultation_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role user_role;
  consultation_row consultation_requests%ROWTYPE;
BEGIN
  actor_role := current_user_role();

  IF actor_role IS NULL OR actor_role NOT IN ('office_assistant', 'super_admin') THEN
    RAISE EXCEPTION 'Only office staff can assign consultations.';
  END IF;

  SELECT *
  INTO consultation_row
  FROM consultation_requests
  WHERE id = target_consultation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consultation not found.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM leads
    WHERE id = consultation_row.lead_id
      AND source = 'organization_consultation_request'
  ) THEN
    RAISE EXCEPTION 'Organization consultations cannot be assigned to doctors.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM doctor_responses
    WHERE consultation_id = target_consultation_id
  ) THEN
    RAISE EXCEPTION 'Doctor has already responded to this consultation.';
  END IF;

  IF consultation_row.status IN ('answered', 'called', 'closed') THEN
    RAISE EXCEPTION 'Answered or closed consultations cannot be reassigned.';
  END IF;

  UPDATE consultation_requests
  SET assigned_doctor_id = next_doctor_id,
      assigned_by = CASE WHEN next_doctor_id IS NULL THEN NULL ELSE auth.uid() END,
      assigned_at = CASE WHEN next_doctor_id IS NULL THEN NULL ELSE NOW() END,
      status = CASE WHEN next_doctor_id IS NULL THEN 'new' ELSE 'assigned' END
  WHERE id = target_consultation_id
  RETURNING *
  INTO consultation_row;

  RETURN consultation_row;
END;
$$;

CREATE OR REPLACE FUNCTION mark_consultation_followup_status(
  target_consultation_id UUID,
  next_status consultation_status
)
RETURNS consultation_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role user_role;
  consultation_row consultation_requests%ROWTYPE;
BEGIN
  actor_role := current_user_role();

  IF actor_role IS NULL OR actor_role NOT IN ('operator', 'super_admin') THEN
    RAISE EXCEPTION 'Only operators can update consultation follow-up status.';
  END IF;

  IF next_status IS NULL OR next_status NOT IN ('called', 'closed') THEN
    RAISE EXCEPTION 'Only called or closed are valid follow-up statuses.';
  END IF;

  SELECT *
  INTO consultation_row
  FROM consultation_requests
  WHERE id = target_consultation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consultation not found.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM leads
    WHERE id = consultation_row.lead_id
      AND source = 'organization_consultation_request'
  ) THEN
    RAISE EXCEPTION 'Organization consultations are handled by organization consultants.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM doctor_responses
    WHERE consultation_id = target_consultation_id
  ) THEN
    RAISE EXCEPTION 'Doctor response is required before operator follow-up.';
  END IF;

  IF consultation_row.status NOT IN ('answered', 'called', 'closed') THEN
    RAISE EXCEPTION 'Only answered consultations can move to operator follow-up.';
  END IF;

  IF consultation_row.status = 'closed' AND next_status <> 'closed' THEN
    RAISE EXCEPTION 'Closed consultations cannot be reopened by operator follow-up.';
  END IF;

  IF consultation_row.status = next_status THEN
    RETURN consultation_row;
  END IF;

  UPDATE consultation_requests
  SET status = next_status
  WHERE id = target_consultation_id
  RETURNING *
  INTO consultation_row;

  RETURN consultation_row;
END;
$$;

CREATE OR REPLACE FUNCTION submit_doctor_consultation_response(
  target_consultation_id UUID,
  response_body TEXT
)
RETURNS TABLE (
  response_id UUID,
  doctor_id UUID,
  response_text TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role user_role;
  actor_doctor_id UUID;
  consultation_row consultation_requests%ROWTYPE;
BEGIN
  actor_role := current_user_role();

  IF actor_role IS NULL OR actor_role NOT IN ('doctor', 'super_admin') THEN
    RAISE EXCEPTION 'Only doctors can submit consultation responses.';
  END IF;

  IF NULLIF(BTRIM(COALESCE(response_body, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Doctor response cannot be empty.';
  END IF;

  SELECT *
  INTO consultation_row
  FROM consultation_requests
  WHERE id = target_consultation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consultation not found.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM leads
    WHERE id = consultation_row.lead_id
      AND source = 'organization_consultation_request'
  ) THEN
    RAISE EXCEPTION 'Organization consultations cannot receive doctor responses.';
  END IF;

  IF actor_role = 'doctor' THEN
    SELECT id
    INTO actor_doctor_id
    FROM doctors
    WHERE profile_id = auth.uid();

    IF actor_doctor_id IS NULL THEN
      RAISE EXCEPTION 'Doctor profile is not linked to this account.';
    END IF;

    IF consultation_row.assigned_doctor_id IS DISTINCT FROM actor_doctor_id THEN
      RAISE EXCEPTION 'This consultation is not assigned to the current doctor.';
    END IF;
  ELSE
    actor_doctor_id := consultation_row.assigned_doctor_id;

    IF actor_doctor_id IS NULL THEN
      RAISE EXCEPTION 'Consultation must be assigned before a doctor response is recorded.';
    END IF;
  END IF;

  IF consultation_row.status <> 'assigned' THEN
    IF EXISTS (
      SELECT 1
      FROM doctor_responses
      WHERE consultation_id = target_consultation_id
    ) THEN
      RAISE EXCEPTION 'This consultation already has a doctor response.';
    END IF;

    RAISE EXCEPTION 'Only assigned consultations can be answered.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM doctor_responses
    WHERE consultation_id = target_consultation_id
  ) THEN
    RAISE EXCEPTION 'This consultation already has a doctor response.';
  END IF;

  INSERT INTO doctor_responses (
    consultation_id,
    doctor_id,
    response_text
  )
  VALUES (
    target_consultation_id,
    actor_doctor_id,
    BTRIM(response_body)
  )
  RETURNING
    doctor_responses.id,
    doctor_responses.doctor_id,
    doctor_responses.response_text,
    doctor_responses.created_at
  INTO response_id, doctor_id, response_text, created_at;

  UPDATE consultation_requests
  SET status = 'answered'
  WHERE id = target_consultation_id;

  RETURN NEXT;
END;
$$;

DROP POLICY IF EXISTS "staff_update_leads" ON leads;
CREATE POLICY "staff_update_leads" ON leads FOR UPDATE
  USING (
    current_user_role() = 'super_admin'
    OR (
      current_user_role() = 'organization_consultant'
      AND source = 'organization_consultation_request'
    )
    OR (
      current_user_role() = 'office_assistant'
      AND (source IS NULL OR source <> 'organization_consultation_request')
    )
  )
  WITH CHECK (
    current_user_role() = 'super_admin'
    OR (
      current_user_role() = 'organization_consultant'
      AND source = 'organization_consultation_request'
    )
    OR (
      current_user_role() = 'office_assistant'
      AND (source IS NULL OR source <> 'organization_consultation_request')
    )
  );

DROP POLICY IF EXISTS "staff_manage_appointments" ON appointments;
CREATE POLICY "staff_manage_appointments" ON appointments FOR ALL
  USING (current_user_role() IN ('office_assistant', 'super_admin'))
  WITH CHECK (current_user_role() IN ('office_assistant', 'super_admin'));

DROP POLICY IF EXISTS "staff_read_appointments" ON appointments;
CREATE POLICY "staff_read_appointments" ON appointments FOR SELECT
  USING (current_user_role() IN ('office_assistant', 'operator', 'super_admin'));

DROP POLICY IF EXISTS "staff_manage_consultations" ON consultation_requests;
DROP POLICY IF EXISTS "staff_read_consultations" ON consultation_requests;
DROP POLICY IF EXISTS "admin_manage_consultations" ON consultation_requests;
DROP POLICY IF EXISTS "doctor_read_assigned_consultations" ON consultation_requests;
DROP POLICY IF EXISTS "doctor_update_assigned_consultations" ON consultation_requests;

CREATE POLICY "staff_read_consultations" ON consultation_requests FOR SELECT
  USING (
    current_user_role() = 'super_admin'
    OR (
      current_user_role() = 'organization_consultant'
      AND EXISTS (
        SELECT 1
        FROM leads
        WHERE leads.id = consultation_requests.lead_id
          AND leads.source = 'organization_consultation_request'
      )
    )
    OR (
      current_user_role() IN ('office_assistant', 'operator')
      AND EXISTS (
        SELECT 1
        FROM leads
        WHERE leads.id = consultation_requests.lead_id
          AND (leads.source IS NULL OR leads.source <> 'organization_consultation_request')
      )
    )
  );

CREATE POLICY "admin_manage_consultations" ON consultation_requests FOR ALL
  USING (current_user_role() = 'super_admin')
  WITH CHECK (current_user_role() = 'super_admin');

CREATE POLICY "doctor_read_assigned_consultations" ON consultation_requests FOR SELECT
  USING (
    current_user_role() = 'doctor'
    AND EXISTS (
      SELECT 1
      FROM leads
      WHERE leads.id = consultation_requests.lead_id
        AND (leads.source IS NULL OR leads.source <> 'organization_consultation_request')
    )
    AND (
      assigned_doctor_id IN (
        SELECT id FROM doctors WHERE profile_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM doctor_responses dr
        JOIN doctors d ON d.id = dr.doctor_id
        WHERE dr.consultation_id = consultation_requests.id
          AND d.profile_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "doctor_insert_responses" ON doctor_responses;
-- ===== END schema-v4.sql =====

-- ===== BEGIN seed.sql =====
-- ═══════════════════════════════════════════════════════════════════════════
--  СУПЕРНОВА — Seed Data
--  Run AFTER schema.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Symptom Categories ───────────────────────────────────────────────────────
INSERT INTO symptom_categories (name, name_en, icon, description, sort_order) VALUES
  ('Зүрх',                    'Heart',          '❤️',  'Зүрх, цусны эргэлттэй холбоотой зовиурууд',         1),
  ('Даралт',                  'Blood Pressure', '🩺',  'Цусны даралт, тархины судасны зовиурууд',            2),
  ('Ходоод',                  'Stomach',        '🫃',  'Хоол боловсруулах замын зовиурууд',                  3),
  ('Элэг',                    'Liver',          '🫀',  'Элэг, цөсний зовиурууд',                             4),
  ('Бөөр',                    'Kidney',         '🫘',  'Бөөр, шээсний замын зовиурууд',                      5),
  ('Бамбай булчирхай',        'Thyroid',        '🦋',  'Бамбай булчирхайн зовиурууд',                        6),
  ('Эмэгтэйчүүд',             'Women',          '🌸',  'Эмэгтэйчүүдийн эрүүл мэндийн зовиурууд',            7),
  ('Яс үе',                   'Bones & Joints', '🦴',  'Яс, үе мөч, нуруу, булчингийн зовиурууд',           8),
  ('Хоол боловсруулах эрхтэн','Digestive',      '🌡️',  'Гэдэс, хоол боловсруулах дэлгэрэнгүй зовиурууд',    9),
  ('Даавар',                  'Hormones',       '⚗️',  'Дааврын зохицуулалттай холбоотой зовиурууд',         10);

-- ─── Questions for Зүрх (Heart) ───────────────────────────────────────────────
WITH cat AS (SELECT id FROM symptom_categories WHERE name_en = 'Heart' LIMIT 1)
INSERT INTO questions (category_id, question_text, question_type, sort_order, risk_weight) VALUES
  ((SELECT id FROM cat), 'Цээжний өвдөлт мэдрэгдэж байна уу?',                    'single', 1, 2.0),
  ((SELECT id FROM cat), 'Зүрх тогтмол бус дэлсэж, эсвэл тасарч мэдрэгдэж байна уу?', 'single', 2, 1.5),
  ((SELECT id FROM cat), 'Хөл, гар хавдаж байна уу?',                              'single', 3, 1.0),
  ((SELECT id FROM cat), 'Амьсгаадах, хурдан ядрах тохиолдол байна уу?',           'single', 4, 1.5),
  ((SELECT id FROM cat), 'Зовиур хэдэн хоногийн өмнөөс эхэлсэн бэ?',              'single', 5, 1.0);

-- ─── Questions for Даралт (Blood Pressure) ───────────────────────────────────
WITH cat AS (SELECT id FROM symptom_categories WHERE name_en = 'Blood Pressure' LIMIT 1)
INSERT INTO questions (category_id, question_text, question_type, sort_order, risk_weight) VALUES
  ((SELECT id FROM cat), 'Толгой өвдөх, эргэх мэдрэгдэж байна уу?',              'single', 1, 1.5),
  ((SELECT id FROM cat), 'Даралтаа хэмжиж байна уу? Хэдэн mm/Hg байна вэ?',      'text',   2, 1.0),
  ((SELECT id FROM cat), 'Нүд бүдгэрэх, харанхуйлах тохиолдол байна уу?',        'single', 3, 2.0),
  ((SELECT id FROM cat), 'Тэнцвэр алдах, унах дөхсөн мэдрэмж байна уу?',         'single', 4, 2.0),
  ((SELECT id FROM cat), 'Зовиур өдрийн аль цагт хурцддаг вэ?',                  'single', 5, 0.5);

-- ─── Questions for Ходоод (Stomach) ──────────────────────────────────────────
WITH cat AS (SELECT id FROM symptom_categories WHERE name_en = 'Stomach' LIMIT 1)
INSERT INTO questions (category_id, question_text, question_type, sort_order, risk_weight) VALUES
  ((SELECT id FROM cat), 'Хэвлийн өвдөлт байна уу? Хаана байрладаг вэ?',         'single', 1, 1.5),
  ((SELECT id FROM cat), 'Дотор муухайрах, бөөлжих тохиолдол байна уу?',         'single', 2, 1.0),
  ((SELECT id FROM cat), 'Суулгах, өтгөн хаталт байна уу?',                      'single', 3, 1.0),
  ((SELECT id FROM cat), 'Хоол идсэний дараа өвдөлт нэмэгдэж байна уу?',         'single', 4, 1.5),
  ((SELECT id FROM cat), 'Цус бүхий ялгадас гарч байна уу?',                     'single', 5, 3.0);

-- ─── Answer options for first question of each category ──────────────────────
-- (Simplified; full admin CRUD will handle the rest)
WITH q AS (
  SELECT id FROM questions
  WHERE question_text = 'Цээжний өвдөлт мэдрэгдэж байна уу?' LIMIT 1
)
INSERT INTO answer_options (question_id, option_text, risk_score, sort_order) VALUES
  ((SELECT id FROM q), 'Тийм, байнга',                        3.0, 1),
  ((SELECT id FROM q), 'Заримдаа',                            1.5, 2),
  ((SELECT id FROM q), 'Биеийн хөдөлгөөнтэй холбоотойгоор',  2.0, 3),
  ((SELECT id FROM q), 'Үгүй',                                0.0, 4);

WITH q AS (
  SELECT id FROM questions
  WHERE question_text = 'Зүрх тогтмол бус дэлсэж, эсвэл тасарч мэдрэгдэж байна уу?' LIMIT 1
)
INSERT INTO answer_options (question_id, option_text, risk_score, sort_order) VALUES
  ((SELECT id FROM q), 'Тийм, байнга',    3.0, 1),
  ((SELECT id FROM q), 'Заримдаа',        1.5, 2),
  ((SELECT id FROM q), 'Үгүй',            0.0, 3);

-- ─── Doctors ──────────────────────────────────────────────────────────────────
INSERT INTO doctors (full_name, title, specialization, experience_years, bio, photo_url, sort_order) VALUES
  ('Б. Баясгалан',    'Эмч', 'Хоол боловсруулахын дурангийн эмч (Гастроэнтеролог)', 10,
   'Ходоод, гэдэс, арван хоёр нугасны дурангийн шинжилгээ болон хоол боловсруулах замын өвчний оношлогоо, эмчилгээнд мэргэжилтэй.',
   '/doctors/bayasgalan.jpg', 1),
  ('Б. Будсүрэн',     'Эмч', 'Дотрын өвчний эмч (Терапевт)',                       15,
   'Дотрын өвчний иж бүрэн оношлогоо, Японы стандартын дагуу эрүүл мэндийн бүрэн үзлэг хийдэг туршлагатай эмч.',
   '/doctors/budsuren.jpg', 2),
  ('Г. Батцэцэг',     'Эмч', 'Зүрх судасны эмч (Кардиолог)',                       12,
   'Зүрх судасны өвчний оношлогоо, ЭКГ, ЭХО зүрхний шинжилгээ болон зүрхний хэм алдагдлын эмчилгээнд мэргэжилтэй.',
   '/doctors/battsetseg.jpg', 3),
  ('Д. Номин-эрдэнэ', 'Эмч', 'Дүрс оношилгооны эмч (Рентген / Хэт авиа / MRI)',   8,
   'Хэт авианы шинжилгээ, рентген болон дэвшилтэт дүрс оношилгооны аргуудыг ашиглан нарийн оношлогоо хийдэг.',
   '/doctors/nomin.jpg', 4);

-- ─── Services ─────────────────────────────────────────────────────────────────
INSERT INTO services (name, description, price, duration_minutes, preparation_notice, sort_order) VALUES
  ('Зүрхний иж бүрэн шинжилгээ',
   'ЭКГ, ЭХО зүрх, цусны даралтын 24 цагийн хяналт зэргийг багтаасан иж бүрэн шинжилгээ.',
   150000, 90, 'Шинжилгээнд ирэхийн өмнө 4 цаг өлөн байна уу.', 1),
  ('Ходоод, гэдэсний дуран',
   'Японы дэвшилтэт тоног төхөөрөмжөөр ходоод, арван хоёр нугас, гэдэсний дурангийн шинжилгээ.',
   200000, 60, 'Шинжилгээнд ирэхийн өмнөх өдрийн орой 18:00 цагаас хойш хоол идэхгүй байна уу.', 2),
  ('Элэгний иж бүрэн шинжилгээ',
   'Хэт авианы шинжилгээ болон цусны шинжилгээгээр элэгний функцийг иж бүрэн шалгана.',
   120000, 60, 'Шинжилгээний өдөр өглөө өлөн ирнэ үү.', 3),
  ('Бөөрний шинжилгээ',
   'Бөөр, шээс ялгаруулах замын хэт авианы болон лабораторийн шинжилгээ.',
   100000, 45, 'Шинжилгээнд ирэхийн өмнө их ус уусан байна уу.', 4),
  ('Бамбай булчирхайн шинжилгээ',
   'Хэт авианы шинжилгээ болон гормоны цусны шинжилгээ.',
   110000, 45, NULL, 5),
  ('Эмэгтэйчүүдийн иж бүрэн шинжилгээ',
   'Умайн хүзүүний шинжилгээ, хэт авианы шинжилгээ болон гормоны профайл.',
   180000, 90, NULL, 6),
  ('Яс нягтралын шинжилгээ (DEXA)',
   'Яс нягтрал, остеопорозын эрт оношлогоо.',
   130000, 30, NULL, 7),
  ('Иж бүрэн эрүүл мэндийн үзлэг',
   'Дотрын эмчийн үзлэг, цусны ерөнхий, биохими, шээсний шинжилгээ, рентген, ЭКГ багтсан.',
   350000, 180, 'Шинжилгээний өдөр өглөө өлөн ирнэ үү.', 8);

-- ─── Promotions ───────────────────────────────────────────────────────────────
WITH svc AS (SELECT id FROM services WHERE name = 'Иж бүрэн эрүүл мэндийн үзлэг' LIMIT 1)
INSERT INTO promotions (service_id, title, description, discount_percent, free_gift, badge_text, badge_color, is_active) VALUES
  ((SELECT id FROM svc),
   '2026 оны Эрүүл мэндийн сар',
   'Иж бүрэн үзлэгт 20% хөнгөлөлт + витаминний иж бүрдэл бэлэг болгон.',
   20,
   'Витамины иж бүрдэл (D3+B12+Omega3)',
   '20% ХӨНГӨЛӨЛТ',
   '#E8323F',
   TRUE);

WITH svc AS (SELECT id FROM services WHERE name = 'Зүрхний иж бүрэн шинжилгээ' LIMIT 1)
INSERT INTO promotions (service_id, title, description, discount_amount, badge_text, badge_color, is_active) VALUES
  ((SELECT id FROM svc),
   'Зүрхний шинжилгээний урамшуулал',
   'Зүрхний иж бүрэн шинжилгээнд ЭКГ шинжилгээ үнэгүй хамт.',
   0,
   'ЭКГ ҮНЭГҮЙ',
   '#1E63B5',
   TRUE);
-- ===== END seed.sql =====

-- ===== BEGIN seed-v2.sql =====
-- ═══════════════════════════════════════════════════════════════════════════
--  СУПЕРНОВА — Seed v2
--  Run AFTER schema-v2.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Landing Page CMS Content ─────────────────────────────────────────────
INSERT INTO landing_page_content (key, value, label, section) VALUES
  ('hero_title',      'Таны эрүүл мэнд — бидний нэн тэргүүний зорилго', 'Hero гарчиг',        'hero'),
  ('hero_subtitle',   'Японы стандартын дагуу иж бүрэн эрүүл мэндийн шинжилгээ хийлгэж, эрт оношлогоо, зөв эмчилгээний чиглэл авна уу.', 'Hero тайлбар', 'hero'),
  ('hero_cta_text',   'Шинжилгээ эхлэх',                                'Hero CTA товч',      'hero'),
  ('hero_badge',      'Монголын анхны Японы жишиг оношлогооны эмнэлэг', 'Hero badge текст',   'hero'),

  ('about_title',     'Япон улсын жишгийн дагуу тусалдаг эмнэлэг',     'Тухай гарчиг',       'about'),
  ('about_text',      'Супернова эмнэлэг нь Японы стандартын дагуу иж бүрэн оношлогооны үйлчилгээ үзүүлэх зорилгоор байгуулагдсан. Японы брэндийн тоног төхөөрөмж, протоколыг ашигладаг. Манай 10 гаруй мэргэшсэн эмч нар олон улсын сургалтад хамрагдан, тасралтгүй мэдлэгоо дээшлүүлж байдаг.', 'Тухай текст', 'about'),
  ('about_vision',    'Монгол хүн бүрт чанартай, найдвартай эрүүл мэндийн шинжилгээ хийлгэх боломж олгох.', 'Алсын харааc', 'about'),

  ('tech_title',      'Дэвшилтэт тоног төхөөрөмж',                     'Технологи гарчиг',   'technology'),
  ('tech_subtitle',   'Японы тэргүүлэх брэндийн тоног төхөөрөмжийг ашиглан нарийвчлалтай шинжилгээ хийдэг.', 'Технологи тайлбар', 'technology'),
  ('tech_brands',     'Olympus, Hitachi, Fukuda Denshi',                 'Брэндүүд',           'technology'),

  ('privacy_text',    'Таны мэдээлэл аюулгүй хадгалагдаж, зөвхөн эмнэлгийн үйлчилгээний зорилгоор ашиглагдана.', 'Нууцлалын текст', 'trust'),
  ('cta_free_consult','Анхны үзлэг — 15 минутын утасны зөвлөгөө ҮНЭГҮЙ', 'CTA санал текст',  'cta')
ON CONFLICT (key) DO NOTHING;

-- ─── Contact Settings ─────────────────────────────────────────────────────
INSERT INTO contact_settings (phone, address, email) VALUES
  ('7000 0303', 'БЗД 14-р хороо ХӨСҮТ-ийн замын урд ВSB-тэй байрны баруун талаар байран дундуур ороход 1 давхартаа СU-тэй 4 давхар барилга, "СУПЕРНОВА ЭМНЭЛЭГ", Ulaanbaatar, Mongolia', 'marketing@supernova.mn')
ON CONFLICT DO NOTHING;

-- ─── Social Links ─────────────────────────────────────────────────────────
INSERT INTO social_links (platform, url, sort_order) VALUES
  ('facebook',  'https://facebook.com/supernovamn',  1),
  ('instagram', 'https://instagram.com/supernovamn', 2),
  ('youtube',   'https://youtube.com/@supernovamn',  3)
ON CONFLICT DO NOTHING;

-- ─── Working Hours ────────────────────────────────────────────────────────
INSERT INTO working_hours (day_label, open_time, close_time, sort_order) VALUES
  ('Даваа — Баасан', '08:00', '18:00', 1),
  ('Бямба',          '09:00', '14:00', 2),
  ('Ням',            '09:00', '13:00', 3)
ON CONFLICT DO NOTHING;

-- ─── Service Categories ───────────────────────────────────────────────────
INSERT INTO service_categories (name, icon, sort_order) VALUES
  ('Зүрх судасны',        '❤️',  1),
  ('Хоол боловсруулах',   '🔬',  2),
  ('Дотрын',              '🫀',  3),
  ('Бөөр, шээсний',       '🫘',  4),
  ('Дааврын',             '🦋',  5),
  ('Эмэгтэйчүүдийн',      '🌸',  6),
  ('Яс, үе мөч',          '🦴',  7),
  ('Дүрс оношилгоо',      '📡',  8),
  ('Иж бүрэн үзлэг',      '🏥',  9)
ON CONFLICT DO NOTHING;

-- ─── Service Packages ─────────────────────────────────────────────────────
INSERT INTO service_packages (title, description, price, old_price, promotion_text, badge_text, badge_color, show_on_landing, show_on_result, sort_order) VALUES
  (
    'Иж бүрэн эрүүл мэндийн багц',
    'Дотрын эмчийн үзлэг, цусны ерөнхий болон биохими, шээсний шинжилгээ, ЭКГ, рентген зэргийг багтаасан иж бүрэн шинжилгээний багц.',
    299000, 420000,
    '20% хөнгөлөлт + витамин бэлэг',
    'Хамгийн их эрэлттэй', '#1E63B5',
    TRUE, TRUE, 1
  ),
  (
    'Зүрх судасны иж бүрэн багц',
    'ЭКГ, ЭХО зүрх, 24 цагийн даралтын хяналт, холестерин болон зүрхний эрсдэлийн шинжилгээ.',
    250000, 320000,
    'ЭКГ шинжилгээ үнэгүй',
    'Зүрхний мэргэжил', '#E8323F',
    TRUE, TRUE, 2
  ),
  (
    'Хоол боловсруулахын багц',
    'Ходоодны дуран, гэдэсний шинжилгээ, элэгний хэт авиа, цусны биохими багтсан.',
    220000, 290000,
    NULL,
    NULL, '#059669',
    TRUE, FALSE, 3
  ),
  (
    'Эмэгтэйчүүдийн иж бүрэн багц',
    'Умайн хүзүүний шинжилгээ, хэт авиа, гормоны профайл, остеопороз шинжилгээ.',
    280000, 360000,
    '15% хөнгөлөлт',
    'Эмэгтэйчүүдэд', '#7C3AED',
    TRUE, TRUE, 4
  ),
  (
    'Урьдчилан сэргийлэх багц',
    'Жил бүр хийлгэх үзлэг: цусны ерөнхий, рентген, ЭКГ, шээсний, дотрын эмчийн үзлэг.',
    180000, 230000,
    NULL,
    'Онцлох санал', '#F59E0B',
    TRUE, FALSE, 5
  )
ON CONFLICT DO NOTHING;

-- ─── Link packages to services (after both are seeded) ────────────────────
-- This links the Иж бүрэн багц to relevant services
DO $$
DECLARE
  pkg_full UUID;
  pkg_heart UUID;
  svc_heart UUID;
  svc_gastro UUID;
  svc_liver UUID;
  svc_full UUID;
BEGIN
  SELECT id INTO pkg_full  FROM service_packages WHERE title LIKE 'Иж бүрэн эрүүл%' LIMIT 1;
  SELECT id INTO pkg_heart FROM service_packages WHERE title LIKE 'Зүрх судасны%'   LIMIT 1;
  SELECT id INTO svc_heart  FROM services WHERE name LIKE 'Зүрхний%'   LIMIT 1;
  SELECT id INTO svc_gastro FROM services WHERE name LIKE 'Ходоод%'    LIMIT 1;
  SELECT id INTO svc_liver  FROM services WHERE name LIKE 'Элэгний%'   LIMIT 1;
  SELECT id INTO svc_full   FROM services WHERE name LIKE 'Иж бүрэн%'  LIMIT 1;

  IF pkg_full IS NOT NULL AND svc_heart IS NOT NULL THEN
    INSERT INTO package_services (package_id, service_id) VALUES (pkg_full, svc_heart) ON CONFLICT DO NOTHING;
  END IF;
  IF pkg_full IS NOT NULL AND svc_gastro IS NOT NULL THEN
    INSERT INTO package_services (package_id, service_id) VALUES (pkg_full, svc_gastro) ON CONFLICT DO NOTHING;
  END IF;
  IF pkg_full IS NOT NULL AND svc_liver IS NOT NULL THEN
    INSERT INTO package_services (package_id, service_id) VALUES (pkg_full, svc_liver) ON CONFLICT DO NOTHING;
  END IF;
  IF pkg_heart IS NOT NULL AND svc_heart IS NOT NULL THEN
    INSERT INTO package_services (package_id, service_id) VALUES (pkg_heart, svc_heart) ON CONFLICT DO NOTHING;
  END IF;
END $$;
-- ===== END seed-v2.sql =====

-- ===== BEGIN seed-v3.sql =====
-- SUPERNOVA admin engine seed additions
-- Run after seed.sql, seed-v2.sql, and schema-v3.sql

UPDATE services
SET promotion_flag = TRUE
WHERE name ILIKE '%иж бүрэн%'
   OR name ILIKE '%зүрх%'
   OR name ILIKE '%эмэгтэй%';

UPDATE symptom_categories
SET slug = CASE name
  WHEN 'Зүрх' THEN 'zurh'
  WHEN 'Даралт' THEN 'daralt'
  WHEN 'Ходоод' THEN 'hodood'
  WHEN 'Элэг' THEN 'eleg'
  WHEN 'Бөөр' THEN 'boor'
  WHEN 'Бамбай булчирхай' THEN 'bambai'
  WHEN 'Эмэгтэйчүүд' THEN 'emegteichuud'
  WHEN 'Яс үе' THEN 'yas-ue'
  WHEN 'Хоол боловсруулах эрхтэн' THEN 'hool-bolovsruulah'
  WHEN 'Даавар' THEN 'daavar'
  ELSE slug
END
WHERE slug IS NULL;

UPDATE questions
SET is_active = TRUE
WHERE is_active IS DISTINCT FROM TRUE;

UPDATE answer_options
SET is_active = TRUE
WHERE is_active IS DISTINCT FROM TRUE;

INSERT INTO landing_page_content (key, value, label, section)
VALUES
  ('vision_title', 'Бидний алсын хараа', 'Алсын харааны гарчиг', 'values'),
  ('vision_body', 'Япон улсын жишигт нийцсэн, итгэл төрүүлэхүйц эрт оношилгоог Монгол хүн бүрт ойртуулах.', 'Алсын харааны тайлбар', 'values'),
  ('value_1_title', 'Японы стандарт', 'Үнэт зүйл 1 гарчиг', 'values'),
  ('value_1_body', 'Оношилгоо, үйлчилгээ, тайлангийн урсгал бүр чанарын хяналттай ажиллана.', 'Үнэт зүйл 1 тайлбар', 'values'),
  ('value_2_title', 'Нууцлал ба аюулгүй байдал', 'Үнэт зүйл 2 гарчиг', 'values'),
  ('value_2_body', 'Өвчтөний мэдээлэл зөвхөн эмнэлгийн үйлчилгээ, follow-up, CRM хяналтын зорилгоор ашиглагдана.', 'Үнэт зүйл 2 тайлбар', 'values'),
  ('value_3_title', 'Эрт илрүүлэлтэд төвлөрсөн үйлчилгээ', 'Үнэт зүйл 3 гарчиг', 'values'),
  ('value_3_body', 'Дижитал асуулга, эмчийн цаг, үнэгүй зөвлөгөө, CRM хяналт нэг урсгалаар ажиллана.', 'Үнэт зүйл 3 тайлбар', 'values'),
  ('privacy_notice', 'Таны мэдээлэл аюулгүй хадгалагдаж, зөвхөн эмнэлгийн үйлчилгээний зорилгоор ашиглагдана.', 'Нууцлалын мэдэгдэл', 'trust'),
  ('contact_title', 'Холбоо барих', 'Холбоо барих гарчиг', 'contact'),
  ('result_low_label', 'Бага эрсдэл', 'Low label', 'result'),
  ('result_low_message', 'Одоогийн байдлаар яаралтай эрсдэл харагдсангүй. Урьдчилан сэргийлэх үзлэгээ тогтмол хийлгээрэй.', 'Low message', 'result'),
  ('result_low_urgency', 'Ойрын 1-2 долоо хоногт', 'Low urgency', 'result'),
  ('result_medium_label', 'Дунд эрсдэл', 'Medium label', 'result'),
  ('result_medium_message', 'Эрт үзлэг, нарийвчилсан оношилгоо хийлгэвэл эрсдэлийг эрт хянах боломжтой.', 'Medium message', 'result'),
  ('result_medium_urgency', 'Ойрын 3-7 хоногт', 'Medium urgency', 'result'),
  ('result_high_label', 'Өндөр эрсдэл', 'High label', 'result'),
  ('result_high_message', 'Таны хариулт эмчийн үнэлгээ, нэмэлт шинжилгээ шаардлагатайг илтгэж байна.', 'High message', 'result'),
  ('result_high_urgency', 'Өнөөдөр эсвэл маргааш', 'High urgency', 'result')
ON CONFLICT (key) DO NOTHING;
-- ===== END seed-v3.sql =====

-- ===== BEGIN seed-v4.sql =====
-- SUPERNOVA data backfill
-- Run after seed-v3.sql

-- Fix service category relationships so public/admin modules can use real joins.
UPDATE services AS services
SET category_id = categories.id
FROM service_categories AS categories
WHERE services.name = 'Зүрхний иж бүрэн шинжилгээ'
  AND categories.name = 'Зүрх судасны'
  AND services.category_id IS DISTINCT FROM categories.id;

UPDATE services AS services
SET category_id = categories.id
FROM service_categories AS categories
WHERE services.name = 'Ходоод, гэдэсний дуран'
  AND categories.name = 'Хоол боловсруулах'
  AND services.category_id IS DISTINCT FROM categories.id;

UPDATE services AS services
SET category_id = categories.id
FROM service_categories AS categories
WHERE services.name = 'Элэгний иж бүрэн шинжилгээ'
  AND categories.name = 'Хоол боловсруулах'
  AND services.category_id IS DISTINCT FROM categories.id;

UPDATE services AS services
SET category_id = categories.id
FROM service_categories AS categories
WHERE services.name = 'Бөөрний шинжилгээ'
  AND categories.name = 'Бөөр, шээсний'
  AND services.category_id IS DISTINCT FROM categories.id;

UPDATE services AS services
SET category_id = categories.id
FROM service_categories AS categories
WHERE services.name = 'Бамбай булчирхайн шинжилгээ'
  AND categories.name = 'Дааврын'
  AND services.category_id IS DISTINCT FROM categories.id;

UPDATE services AS services
SET category_id = categories.id
FROM service_categories AS categories
WHERE services.name = 'Эмэгтэйчүүдийн иж бүрэн шинжилгээ'
  AND categories.name = 'Эмэгтэйчүүдийн'
  AND services.category_id IS DISTINCT FROM categories.id;

UPDATE services AS services
SET category_id = categories.id
FROM service_categories AS categories
WHERE services.name = 'Яс нягтралын шинжилгээ (DEXA)'
  AND categories.name = 'Яс, үе мөч'
  AND services.category_id IS DISTINCT FROM categories.id;

UPDATE services AS services
SET category_id = categories.id
FROM service_categories AS categories
WHERE services.name = 'Иж бүрэн эрүүл мэндийн үзлэг'
  AND categories.name = 'Иж бүрэн үзлэг'
  AND services.category_id IS DISTINCT FROM categories.id;

UPDATE services
SET show_on_result = TRUE
WHERE is_active = TRUE
  AND show_on_result IS DISTINCT FROM TRUE;

-- Link doctors to the services they can actually handle.
INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Ходоод, гэдэсний дуран'
WHERE doctors.full_name = 'Б. Баясгалан'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Элэгний иж бүрэн шинжилгээ'
WHERE doctors.full_name = 'Б. Баясгалан'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Иж бүрэн эрүүл мэндийн үзлэг'
WHERE doctors.full_name = 'Б. Баясгалан'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Иж бүрэн эрүүл мэндийн үзлэг'
WHERE doctors.full_name = 'Б. Будсүрэн'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Бөөрний шинжилгээ'
WHERE doctors.full_name = 'Б. Будсүрэн'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Бамбай булчирхайн шинжилгээ'
WHERE doctors.full_name = 'Б. Будсүрэн'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Зүрхний иж бүрэн шинжилгээ'
WHERE doctors.full_name = 'Г. Батцэцэг'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Иж бүрэн эрүүл мэндийн үзлэг'
WHERE doctors.full_name = 'Г. Батцэцэг'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Элэгний иж бүрэн шинжилгээ'
WHERE doctors.full_name = 'Д. Номин-эрдэнэ'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Бөөрний шинжилгээ'
WHERE doctors.full_name = 'Д. Номин-эрдэнэ'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Бамбай булчирхайн шинжилгээ'
WHERE doctors.full_name = 'Д. Номин-эрдэнэ'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Эмэгтэйчүүдийн иж бүрэн шинжилгээ'
WHERE doctors.full_name = 'Д. Номин-эрдэнэ'
ON CONFLICT DO NOTHING;

INSERT INTO doctor_services (doctor_id, service_id)
SELECT doctors.id, services.id
FROM doctors
JOIN services ON services.name = 'Яс нягтралын шинжилгээ (DEXA)'
WHERE doctors.full_name = 'Д. Номин-эрдэнэ'
ON CONFLICT DO NOTHING;

-- Backfill diagnosis so all seeded categories work in the public flow.
CREATE OR REPLACE FUNCTION public.seed_question_with_options(
  p_category_name TEXT,
  p_question_text TEXT,
  p_sort_order INTEGER,
  p_risk_weight NUMERIC,
  p_option_texts TEXT[],
  p_option_scores NUMERIC[]
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_category_id UUID;
  v_question_id UUID;
  v_option_id UUID;
  v_index INTEGER;
BEGIN
  IF COALESCE(array_length(p_option_texts, 1), 0) = 0 THEN
    RETURN;
  END IF;

  SELECT id
  INTO v_category_id
  FROM symptom_categories
  WHERE name = p_category_name
  LIMIT 1;

  IF v_category_id IS NULL THEN
    RETURN;
  END IF;

  SELECT id
  INTO v_question_id
  FROM questions
  WHERE category_id = v_category_id
    AND question_text = p_question_text
  LIMIT 1;

  IF v_question_id IS NULL THEN
    INSERT INTO questions (
      category_id,
      question_text,
      question_type,
      sort_order,
      is_required,
      is_active,
      risk_weight
    )
    VALUES (
      v_category_id,
      p_question_text,
      'single',
      p_sort_order,
      TRUE,
      TRUE,
      p_risk_weight
    )
    RETURNING id INTO v_question_id;
  ELSE
    UPDATE questions
    SET question_type = 'single',
        sort_order = p_sort_order,
        is_required = TRUE,
        is_active = TRUE,
        risk_weight = p_risk_weight
    WHERE id = v_question_id;
  END IF;

  FOR v_index IN 1..array_length(p_option_texts, 1) LOOP
    SELECT id
    INTO v_option_id
    FROM answer_options
    WHERE question_id = v_question_id
      AND option_text = p_option_texts[v_index]
    LIMIT 1;

    IF v_option_id IS NULL THEN
      INSERT INTO answer_options (
        question_id,
        option_text,
        recommendation,
        risk_score,
        sort_order,
        is_active
      )
      VALUES (
        v_question_id,
        p_option_texts[v_index],
        NULL,
        p_option_scores[v_index],
        v_index,
        TRUE
      );
    ELSE
      UPDATE answer_options
      SET risk_score = p_option_scores[v_index],
          sort_order = v_index,
          is_active = TRUE
      WHERE id = v_option_id;
    END IF;
  END LOOP;
END;
$$;

DO $$
BEGIN
  PERFORM seed_question_with_options(
    'Зүрх',
    'Цээжний өвдөлт мэдрэгдэж байна уу?',
    1,
    2.0,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Хааяа', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Зүрх',
    'Зүрх тогтмол бус дэлсэж, эсвэл тасарч мэдрэгдэж байна уу?',
    2,
    1.5,
    ARRAY['Тийм, өдөр бүр', '7 хоногт хэд хэд', 'Хааяа', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Зүрх',
    'Хөл, гар хавдаж байна уу?',
    3,
    1.0,
    ARRAY['Тийм, өдөр бүр', 'Оройдоо', 'Хааяа', 'Үгүй'],
    ARRAY[2.5, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Зүрх',
    'Амьсгаадах, хурдан ядрах тохиолдол байна уу?',
    4,
    1.5,
    ARRAY['Байнга', 'Шат өгсөхөд', 'Хүчтэй ачаалалд л', 'Үгүй'],
    ARRAY[3.0, 2.0, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Зүрх',
    'Зовиур хэдэн хоногийн өмнөөс эхэлсэн бэ?',
    5,
    1.0,
    ARRAY['Өнөөдөр эсвэл өчигдрөөс', '3-7 хоног', '1-4 долоо хоног', '1 сараас дээш'],
    ARRAY[0.5, 1.0, 2.0, 3.0]
  );

  PERFORM seed_question_with_options(
    'Даралт',
    'Толгой өвдөх, эргэх мэдрэгдэж байна уу?',
    1,
    1.5,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Хааяа', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Даралт',
    'Даралтаа хэмжиж байна уу? Хэдэн mm/Hg байна вэ?',
    2,
    1.0,
    ARRAY['140/90-с дээш тогтмол', '130-139 / 85-89 орчим', '120-129 / 80-84 орчим', 'Хэвийн эсвэл тогтмол хэмждэггүй'],
    ARRAY[3.0, 2.0, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Даралт',
    'Нүд бүдгэрэх, харанхуйлах тохиолдол байна уу?',
    3,
    2.0,
    ARRAY['Тийм, олон удаа', 'Заримдаа', 'Ховор', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Даралт',
    'Тэнцвэр алдах, унах дөхсөн мэдрэмж байна уу?',
    4,
    2.0,
    ARRAY['Тийм, давтагддаг', 'Сүүлийн үед 1-2 удаа', 'Ховор', 'Үгүй'],
    ARRAY[3.0, 2.0, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Даралт',
    'Зовиур өдрийн аль цагт хурцддаг вэ?',
    5,
    0.5,
    ARRAY['Өглөө', 'Өдөр', 'Орой', 'Бараг бүтэн өдөр'],
    ARRAY[1.5, 1.0, 1.5, 2.5]
  );

  PERFORM seed_question_with_options(
    'Ходоод',
    'Хэвлийн өвдөлт байна уу? Хаана байрладаг вэ?',
    1,
    1.5,
    ARRAY['Ходоодны дээд хэсэг', 'Хүйсний орчим', 'Баруун хавирганы доор', 'Өвдөлтгүй / тодорхойгүй'],
    ARRAY[2.0, 1.5, 2.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Ходоод',
    'Дотор муухайрах, бөөлжих тохиолдол байна уу?',
    2,
    1.0,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Хааяа', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Ходоод',
    'Суулгах, өтгөн хаталт байна уу?',
    3,
    1.0,
    ARRAY['Тогтмол', 'Заримдаа', 'Ховор', 'Үгүй'],
    ARRAY[2.5, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Ходоод',
    'Хоол идсэний дараа өвдөлт нэмэгдэж байна уу?',
    4,
    1.5,
    ARRAY['Тийм, бараг үргэлж', 'Заримдаа', 'Ховор', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Ходоод',
    'Цус бүхий ялгадас гарч байна уу?',
    5,
    3.0,
    ARRAY['Тийм, олон удаа', 'Тийм, 1-2 удаа', 'Эргэлзээтэй', 'Үгүй'],
    ARRAY[4.0, 3.0, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Элэг',
    'Баруун хавирганы доор хөндүүр, дарж өвдөх мэдрэмж байна уу?',
    1,
    1.5,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Хааяа', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Элэг',
    'Арьс, нүд шарлах эсвэл шээс бараантах шинж илэрч байна уу?',
    2,
    2.5,
    ARRAY['Тийм, аль аль нь', 'Нэг нь ажиглагдсан', 'Эргэлзээтэй', 'Үгүй'],
    ARRAY[4.0, 2.5, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Элэг',
    'Тослог хоолны дараа дотор эвгүйрхэж, гашуун оргих уу?',
    3,
    1.5,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Ховор', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Элэг',
    'Сүүлийн үед ядрах, хоолны дуршил буурах шинж байна уу?',
    4,
    1.0,
    ARRAY['Тийм, хүчтэй', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
    ARRAY[2.5, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Элэг',
    'Элэгний өвчний түүх эсвэл архины тогтмол хэрэглээ байдаг уу?',
    5,
    1.5,
    ARRAY['Тийм, аль аль нь', 'Нэг нь бий', 'Өмнө нь байсан', 'Үгүй'],
    ARRAY[3.0, 2.0, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Бөөр',
    'Бүсэлхий, нурууны доод хэсгээр өвдөж байна уу?',
    1,
    1.5,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Хөдөлгөөнтэй холбоотой', 'Үгүй'],
    ARRAY[3.0, 1.5, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Бөөр',
    'Шээх үед хорсох, ойр ойрхон шээх шинж байна уу?',
    2,
    2.0,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Хааяа', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Бөөр',
    'Шээсний өнгө өөрчлөгдөх эсвэл цустай харагдах тохиолдол бий юу?',
    3,
    2.5,
    ARRAY['Тийм, тод ажиглагдсан', 'Заримдаа бараан', 'Эргэлзээтэй', 'Үгүй'],
    ARRAY[4.0, 2.0, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Бөөр',
    'Өглөө нүүр, шагай хавагнах шинж байна уу?',
    4,
    1.5,
    ARRAY['Тийм, өдөр бүр', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Бөөр',
    'Халуурах, даарахтай хавсарсан бөөрний зовиур байна уу?',
    5,
    2.0,
    ARRAY['Тийм, байнга', 'Сүүлийн үед байсан', 'Эргэлзээтэй', 'Үгүй'],
    ARRAY[3.5, 2.0, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Бамбай булчирхай',
    'Жин богино хугацаанд огцом өөрчлөгдөж байна уу?',
    1,
    1.5,
    ARRAY['Тийм, огцом', 'Тийм, бага зэрэг', 'Тогтворгүй', 'Үгүй'],
    ARRAY[3.0, 1.5, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Бамбай булчирхай',
    'Зүрх дэлсэх, халууцах эсвэл хөлрөх шинж байна уу?',
    2,
    1.5,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Ховор', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Бамбай булчирхай',
    'Хүзүүний урд хэсгээр төвийж томорсон мэдрэмж байна уу?',
    3,
    2.0,
    ARRAY['Тийм, тод мэдрэгдэнэ', 'Бага зэрэг', 'Эргэлзээтэй', 'Үгүй'],
    ARRAY[3.5, 2.0, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Бамбай булчирхай',
    'Дааруу хүрэх, ядрах, нойрмоглох шинж давамгай байна уу?',
    4,
    1.5,
    ARRAY['Тийм, хүчтэй', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Бамбай булчирхай',
    'Үс унах, арьс хуурайших, хоолой сөөнгөтөх шинж байна уу?',
    5,
    1.0,
    ARRAY['Тийм, хэд хэдэн шинжтэй', 'Нэг шинж ажиглагдсан', 'Хааяа', 'Үгүй'],
    ARRAY[2.5, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Эмэгтэйчүүд',
    'Сарын тэмдгийн мөчлөг тогтворгүй болсон уу?',
    1,
    1.5,
    ARRAY['Тийм, тогтмол алдагддаг', 'Сүүлийн үед өөрчлөгдсөн', 'Хааяа', 'Үгүй'],
    ARRAY[3.0, 2.0, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Эмэгтэйчүүд',
    'Доод хэвлийгээр өвдөх, базлах шинж байнга давтагддаг уу?',
    2,
    1.5,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Сарын тэмдэгтэй холбоотой', 'Үгүй'],
    ARRAY[3.0, 1.5, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Эмэгтэйчүүд',
    'Үтрээнээс хэвийн бус ялгадас эсвэл үнэр гарах шинж байна уу?',
    3,
    2.0,
    ARRAY['Тийм, тод ажиглагдана', 'Заримдаа', 'Эргэлзээтэй', 'Үгүй'],
    ARRAY[3.0, 1.5, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Эмэгтэйчүүд',
    'Сарын тэмдэг хэт их эсвэл удаан үргэлжилдэг үү?',
    4,
    2.0,
    ARRAY['Тийм, байнга', 'Сүүлийн үед', 'Хааяа', 'Үгүй'],
    ARRAY[3.0, 2.0, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Эмэгтэйчүүд',
    'Жирэмслэхээр төлөвлөж байгаа эсвэл дааврын тэнцвэр алдагдсан гэж үзэж байна уу?',
    5,
    1.0,
    ARRAY['Тийм, эмчид үзүүлэх шаардлагатай', 'Тийм, урьдчилан шалгуулмаар байна', 'Эргэлзээтэй', 'Үгүй'],
    ARRAY[2.5, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Яс үе',
    'Үе мөч хөшиж, өглөө хөдөлгөөнд орохдоо хүндрэлтэй байна уу?',
    1,
    1.5,
    ARRAY['Тийм, өдөр бүр', 'Заримдаа', 'Хааяа', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Яс үе',
    'Өвдөг, нуруу, ташаа зэрэгт байнгын өвдөлт байна уу?',
    2,
    1.5,
    ARRAY['Тийм, байнга', 'Алхахад нэмэгддэг', 'Хааяа', 'Үгүй'],
    ARRAY[3.0, 2.0, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Яс үе',
    'Үеэр хавдах, халуу оргих шинж байна уу?',
    3,
    2.0,
    ARRAY['Тийм, тод ажиглагдана', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Яс үе',
    'Гар, хөл бадайрах эсвэл мэдээ алдах шинж байна уу?',
    4,
    1.5,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Ховор', 'Үгүй'],
    ARRAY[2.5, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Яс үе',
    'Өндөр багасах, амархан яс өвдөх эсвэл хугарах эрсдэлтэй юу?',
    5,
    2.0,
    ARRAY['Тийм, өндөр эрсдэлтэй', 'Өмнө нь байсан', 'Эргэлзээтэй', 'Үгүй'],
    ARRAY[3.5, 2.0, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Хоол боловсруулах эрхтэн',
    'Хэвлий дүүрэх, гэдэс хий ихсэх шинж байна уу?',
    1,
    1.0,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Хааяа', 'Үгүй'],
    ARRAY[2.5, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Хоол боловсруулах эрхтэн',
    'Цээж хорсох, хүчил оргих шинж байна уу?',
    2,
    1.5,
    ARRAY['Тийм, долоо хоногт хэд хэд', 'Заримдаа', 'Ховор', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Хоол боловсруулах эрхтэн',
    'Хоолны дуршил буурах эсвэл хоол шингэхгүй байх шинж байна уу?',
    3,
    1.5,
    ARRAY['Тийм, хүчтэй', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
    ARRAY[2.5, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Хоол боловсруулах эрхтэн',
    'Өтгөний хэлбэр, өнгө тогтмол өөрчлөгдөж байна уу?',
    4,
    1.5,
    ARRAY['Тийм, байнга', 'Сүүлийн үед', 'Ховор', 'Үгүй'],
    ARRAY[3.0, 2.0, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Хоол боловсруулах эрхтэн',
    'Тайлбарлахад бэрх жин буурах шинж байна уу?',
    5,
    2.0,
    ARRAY['Тийм, мэдэгдэхүйц', 'Бага зэрэг', 'Эргэлзээтэй', 'Үгүй'],
    ARRAY[3.5, 1.5, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Даавар',
    'Ядрах, сульдах шинж удаан үргэлжилж байна уу?',
    1,
    1.5,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Даавар',
    'Жин нэмэх эсвэл хасах өөрчлөлт тайлбарлахад хэцүү байна уу?',
    2,
    1.5,
    ARRAY['Тийм, огцом', 'Тийм, бага зэрэг', 'Эргэлзээтэй', 'Үгүй'],
    ARRAY[3.0, 1.5, 1.0, 0.0]
  );

  PERFORM seed_question_with_options(
    'Даавар',
    'Ам цангах, ойр ойрхон өлсөх эсвэл шөнө шээх шинж байна уу?',
    3,
    2.0,
    ARRAY['Тийм, олон шинжтэй', 'Нэг шинж давтагддаг', 'Хааяа', 'Үгүй'],
    ARRAY[3.5, 2.0, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Даавар',
    'Сэтгэл санаа савлах, нойр алдагдах шинж байна уу?',
    4,
    1.0,
    ARRAY['Тийм, байнга', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
    ARRAY[2.5, 1.5, 0.5, 0.0]
  );

  PERFORM seed_question_with_options(
    'Даавар',
    'Арьс батгаших, үсжилт өөрчлөгдөх эсвэл бэлгийн дуршил буурах шинж байна уу?',
    5,
    1.5,
    ARRAY['Тийм, тод ажиглагдана', 'Заримдаа', 'Хөнгөн', 'Үгүй'],
    ARRAY[3.0, 1.5, 0.5, 0.0]
  );
END $$;

DROP FUNCTION IF EXISTS public.seed_question_with_options(TEXT, TEXT, INTEGER, NUMERIC, TEXT[], NUMERIC[]);
-- ===== END seed-v4.sql =====

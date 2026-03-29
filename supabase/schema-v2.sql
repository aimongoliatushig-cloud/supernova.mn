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
  phone     TEXT DEFAULT '1330-033',
  address   TEXT DEFAULT 'Улаанбаатар хот',
  email     TEXT,
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

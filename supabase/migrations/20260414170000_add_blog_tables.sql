CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  cta_label TEXT,
  cta_link TEXT,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS blog_categories_sort_order_idx
  ON blog_categories (sort_order, name);

CREATE INDEX IF NOT EXISTS blog_articles_published_at_idx
  ON blog_articles (published_at DESC);

CREATE INDEX IF NOT EXISTS blog_articles_category_id_idx
  ON blog_articles (category_id);

ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_blog_categories" ON blog_categories;
CREATE POLICY "public_read_blog_categories" ON blog_categories FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "public_read_blog_articles" ON blog_articles;
CREATE POLICY "public_read_blog_articles" ON blog_articles FOR SELECT
  USING (is_published = TRUE);

DROP POLICY IF EXISTS "admin_manage_blog_categories" ON blog_categories;
CREATE POLICY "admin_manage_blog_categories" ON blog_categories FOR ALL
  USING (current_user_role() = 'super_admin');

DROP POLICY IF EXISTS "admin_manage_blog_articles" ON blog_articles;
CREATE POLICY "admin_manage_blog_articles" ON blog_articles FOR ALL
  USING (current_user_role() = 'super_admin');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_blog_categories_updated_at'
  ) THEN
    CREATE TRIGGER set_blog_categories_updated_at
    BEFORE UPDATE ON blog_categories
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_blog_articles_updated_at'
  ) THEN
    CREATE TRIGGER set_blog_articles_updated_at
    BEFORE UPDATE ON blog_articles
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

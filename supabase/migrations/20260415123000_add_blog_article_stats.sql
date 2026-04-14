ALTER TABLE blog_articles
  ADD COLUMN IF NOT EXISTS publisher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS publisher_name TEXT,
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS blog_articles_publisher_id_idx
  ON blog_articles (publisher_id);

CREATE INDEX IF NOT EXISTS blog_articles_view_count_idx
  ON blog_articles (view_count DESC);

UPDATE blog_articles
SET
  publisher_id = COALESCE(
    blog_articles.publisher_id,
    (
      SELECT id
      FROM profiles
      WHERE role = 'super_admin'
      ORDER BY created_at
      LIMIT 1
    )
  ),
  publisher_name = COALESCE(
    NULLIF(BTRIM(blog_articles.publisher_name), ''),
    (
      SELECT COALESCE(NULLIF(BTRIM(full_name), ''), email)
      FROM profiles
      WHERE role = 'super_admin'
      ORDER BY created_at
      LIMIT 1
    ),
    'Супер админ'
  );

CREATE OR REPLACE FUNCTION increment_blog_article_view(article_slug TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE blog_articles
  SET view_count = view_count + 1
  WHERE slug = article_slug
    AND is_published = TRUE
  RETURNING view_count INTO updated_count;

  RETURN updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_blog_article_view(TEXT) TO anon, authenticated;

DROP POLICY IF EXISTS "staff_read_blog_categories" ON blog_categories;
CREATE POLICY "staff_read_blog_categories" ON blog_categories FOR SELECT
  USING (current_user_role() IN ('office_assistant', 'super_admin'));

DROP POLICY IF EXISTS "staff_read_blog_articles" ON blog_articles;
CREATE POLICY "staff_read_blog_articles" ON blog_articles FOR SELECT
  USING (current_user_role() IN ('office_assistant', 'super_admin'));

NOTIFY pgrst, 'reload schema';

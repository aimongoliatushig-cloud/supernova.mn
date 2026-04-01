DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role'
      AND e.enumlabel = 'organization_consultant'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'organization_consultant' AFTER 'operator';
  END IF;
END $$;

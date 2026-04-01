DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role'
      AND e.enumlabel = 'operator'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'operator' AFTER 'office_assistant';
  END IF;
END $$;

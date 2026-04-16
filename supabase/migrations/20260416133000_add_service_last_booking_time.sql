ALTER TABLE services
  ADD COLUMN IF NOT EXISTS has_last_booking_time BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_booking_time TIME;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'services_last_booking_time_requires_flag'
  ) THEN
    ALTER TABLE services
      ADD CONSTRAINT services_last_booking_time_requires_flag
      CHECK (
        (NOT has_last_booking_time AND last_booking_time IS NULL)
        OR has_last_booking_time
      );
  END IF;
END $$;

-- Consultation assignment and stricter doctor CRM access

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

DROP POLICY IF EXISTS "staff_manage_consultations" ON consultation_requests;

CREATE POLICY "staff_manage_consultations" ON consultation_requests FOR ALL
  USING (current_user_role() IN ('office_assistant', 'super_admin'))
  WITH CHECK (current_user_role() IN ('office_assistant', 'super_admin'));

CREATE POLICY "doctor_read_assigned_consultations" ON consultation_requests FOR SELECT
  USING (
    current_user_role() = 'doctor'
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

CREATE POLICY "doctor_update_assigned_consultations" ON consultation_requests FOR UPDATE
  USING (
    current_user_role() = 'doctor'
    AND assigned_doctor_id IN (
      SELECT id FROM doctors WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "doctor_insert_responses" ON doctor_responses;

CREATE POLICY "doctor_insert_responses" ON doctor_responses FOR INSERT
  WITH CHECK (
    (
      current_user_role() = 'super_admin'
    )
    OR (
      current_user_role() = 'doctor'
      AND doctor_id IN (
        SELECT id FROM doctors WHERE profile_id = auth.uid()
      )
      AND EXISTS (
        SELECT 1
        FROM consultation_requests cr
        WHERE cr.id = consultation_id
          AND cr.assigned_doctor_id = doctor_id
      )
    )
  );

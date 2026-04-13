-- Reset doctor CRM policies to remove recursive RLS and restore doctor appointment visibility

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'consultation_requests'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON consultation_requests', policy_record.policyname);
  END LOOP;

  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'doctor_responses'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON doctor_responses', policy_record.policyname);
  END LOOP;

  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'appointments'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON appointments', policy_record.policyname);
  END LOOP;
END $$;

CREATE POLICY "anon_insert_appointments" ON appointments FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "staff_manage_appointments" ON appointments FOR ALL
  USING (current_user_role() IN ('office_assistant', 'super_admin'))
  WITH CHECK (current_user_role() IN ('office_assistant', 'super_admin'));

CREATE POLICY "doctor_read_own_appointments" ON appointments FOR SELECT
  USING (
    current_user_role() = 'doctor'
    AND doctor_id IN (
      SELECT id
      FROM doctors
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "anon_insert_consultations" ON consultation_requests FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "staff_manage_consultations" ON consultation_requests FOR ALL
  USING (current_user_role() IN ('office_assistant', 'super_admin'))
  WITH CHECK (current_user_role() IN ('office_assistant', 'super_admin'));

CREATE POLICY "doctor_read_assigned_consultations" ON consultation_requests FOR SELECT
  USING (
    current_user_role() = 'doctor'
    AND assigned_doctor_id IN (
      SELECT id
      FROM doctors
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "doctor_update_assigned_consultations" ON consultation_requests FOR UPDATE
  USING (
    current_user_role() = 'doctor'
    AND assigned_doctor_id IN (
      SELECT id
      FROM doctors
      WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (
    current_user_role() = 'doctor'
    AND assigned_doctor_id IN (
      SELECT id
      FROM doctors
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "staff_read_responses" ON doctor_responses FOR SELECT
  USING (current_user_role() IN ('office_assistant', 'super_admin'));

CREATE POLICY "doctor_read_assigned_responses" ON doctor_responses FOR SELECT
  USING (
    current_user_role() = 'doctor'
    AND EXISTS (
      SELECT 1
      FROM consultation_requests cr
      WHERE cr.id = doctor_responses.consultation_id
        AND cr.assigned_doctor_id IN (
          SELECT id
          FROM doctors
          WHERE profile_id = auth.uid()
        )
    )
  );

CREATE POLICY "doctor_insert_responses" ON doctor_responses FOR INSERT
  WITH CHECK (
    current_user_role() = 'super_admin'
    OR (
      current_user_role() = 'doctor'
      AND doctor_id IN (
        SELECT id
        FROM doctors
        WHERE profile_id = auth.uid()
      )
      AND EXISTS (
        SELECT 1
        FROM consultation_requests cr
        WHERE cr.id = consultation_id
          AND cr.assigned_doctor_id = doctor_id
      )
    )
  );

-- Fix recursive doctor consultation policy and allow doctors to read own appointments

DROP POLICY IF EXISTS "doctor_read_assigned_consultations" ON consultation_requests;

CREATE POLICY "doctor_read_assigned_consultations" ON consultation_requests FOR SELECT
  USING (
    current_user_role() = 'doctor'
    AND assigned_doctor_id IN (
      SELECT id
      FROM doctors
      WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "doctor_read_own_appointments" ON appointments;

CREATE POLICY "doctor_read_own_appointments" ON appointments FOR SELECT
  USING (
    current_user_role() = 'doctor'
    AND doctor_id IN (
      SELECT id
      FROM doctors
      WHERE profile_id = auth.uid()
    )
  );

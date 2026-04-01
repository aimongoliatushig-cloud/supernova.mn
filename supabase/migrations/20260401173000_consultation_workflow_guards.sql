-- Tighten consultation workflow transitions and operator permissions

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
  USING (current_user_role() IN ('office_assistant', 'super_admin'))
  WITH CHECK (current_user_role() IN ('office_assistant', 'super_admin'));

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
  USING (current_user_role() IN ('office_assistant', 'operator', 'super_admin'));

CREATE POLICY "admin_manage_consultations" ON consultation_requests FOR ALL
  USING (current_user_role() = 'super_admin')
  WITH CHECK (current_user_role() = 'super_admin');

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

DROP POLICY IF EXISTS "doctor_insert_responses" ON doctor_responses;

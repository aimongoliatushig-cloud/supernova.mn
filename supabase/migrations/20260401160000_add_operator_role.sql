DROP POLICY IF EXISTS "staff_select_leads" ON leads;
CREATE POLICY "staff_select_leads" ON leads FOR SELECT
  USING (current_user_role() IN ('office_assistant', 'operator', 'doctor', 'super_admin'));

DROP POLICY IF EXISTS "staff_update_leads" ON leads;
CREATE POLICY "staff_update_leads" ON leads FOR UPDATE
  USING (current_user_role() IN ('office_assistant', 'operator', 'super_admin'));

DROP POLICY IF EXISTS "staff_read_assessments" ON assessments;
CREATE POLICY "staff_read_assessments" ON assessments FOR SELECT
  USING (current_user_role() IN ('office_assistant', 'operator', 'doctor', 'super_admin'));

DROP POLICY IF EXISTS "staff_manage_appointments" ON appointments;
CREATE POLICY "staff_manage_appointments" ON appointments FOR ALL
  USING (current_user_role() IN ('office_assistant', 'operator', 'super_admin'));

DROP POLICY IF EXISTS "staff_manage_consultations" ON consultation_requests;
CREATE POLICY "staff_manage_consultations" ON consultation_requests FOR ALL
  USING (current_user_role() IN ('office_assistant', 'operator', 'super_admin'))
  WITH CHECK (current_user_role() IN ('office_assistant', 'operator', 'super_admin'));

DROP POLICY IF EXISTS "staff_read_responses" ON doctor_responses;
CREATE POLICY "staff_read_responses" ON doctor_responses FOR SELECT
  USING (current_user_role() IN ('office_assistant', 'operator', 'doctor', 'super_admin'));

DROP POLICY IF EXISTS "staff_manage_crm_notes" ON crm_notes;
CREATE POLICY "staff_manage_crm_notes" ON crm_notes FOR ALL
  USING (current_user_role() IN ('office_assistant', 'operator', 'super_admin'));

DROP POLICY IF EXISTS "staff_delete_leads" ON leads;

CREATE POLICY "staff_delete_leads" ON leads FOR DELETE
  USING (current_user_role() IN ('office_assistant', 'super_admin'));

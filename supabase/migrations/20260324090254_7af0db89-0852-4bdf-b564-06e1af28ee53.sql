DROP POLICY IF EXISTS "Authenticated can insert activity" ON activity_logs;
CREATE POLICY "Users can insert own activity"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
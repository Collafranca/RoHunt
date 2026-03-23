CREATE TABLE IF NOT EXISTS scam_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_user_id UUID,
  reporter_user_id UUID,
  job_id UUID,
  status TEXT NOT NULL DEFAULT 'open',
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT fk_scam_reports_reported_user FOREIGN KEY (reported_user_id) REFERENCES users (id),
  CONSTRAINT fk_scam_reports_reporter_user FOREIGN KEY (reporter_user_id) REFERENCES users (id),
  CONSTRAINT fk_scam_reports_job FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS trust_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  actor_user_id UUID,
  scam_report_id UUID,
  event_type TEXT NOT NULL,
  score_delta INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT fk_trust_events_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_trust_events_actor_user FOREIGN KEY (actor_user_id) REFERENCES users (id),
  CONSTRAINT fk_trust_events_scam_report FOREIGN KEY (scam_report_id) REFERENCES scam_reports (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_scam_reports_status_created_at ON scam_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_events_user_created_at ON trust_events (user_id, created_at DESC);

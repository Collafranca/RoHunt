CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL,
  posted_by_user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  compensation_summary TEXT,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT ck_jobs_status CHECK (status IN ('open', 'filled', 'closed')),
  CONSTRAINT fk_jobs_source FOREIGN KEY (source_id) REFERENCES job_sources (id),
  CONSTRAINT fk_jobs_posted_by_user FOREIGN KEY (posted_by_user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS job_ingestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL,
  job_id UUID,
  external_message_id TEXT NOT NULL,
  external_channel_id TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT uq_job_ingestions_source_external UNIQUE (source_id, external_message_id),
  CONSTRAINT fk_job_ingestions_source FOREIGN KEY (source_id) REFERENCES job_sources (id),
  CONSTRAINT fk_job_ingestions_job FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS job_skill_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  skill_id UUID NOT NULL,
  confidence NUMERIC(5,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT uq_job_skill_tags_job_skill UNIQUE (job_id, skill_id),
  CONSTRAINT ck_job_skill_tags_confidence CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  CONSTRAINT fk_job_skill_tags_job FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE,
  CONSTRAINT fk_job_skill_tags_skill FOREIGN KEY (skill_id) REFERENCES skills (id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_status_posted_at ON jobs (status, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_ingestions_source_external_id ON job_ingestions (source_id, external_message_id);
CREATE INDEX IF NOT EXISTS idx_job_skill_tags_job_id ON job_skill_tags (job_id);

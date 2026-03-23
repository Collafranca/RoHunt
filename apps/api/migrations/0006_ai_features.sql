CREATE TABLE IF NOT EXISTS ai_portfolio_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reviewer_model TEXT NOT NULL,
  input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  review_summary TEXT,
  score NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT ck_ai_portfolio_reviews_score CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  CONSTRAINT fk_ai_portfolio_reviews_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_job_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID NOT NULL,
  scorer_model TEXT NOT NULL,
  match_score NUMERIC(6,5) NOT NULL,
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT uq_ai_job_matches_user_job UNIQUE (user_id, job_id),
  CONSTRAINT ck_ai_job_matches_match_score CHECK (match_score >= 0 AND match_score <= 1),
  CONSTRAINT fk_ai_job_matches_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_ai_job_matches_job FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_job_matches_user_score ON ai_job_matches (user_id, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_portfolio_reviews_user_created_at ON ai_portfolio_reviews (user_id, created_at DESC);

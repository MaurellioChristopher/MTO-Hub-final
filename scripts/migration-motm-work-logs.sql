-- Migration: MOTM Work Logs
-- Table to store monthly achievements/work summaries for MOTM transparency

CREATE TABLE IF NOT EXISTS motm_work_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month       SMALLINT    NOT NULL,
  year        SMALLINT    NOT NULL,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_motm_work_logs_date ON motm_work_logs(month, year);
CREATE INDEX IF NOT EXISTS idx_motm_work_logs_user ON motm_work_logs(user_id);

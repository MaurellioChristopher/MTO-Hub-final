-- Migration: Personal To-Do List
-- Table to store user-specific private tasks

CREATE TABLE IF NOT EXISTS personal_tasks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  is_completed BOOLEAN    NOT NULL DEFAULT false,
  priority    VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance when fetching a user's tasks
CREATE INDEX IF NOT EXISTS idx_personal_tasks_user ON personal_tasks(user_id);

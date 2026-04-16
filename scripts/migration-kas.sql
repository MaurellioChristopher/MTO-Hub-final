-- ================================================================
-- MTO-HUB Migration: Pencatatan Uang Kas
-- Jalankan di Supabase Dashboard → SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS kas_payments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month      SMALLINT    NOT NULL, -- 1-12
  year       SMALLINT    NOT NULL, -- e.g. 2026
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT kas_user_month_year_unique UNIQUE (user_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_kas_user ON kas_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_kas_month_year ON kas_payments(month, year);

-- ================================================================
-- MTO-HUB Migration: Form Perizinan
-- Jalankan di Supabase Dashboard → SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS perizinan (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
  nama        TEXT        NOT NULL,
  nim         TEXT        NOT NULL,
  jurusan     TEXT        NOT NULL,
  divisi      TEXT        NOT NULL,
  keterangan  TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  bukti_url   TEXT,
  bukti_nama  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perizinan_user   ON perizinan(user_id);
CREATE INDEX IF NOT EXISTS idx_perizinan_status ON perizinan(status);

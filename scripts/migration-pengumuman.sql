-- ================================================================
-- MTO-HUB: Pengumuman — Migration
-- Jalankan di Supabase SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS pengumuman (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  content     TEXT         NOT NULL,
  category    VARCHAR(30)  NOT NULL DEFAULT 'Umum'
              CHECK (category IN ('Umum', 'Penting', 'Acara', 'Keuangan')),
  is_pinned   BOOLEAN      NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pengumuman_created  ON pengumuman(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pengumuman_pinned   ON pengumuman(is_pinned DESC, created_at DESC);

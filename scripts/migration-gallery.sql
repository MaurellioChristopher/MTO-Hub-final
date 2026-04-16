-- ================================================================
-- MTO-HUB Migration: Galeri / Dokumentasi
-- Jalankan di Supabase Dashboard → SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS gallery_posts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  caption     TEXT        NOT NULL,
  image_url   TEXT        NOT NULL,
  event_date  DATE        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON gallery_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_event_date ON gallery_posts(event_date DESC);

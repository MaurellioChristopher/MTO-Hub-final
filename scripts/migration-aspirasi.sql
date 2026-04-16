-- ================================================================
-- MTO-HUB Migration: Tabel Aspirasi (Anonim)
-- Jalankan di Supabase Dashboard → SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS aspirasi (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kategori   VARCHAR(50) NOT NULL DEFAULT 'Umum',
  isi        TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aspirasi_created ON aspirasi(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aspirasi_kategori ON aspirasi(kategori);

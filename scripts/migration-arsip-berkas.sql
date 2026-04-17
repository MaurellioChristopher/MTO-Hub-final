-- ================================================================
-- MTO-HUB: Arsip Berkas — Migration
-- Jalankan di Supabase SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS arsip_berkas (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id  UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  category     VARCHAR(50)  NOT NULL DEFAULT 'Umum'
               CHECK (category IN ('Umum', 'Proposal Proker', 'Surat Menyurat', 'Keuangan', 'Lainnya')),
  file_url     TEXT         NOT NULL,
  file_name    VARCHAR(255) NOT NULL,
  file_type    VARCHAR(100) NOT NULL,
  file_size    BIGINT       NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_arsip_uploader  ON arsip_berkas(uploader_id);
CREATE INDEX IF NOT EXISTS idx_arsip_category  ON arsip_berkas(category);
CREATE INDEX IF NOT EXISTS idx_arsip_created   ON arsip_berkas(created_at DESC);

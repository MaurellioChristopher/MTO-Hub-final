-- ================================================================
-- MTO-HUB: Profile Settings — Migration
-- Tambahkan kolom social_links ke tabel users
-- Jalankan di Supabase SQL Editor
-- ================================================================

-- Kolom avatar_url mungkin sudah ada, cek dulu
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_url   TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Contoh isi social_links:
-- {"instagram": "username", "linkedin": "url", "github": "username"}

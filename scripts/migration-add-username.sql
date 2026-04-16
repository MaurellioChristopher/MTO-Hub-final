-- ================================================================
-- MTO-HUB Migration: Tambah kolom username
-- Jalankan di Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Tambah kolom username
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE;

-- 2. Index untuk lookup cepat saat login
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

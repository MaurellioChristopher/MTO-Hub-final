-- ================================================================
-- MTO-HUB: Koreksi Nama & NIM Anggota (FINAL)
-- Berdasarkan konfirmasi data resmi MTO 25/26
-- Jalankan di Supabase SQL Editor
-- ================================================================

-- ── Koreksi NAMA ─────────────────────────────────────────────────────────────

-- #17 Aurora: "Aquifa" → "Aquilla"
UPDATE users SET name = 'Aurora Aquilla Pramesti'
WHERE nim = '102022500058';

-- #14 Aisya: "Fatihah" → "Falihah"
UPDATE users SET name = 'Aisya Husna Falihah'
WHERE nim = '102012500084';

-- #9 Fiina: "Saisabila" → "Salsabila"
UPDATE users SET name = 'Fiina Salsabila'
WHERE nim = '102012300130';

-- #26 Baiq: "Abranti" → "Abrianti"
UPDATE users SET name = 'Baiq Anjany Nabila Abrianti'
WHERE nim = '102012400349';

-- ── Koreksi NIM ──────────────────────────────────────────────────────────────

-- #5 Nadya Shandi Waranggani: 102022430030 → 102012430030
UPDATE users
SET nim = '102012430030', email = '102012430030@mto-hub.id'
WHERE nim = '102022430030' AND name = 'Nadya Shandi Waranggani';

-- #20 Moch Fasya Fawana Adi Sagara: 102022400029 → 102032400029
UPDATE users
SET nim = '102032400029', email = '102032400029@mto-hub.id'
WHERE nim = '102022400029' AND name = 'Moch Fasya Fawana Adi Sagara';

-- #22 Minati Nur Alifa: 102022400079 → 102032400079
UPDATE users
SET nim = '102032400079', email = '102032400079@mto-hub.id'
WHERE nim = '102022400079' AND name = 'Minati Nur Alifa';

-- ── Verifikasi ────────────────────────────────────────────────────────────────
SELECT department, name, nim
FROM users
ORDER BY department, name;

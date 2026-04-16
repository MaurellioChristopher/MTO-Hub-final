import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// ──────────────────────────────────────────────────────────────────────────────
// Setup Schema via Supabase SQL API
// Menjalankan schema.sql langsung ke database
// ──────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// SQL DDL untuk semua tabel MTO-Hub
const SCHEMA_SQL = `
-- Users: 33 anggota MTO + admin
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  nim           VARCHAR(20)  UNIQUE NOT NULL,
  email         VARCHAR(150) UNIQUE,
  role          VARCHAR(10)  NOT NULL CHECK (role IN ('Admin','User')),
  department    VARCHAR(10)  NOT NULL CHECK (department IN ('INTI','MI','MP','SD','SI')),
  password_hash TEXT         NOT NULL,
  avatar_url    TEXT,
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Events: acara / kegiatan MTO
CREATE TABLE IF NOT EXISTS events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  location    VARCHAR(200),
  date        DATE         NOT NULL,
  created_by  UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Attendance: bukti kehadiran per event
CREATE TABLE IF NOT EXISTS attendance (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID         NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_url   TEXT,
  status      VARCHAR(10)  NOT NULL DEFAULT 'present'
                           CHECK (status IN ('present','absent','excused')),
  timestamp   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- MOTM Ratings: penilaian antar anggota per departemen
CREATE TABLE IF NOT EXISTS motm_ratings (
  id            UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id      UUID     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id     UUID     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score         SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 10),
  month         SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year          SMALLINT NOT NULL,
  feedback_text TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(rater_id, target_id, month, year),
  CHECK (rater_id <> target_id)
);

-- Feedback Events: evaluasi setelah event selesai
CREATE TABLE IF NOT EXISTS feedback_events (
  id        UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id  UUID     NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id   UUID     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment   TEXT,
  rating    SMALLINT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_department  ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_role        ON users(role);
CREATE INDEX IF NOT EXISTS idx_attendance_event  ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user   ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_motm_target       ON motm_ratings(target_id, month, year);
CREATE INDEX IF NOT EXISTS idx_feedback_event    ON feedback_events(event_id);
CREATE INDEX IF NOT EXISTS idx_events_date       ON events(date);
`;

async function setupSchema() {
  console.log("🔧 MTO-Hub — Setup Schema\n");
  console.log(`🔗 Supabase: ${SUPABASE_URL}\n`);

  // Gunakan Supabase Management REST API untuk jalankan SQL
  const projectRef = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");
  console.log(`📦 Project ref: ${projectRef}`);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: SCHEMA_SQL }),
      }
    );

    if (!response.ok) {
      // Coba via query RPC
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    console.log("✅ Schema berhasil dibuat!\n");
  } catch {
    // Fallback: gunakan Supabase client dengan pg_dump workaround
    console.log("ℹ️  Mencoba metode alternatif via Supabase SDK...\n");

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Buat tabel satu per satu via RPC exec_sql jika tersedia
    // Jika tidak, instruksikan user untuk jalankan manual
    const { error } = await supabase.rpc("exec_sql", { sql: SCHEMA_SQL });

    if (error) {
      console.log("⚠️  Auto-schema tidak tersedia. Jalankan SQL berikut di Supabase SQL Editor:\n");
      console.log("   👉  supabase.com → Project → SQL Editor → New Query\n");
      console.log("   Copy-paste isi file: scripts/schema.sql\n");
      console.log("   Lalu klik Run ▶\n");
      console.log("   Setelah selesai, jalankan: npx tsx scripts/seed.ts\n");
    } else {
      console.log("✅ Schema berhasil dibuat via RPC!\n");
    }
  }

  process.exit(0);
}

setupSchema().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});

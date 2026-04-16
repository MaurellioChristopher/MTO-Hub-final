-- ================================================================
-- MTO-HUB Database Schema — Vercel Postgres (PostgreSQL)
-- Managerial Trainer Organization Portal 25/26
-- ================================================================

-- Users: 33 anggota MTO + admin
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  nim           VARCHAR(20)  UNIQUE NOT NULL,
  username      VARCHAR(100) UNIQUE,
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

-- ================================================================
-- INDEXES — Performa query
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_users_department  ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_role        ON users(role);
CREATE INDEX IF NOT EXISTS idx_attendance_event  ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user   ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_motm_target_month ON motm_ratings(target_id, month, year);
CREATE INDEX IF NOT EXISTS idx_motm_rater        ON motm_ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_feedback_event    ON feedback_events(event_id);
CREATE INDEX IF NOT EXISTS idx_events_date       ON events(date);

-- ================================================================
-- VIEWS — Kalkulasi otomatis
-- ================================================================

-- MOTM Leaderboard: rata-rata score per user per bulan
CREATE OR REPLACE VIEW motm_leaderboard AS
SELECT
  target_id                        AS user_id,
  month,
  year,
  ROUND(AVG(score)::NUMERIC, 2)    AS average_score,
  COUNT(*)                         AS total_ratings,
  RANK() OVER (
    PARTITION BY month, year,
    (SELECT department FROM users WHERE id = target_id)
    ORDER BY AVG(score) DESC
  )                                AS rank_in_department
FROM motm_ratings
GROUP BY target_id, month, year;

-- Attendance summary per user per event
CREATE OR REPLACE VIEW attendance_summary AS
SELECT
  u.id         AS user_id,
  u.name,
  u.department,
  COUNT(a.id)  FILTER (WHERE a.status = 'present')  AS present_count,
  COUNT(a.id)  FILTER (WHERE a.status = 'absent')   AS absent_count,
  COUNT(a.id)  FILTER (WHERE a.status = 'excused')  AS excused_count,
  COUNT(e.id)                                        AS total_events,
  ROUND(
    COUNT(a.id) FILTER (WHERE a.status = 'present')::NUMERIC /
    NULLIF(COUNT(e.id), 0) * 100
  , 1)                                               AS attendance_rate
FROM users u
LEFT JOIN attendance a ON a.user_id = u.id
LEFT JOIN events e     ON e.id = a.event_id
GROUP BY u.id, u.name, u.department;

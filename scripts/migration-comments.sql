-- ================================================================
-- MTO-HUB Migration: Komentar Galeri dan Balasan Aspirasi
-- ================================================================

-- Tabel Komentar Galeri
CREATE TABLE IF NOT EXISTS gallery_comments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_post_id UUID        NOT NULL REFERENCES gallery_posts(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_text    TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_comments_post_id ON gallery_comments(gallery_post_id);
CREATE INDEX IF NOT EXISTS idx_gallery_comments_created ON gallery_comments(created_at ASC);

-- Tabel Balasan Aspirasi (Anonim di UI, tetapi dicatat user_id untuk proteksi)
CREATE TABLE IF NOT EXISTS aspirasi_replies (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  aspirasi_id     UUID        NOT NULL REFERENCES aspirasi(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reply_text      TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aspirasi_replies_aspirasi_id ON aspirasi_replies(aspirasi_id);
CREATE INDEX IF NOT EXISTS idx_aspirasi_replies_created ON aspirasi_replies(created_at ASC);

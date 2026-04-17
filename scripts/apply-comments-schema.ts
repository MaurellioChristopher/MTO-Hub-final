import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import postgres from "postgres";

dotenv.config({ path: ".env.local" });

const dbUrl = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("❌ DATABASE_URL_DIRECT atau DATABASE_URL tidak ditemukan di .env.local");
  process.exit(1);
}

async function applyCommentsSchema() {
  console.log("🔧 MTO-Hub — Setup Schema Comments & Replies via Postgres\n");

  const sqlPath = path.join(process.cwd(), "scripts", "migration-comments.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  const sqlConn = postgres(dbUrl, { max: 1 });

  try {
    // split the sql script into individual queries by semicolon to be safe,
    // postgres.js handles multiple statements in the unsafe function
    await sqlConn.unsafe(sql);

    console.log("✅ Schema Komentar/Balasan berhasil dibuat!\n");
  } catch (error: any) {
    console.error("❌ Gagal Apply Schema:", error.message);
  } finally {
    await sqlConn.end();
  }
}

applyCommentsSchema();

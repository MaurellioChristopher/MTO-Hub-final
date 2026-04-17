import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function run() {
  console.log("Creating 'notifications' table...");
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        title       VARCHAR(100) NOT NULL,
        content     TEXT         NOT NULL,
        created_by  UUID         REFERENCES users(id) ON DELETE SET NULL,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `;
    console.log("Success!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit();
  }
}

run();

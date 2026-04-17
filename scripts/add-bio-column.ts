import postgres from "postgres";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: ".env.local" });

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function run() {
  console.log("Adding column 'bio' to 'users' table...");
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;`;
    console.log("Success!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit();
  }
}

run();

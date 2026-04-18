import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const sqlPath = path.join(process.cwd(), "scripts", "migration-motm-work-logs.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

async function runMigration() {
  console.log("🚀 Running MOTM Work Logs migration...");
  
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Try exec_sql RPC
  const { error } = await supabase.rpc("exec_sql", { sql_query: sql });

  if (error) {
    console.error("❌ Migration failed via RPC:", error.message);
    console.log("\n⚠️  Please run the SQL manually in Supabase SQL Editor:");
    console.log(sql);
    process.exit(1);
  } else {
    console.log("✅ Migration successful!");
    process.exit(0);
  }
}

runMigration().catch(err => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});

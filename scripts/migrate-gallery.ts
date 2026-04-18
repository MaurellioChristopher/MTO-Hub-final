import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function run() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  console.log("Adding drive_link column to gallery_posts...");
  
  // Using direct SQL via RPC if exists, or just informing user
  // Since we know exec_sql might be missing, we try a different approach if possible
  // Most people use the Supabase dashboard. But I can try to see if a simple query works if it's not restricted.
  
  // However, I'll provide the SQL to the user just in case, while trying to run it.
  const { error } = await supabase.rpc("exec_sql", { 
    sql_query: "ALTER TABLE gallery_posts ADD COLUMN IF NOT EXISTS drive_link TEXT;" 
  });

  if (error) {
    console.error("Failed to run migration via RPC:", error.message);
    console.log("PLEASE RUN THIS SQL MANUALLY IN SUPABASE SQL EDITOR:");
    console.log("ALTER TABLE gallery_posts ADD COLUMN IF NOT EXISTS drive_link TEXT;");
  } else {
    console.log("Successfully added drive_link column!");
  }
}

run();

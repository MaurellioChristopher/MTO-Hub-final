import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking for 'bio' column...");
  // Try to update a dummy record to check if column exists
  // If we can't run raw SQL, this is a way to test.
  // But wait, Supabase doesn't have an 'add column' method in the JS client.
  // It MUST be done via SQL or RPC.
  
  console.log("Please run this SQL in your Supabase SQL Editor:");
  console.log("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;");
  
  process.exit();
}

run();

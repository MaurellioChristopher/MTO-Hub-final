import { createClient } from "@supabase/supabase-js";

// ──────────────────────────────────────────────────────────────────────────────
// Supabase Client — dua versi:
//   1. serverClient() → pakai SERVICE_ROLE, bypass RLS, untuk Auth & API routes
//   2. publicClient() → pakai PUBLISHABLE_KEY, dengan RLS, untuk client-side
// ──────────────────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ── Server client (admin privileges — hanya digunakan di server side) ──────────
export function getServerClient() {
  const key = supabaseServiceRoleKey ?? supabasePublishableKey;
  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ── Public client (untuk client components, jika diperlukan) ──────────────────
export function getPublicClient() {
  return createClient(supabaseUrl, supabasePublishableKey);
}

// ── Helper: jalankan raw SQL via Supabase RPC (jika perlu) ───────────────────
// Untuk queries sederhana, gunakan supabase.from() langsung
export const supabaseAdmin = () => getServerClient();

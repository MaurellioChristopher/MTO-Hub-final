import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { PROKER_DATA } from "../lib/proker-data";

dotenv.config({ path: ".env.local" });

// ──────────────────────────────────────────────────────────────────────────────
// Sync Proker Data ke Events Table MTO-Hub
// Menghapus event lama dan mengganti dengan PROKER_DATA yang baru
// ──────────────────────────────────────────────────────────────────────────────

async function seedEvents() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log("📅 Menyamakan jadwal absensi dengan Proker...\n");

  // Get first admin user as creator
  const { data: admin } = await supabase
    .from("users")
    .select("id")
    .eq("role", "Admin")
    .limit(1)
    .single();

  console.log("🗑️ Menghapus data events (dan attendance terkait) yang lama...");
  // Hapus semua event yang ada (ini akan cascade delete absensi jika ada fk cascade)
  const { error: deleteError } = await supabase
    .from("events")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // trick to delete all rows

  if (deleteError) {
    console.error("❌ Gagal menghapus event lama:", deleteError.message);
    process.exit(1);
  }

  console.log("📥 Memasukkan jadwal proker ke tabel events...");

  let inserted = 0;
  let skipped = 0;

  for (const event of PROKER_DATA) {
    const { error } = await supabase.from("events").insert({
      title: event.title,
      date: event.date,
      description: `Kategori: ${event.category}`,
      location: "-", // Default location
      created_by: admin?.id ?? null,
    });

    if (error) {
      skipped++;
      console.warn(`  ⚠  Skip "${event.title}": ${error.message}`);
    } else {
      inserted++;
    }
  }

  console.log(`\n${"─".repeat(55)}`);
  console.log(`✨ Selesai! Inserted: ${inserted}, Skipped: ${skipped}`);
  process.exit(0);
}

seedEvents().catch((err) => {
  console.error("❌ Sync events gagal:", err.message);
  process.exit(1);
});

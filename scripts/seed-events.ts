import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// ──────────────────────────────────────────────────────────────────────────────
// Seed Events dari Timeline MTO 2025
// Focus: April 2026 (current month) + upcoming events
// ──────────────────────────────────────────────────────────────────────────────

interface EventInput {
  title: string;
  date: string; // YYYY-MM-DD
  description?: string;
  location?: string;
}

// Data dari Google Sheets Timeline MTO
// Disesuaikan ke tahun 2026 untuk MTO 25/26
const events: EventInput[] = [
  // ── April 2026 (Bulan ini) ─────────────────────────────────────────────────
  { title: "Appraisals 3",            date: "2026-04-13", description: "Penilaian kinerja anggota periode 3",     location: "Online / Kampus" },
  { title: "MTO Visit Community",     date: "2026-04-16", description: "Kunjungan komunitas eksternal MTO",       location: "TBD" },
  { title: "Post MT-Cast",            date: "2026-04-17", description: "Upload konten MT-Cast di media sosial",   location: "Online" },
  { title: "Training Internal 3",     date: "2026-04-24", description: "Pelatihan internal anggota batch 3",      location: "Kampus" },
  { title: "Share MOTM April",        date: "2026-04-24", description: "Pengumuman nominasi Member of the Month", location: "Online" },
  { title: "Hasil & Post MOTM April", date: "2026-04-26", description: "Pengumuman pemenang MOTM bulan April",    location: "Online" },

  // ── Mei 2026 ──────────────────────────────────────────────────────────────
  { title: "Hari Buruh Internasional", date: "2026-05-01", description: "Libur Nasional",                       location: "-" },
  { title: "Hari Raya Waisak",         date: "2026-05-12", description: "Libur Nasional",                       location: "-" },
  { title: "Appraisals 4",             date: "2026-05-15", description: "Penilaian kinerja anggota periode 4",  location: "Online / Kampus" },
  { title: "Open Discussion 1",        date: "2026-05-16", description: "Open discussion anggota MTO",          location: "Kampus" },
  { title: "Post MT-Cast Mei",         date: "2026-05-22", description: "Upload konten MT-Cast",                location: "Online" },
  { title: "Share MOTM Mei",           date: "2026-05-22", description: "Pengumuman nominasi MOTM",             location: "Online" },
  { title: "Hasil & Post MOTM Mei",    date: "2026-05-26", description: "Hasil MOTM bulan Mei",                 location: "Online" },
  { title: "Kenaikan Yesus Kristus",   date: "2026-05-29", description: "Libur Nasional",                       location: "-" },

  // ── Juni 2026 ─────────────────────────────────────────────────────────────
  { title: "Hari Lahir Pancasila",     date: "2026-06-01", description: "Libur Nasional",                       location: "-" },
  { title: "Appraisals 5",             date: "2026-06-15", description: "Penilaian kinerja anggota periode 5",  location: "Online / Kampus" },
  { title: "Post MT-Cast Juni",        date: "2026-06-19", description: "Upload konten MT-Cast",                location: "Online" },
  { title: "Share MOTM Juni",          date: "2026-06-19", description: "Pengumuman nominasi MOTM",             location: "Online" },
  { title: "Hasil & Post MOTM Juni",   date: "2026-06-26", description: "Hasil MOTM bulan Juni",                location: "Online" },

  // ── Juli 2026 ─────────────────────────────────────────────────────────────
  { title: "Post feeds materi",        date: "2026-07-09", description: "Upload materi edukasi di media sosial", location: "Online" },
  { title: "Appraisals 6",             date: "2026-07-15", description: "Penilaian kinerja anggota periode 6",  location: "Online / Kampus" },
  { title: "Post MT-Cast Juli",        date: "2026-07-16", description: "Upload konten MT-Cast",                location: "Online" },
  { title: "Share MOTM Juli",          date: "2026-07-16", description: "Pengumuman nominasi MOTM",             location: "Online" },
  { title: "Hasil & Post MOTM Juli",   date: "2026-07-26", description: "Hasil MOTM bulan Juli",                location: "Online" },

  // ── Agustus 2026 ──────────────────────────────────────────────────────────
  { title: "Post MT-Cast Agustus",           date: "2026-08-14", description: "Upload konten MT-Cast",               location: "Online" },
  { title: "Appraisals 7",                   date: "2026-08-15", description: "Penilaian kinerja anggota periode 7", location: "Online / Kampus" },
  { title: "Proklamasi Kemerdekaan RI",       date: "2026-08-17", description: "Libur Nasional — HUT RI",            location: "-" },
  { title: "Share MOTM Agustus",             date: "2026-08-21", description: "Pengumuman nominasi MOTM",            location: "Online" },
  { title: "Hasil & Post MOTM Agustus",      date: "2026-08-26", description: "Hasil MOTM bulan Agustus",           location: "Online" },

  // ── September 2026 ────────────────────────────────────────────────────────
  { title: "Appraisals 8",              date: "2026-09-15", description: "Penilaian kinerja anggota periode 8",  location: "Online / Kampus" },
  { title: "Upgrading MTO",             date: "2026-09-19", description: "Program upgrading anggota MTO",        location: "Kampus" },
  { title: "Hasil & MOTM + Open Disc 2",date: "2026-09-26", description: "Hasil MOTM + Open Discussion ke-2",   location: "Online" },
  { title: "MTO Night Carnival",        date: "2026-10-04", description: "Acara puncak MTO Night Carnival",      location: "TBD" },

  // ── Oktober 2026 ──────────────────────────────────────────────────────────
  { title: "Post feeds materi Oktober", date: "2026-10-08", description: "Upload materi edukasi",                location: "Online" },
  { title: "Appraisals 9",              date: "2026-10-15", description: "Penilaian kinerja anggota periode 9",  location: "Online / Kampus" },
  { title: "Hasil & Post MOTM Oktober", date: "2026-10-26", description: "Hasil MOTM bulan Oktober",            location: "Online" },

  // ── November 2026 ─────────────────────────────────────────────────────────
  { title: "Appraisals 360",            date: "2026-11-14", description: "Appraisals 360 derajat — evaluasi akhir", location: "Online / Kampus" },
  { title: "MTO Visit Company",         date: "2026-11-21", description: "Kunjungan perusahaan bersama MTO",       location: "TBD" },
  { title: "Share MOTM November",       date: "2026-11-21", description: "Pengumuman nominasi MOTM",               location: "Online" },
  { title: "Hasil & Post MOTM Nov",     date: "2026-11-26", description: "Hasil MOTM bulan November",              location: "Online" },

  // ── Desember 2026 ─────────────────────────────────────────────────────────
  { title: "Post feeds materi Des",     date: "2026-12-10", description: "Upload materi edukasi",                  location: "Online" },
  { title: "Hari Natal",                date: "2026-12-25", description: "Libur Nasional",                         location: "-" },
  { title: "Cuti Bersama Hari Natal",   date: "2026-12-26", description: "Libur Nasional",                        location: "-" },
];

async function seedEvents() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log("📅 Seeding MTO Events...\n");

  // Get first admin user as creator
  const { data: admin } = await supabase
    .from("users")
    .select("id")
    .eq("role", "Admin")
    .limit(1)
    .single();

  let inserted = 0;
  let skipped = 0;

  for (const event of events) {
    const { error } = await supabase.from("events").insert({
        title: event.title,
        date: event.date,
        description: event.description ?? null,
        location: event.location ?? null,
        created_by: admin?.id ?? null,
      });

    if (error) {
      skipped++;
      console.warn(`  ⚠  Skip "${event.title}": ${error.message}`);
    } else {
      inserted++;
      const d = new Date(event.date);
      const label = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
      console.log(`  ✅  ${label.padEnd(18)} ${event.title}`);
    }
  }

  console.log(`\n${"─".repeat(55)}`);
  console.log(`✨ Events selesai! Inserted: ${inserted}, Skipped: ${skipped}`);
  process.exit(0);
}

seedEvents().catch(err => {
  console.error("❌ Seed events gagal:", err.message);
  process.exit(1);
});

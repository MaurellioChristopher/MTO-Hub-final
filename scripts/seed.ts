import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

// Load .env.local
dotenv.config({ path: ".env.local" });

// ──────────────────────────────────────────────────────────────────────────────
// MTO-HUB Seed Script v2 — Username + Password Format Baru
//
// Format username : {NamaPendek}{DEPT}   → e.g. MaurellINTI
// Password user   : {NamaPendek}123      → e.g. Maurell123
// Password admin  : {NamaPendek}ADMIN123 → e.g. MaurellADMIN123
//
// Jalankan: npx tsx scripts/seed.ts
// ──────────────────────────────────────────────────────────────────────────────

const SALT_ROUNDS = 12;

interface MemberInput {
  name: string;
  nim: string;
  role: "Admin" | "User";
  department: "INTI" | "MI" | "MP" | "SD" | "SI";
  /** Nama pendek untuk username & password */
  shortName: string;
}

const members: MemberInput[] = [
  // ─── INTI ─────────────────────────────────────────────────────────────────
  { name: "Maurellio Christopher Yonathan", nim: "102022430009", role: "Admin", department: "INTI", shortName: "Maurell"   },
  { name: "Cinta Sari Hasbullah",          nim: "102012330384", role: "Admin",  department: "INTI", shortName: "Cinta"     },
  { name: "Alya Salma Khoerunnisaa",       nim: "102022430027", role: "Admin",  department: "INTI", shortName: "Alya"      },
  { name: "Sela Aulia Rokhmasari",         nim: "102012330089", role: "Admin",  department: "INTI", shortName: "Sela"      },

  // ─── MI ───────────────────────────────────────────────────────────────────
  { name: "Nadya Shandi Waranggani",       nim: "102012430030", role: "Admin",  department: "MI",   shortName: "Nadya"     },
  { name: "Siti Fadhilah Nur Nisrina",     nim: "102022400069", role: "User",  department: "MI",   shortName: "Siti"      },
  { name: "Mochamad Aldino",               nim: "102012530043", role: "User",  department: "MI",   shortName: "Aldino"    },
  { name: "Arsy Ananda Hidayatullah",      nim: "102022500061", role: "User",  department: "MI",   shortName: "Arsy"      },
  { name: "Fiina Salsabila",               nim: "102012300130", role: "User",  department: "MI",   shortName: "Fiina"     },
  { name: "Galuh Shafa Auliana Rahman",    nim: "102022400131", role: "User",  department: "MI",   shortName: "Galuh"     },
  { name: "Muhammad Daffa Fachrurozi",     nim: "102022400151", role: "User",  department: "MI",   shortName: "Daffa"     },

  // ─── MP ───────────────────────────────────────────────────────────────────
  { name: "Rakean Ahmad Zayyid Ardhi",     nim: "102022400160", role: "Admin",  department: "MP",   shortName: "Rakean"    },
  { name: "Muhammad Farhan Adly",          nim: "102022400149", role: "User",  department: "MP",   shortName: "Farhan"    },
  { name: "Aisya Husna Falihah",           nim: "102012500084", role: "User",  department: "MP",   shortName: "Aisya"     },
  { name: "Salsabila Febrianti",           nim: "102012300252", role: "User",  department: "MP",   shortName: "Salsa"     },
  { name: "Affan Maulana Raffi",           nim: "102022300224", role: "User",  department: "MP",   shortName: "Affan"     },
  { name: "Aurora Aquilla Pramesti",       nim: "102022500058", role: "User",  department: "MP",   shortName: "Aurora"    },

  // ─── SD ───────────────────────────────────────────────────────────────────
  { name: "I Nyoman Aditya Wahyu Nugraha", nim: "102012340269", role: "Admin",  department: "SD",   shortName: "Aditya"    },
  { name: "Annisa Shabrina",               nim: "102012500273", role: "User",  department: "SD",   shortName: "Annisa"    },
  { name: "Moch Fasya Fawana Adi Sagara",  nim: "102032400029", role: "User",  department: "SD",   shortName: "Fasya"     },
  { name: "Asep Ahmad Nugraha",            nim: "102032500074", role: "User",  department: "SD",   shortName: "Asep"      },
  { name: "Minati Nur Alifa",              nim: "102032400079", role: "User",  department: "SD",   shortName: "Minati"    },
  { name: "Mutiara Nabila Putri Muslim",   nim: "102032400070", role: "User",  department: "SD",   shortName: "Mutiara"   },
  { name: "Maulida Kyla Firamadani",       nim: "102022400075", role: "User",  department: "SD",   shortName: "Maulida"   },
  { name: "Ahmad Nabili Akmal",            nim: "102012500122", role: "User",  department: "SD",   shortName: "Nabili"    },
  { name: "Naifah Bratandari",             nim: "102022400048", role: "User",  department: "SD",   shortName: "Naifah"    },

  // ─── SI ───────────────────────────────────────────────────────────────────
  { name: "Deasy Hana Luisya Manurung",    nim: "102022400208", role: "Admin",  department: "SI",   shortName: "Deasy"     },
  { name: "Baiq Anjany Nabila Abrianti",   nim: "102012400349", role: "User",  department: "SI",   shortName: "Baiq"      },
  { name: "Muhammad Noval Agustian",       nim: "102022400013", role: "User",  department: "SI",   shortName: "Noval"     },
  { name: "Siti Zakiyah Iqrima Cantika",   nim: "102022530029", role: "User",  department: "SI",   shortName: "Zakiyah"   },
  { name: "Agum Jati Gumelar",             nim: "102032500076", role: "User",  department: "SI",   shortName: "Agum"      },
  { name: "Intan Callysta",                nim: "102022500073", role: "User",  department: "SI",   shortName: "Intan"     },
  { name: "Ayesha Elora Nuro Vitria",      nim: "102012500429", role: "User",  department: "SI",   shortName: "Ayesha"    },
];

/** Generate username: {ShortName}{DEPT} — e.g. MaurellINTI */
function makeUsername(m: MemberInput): string {
  return `${m.shortName}${m.department}`;
}

/** Generate password */
function makePassword(m: MemberInput): string {
  return m.role === "Admin"
    ? `${m.shortName}ADMIN123`   // e.g. MaurellADMIN123
    : `${m.shortName}123`;       // e.g. Cinta123
}

async function seed() {
  console.log("🌱 MTO-Hub — Seed Script v2 (Username Format Baru)\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL tidak ditemukan di .env.local!");
    process.exit(1);
  }

  const key = serviceRoleKey ?? publishableKey;
  if (!key) {
    console.error("❌ Supabase key tidak ditemukan!");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`🔗 Terhubung ke: ${supabaseUrl}\n`);

  // Cek tabel
  const { error: checkError } = await supabase.from("users").select("id").limit(1);
  if (checkError && checkError.code === "42P01") {
    console.error("❌ Tabel users belum ada! Jalankan scripts/schema.sql di Supabase SQL Editor dulu.");
    process.exit(1);
  }

  console.log("👥 Memasukkan / mengupdate 33 anggota MTO 25/26...\n");
  console.log(`${"─".repeat(70)}`);
  console.log(`${"USERNAME".padEnd(20)} ${"PASSWORD".padEnd(22)} ROLE    DEPT`);
  console.log(`${"─".repeat(70)}`);

  let inserted = 0;
  let failed = 0;

  for (const member of members) {
    const username = makeUsername(member);
    const password = makePassword(member);
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const email = `${member.nim}@mto-hub.id`;

    const { error } = await supabase.from("users").upsert(
      {
        name: member.name,
        nim: member.nim,
        username,
        email,
        role: member.role,
        department: member.department,
        password_hash: passwordHash,
        is_active: true,
      },
      { onConflict: "nim" }
    );

    if (error) {
      failed++;
      console.warn(`  ❌ ${member.name}: ${error.message}`);
    } else {
      inserted++;
      const roleIcon = member.role === "Admin" ? "🔐 Admin" : "👤 User ";
      console.log(
        `  ${username.padEnd(20)} ${password.padEnd(22)} ${roleIcon}  ${member.department}`
      );
    }
  }

  console.log(`\n${"─".repeat(70)}`);
  console.log(`✨ Selesai! Inserted/Updated: ${inserted}, Gagal: ${failed}`);
  console.log(`${"─".repeat(70)}`);
  console.log(`\n🔑 Cara Login:`);
  console.log(`   Username: MaurellINTI   Password: MaurellADMIN123  (Ketua Umum)`);
  console.log(`   Username: SasiINTI      Password: SasiADMIN123    (Wakil Ketua)\n`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("\n❌ Seed gagal:", err.message);
  process.exit(1);
});

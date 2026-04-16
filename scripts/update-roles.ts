import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// ──────────────────────────────────────────────────────────────────────────────
// Update roles: INTI + Kepala Departemen → Admin, sisanya → User
// ──────────────────────────────────────────────────────────────────────────────

// NIMs yang harus jadi Admin
const ADMIN_NIMS = new Set([
  // INTI (semua)
  "102022430009", // Maurellio Christoper Yonathan — Ketua Umum
  "102012340370", // Sasi Azhari Kirana Putri — Wakil Ketua Umum
  "102012330384", // Cinta Sari Hasbullah — Sekretaris
  "102022430027", // Alya Salma Khoerunisaa — Bendahara
  // Kepala Departemen
  "102022430030", // Nadya Shandi Waranggani — Kadep MI
  "102022400160", // Rakean Ahmad Zayyid Ardhi — Kadep MP
  "102012340269", // I Nyoman Aditya Wahyu Nugraha — Kadep SD
  "102022400208", // Deasy Hana Luisya Manurung — Kadep SI
]);

async function updateRoles() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log("🔄 Updating roles...\n");

  // Set all to User first
  await supabase.from("users").update({ role: "User" }).neq("id", "");

  // Set Admins
  const adminNimArray = [...ADMIN_NIMS];
  const { error } = await supabase
    .from("users")
    .update({ role: "Admin" })
    .in("nim", adminNimArray);

  if (error) {
    console.error("❌ Error updating roles:", error.message);
    process.exit(1);
  }

  // Verify
  const { data } = await supabase
    .from("users")
    .select("name, nim, department, role")
    .order("department");

  console.log("✅ Updated roles:\n");
  data?.forEach((u) => {
    const badge = u.role === "Admin" ? "🔐 Admin" : "👤 User ";
    console.log(`  ${badge}  [${u.department}] ${u.name}`);
  });

  console.log(`\n📊 Total Admin: ${data?.filter(u => u.role === "Admin").length}`);
  console.log(`📊 Total User : ${data?.filter(u => u.role === "User").length}`);
  process.exit(0);
}

updateRoles().catch(err => {
  console.error("❌", err.message);
  process.exit(1);
});

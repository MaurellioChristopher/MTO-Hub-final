import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/db";

// GET /api/motm/members?department=INTI
// Mengembalikan semua user aktif di departemen tertentu
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const department = searchParams.get("department");

  const supabase = getServerClient();

  let query = supabase
    .from("users")
    .select("id, name, nim, department, role")
    .eq("is_active", true)
    .order("name");

  if (department) {
    if (department === "INTI") {
      query = query.or("department.eq.INTI,role.eq.Admin");
    } else {
      query = query.eq("department", department);
    }
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

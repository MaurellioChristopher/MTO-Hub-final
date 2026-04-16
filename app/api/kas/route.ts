import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/db";
import { auth } from "@/lib/auth";

const BENDAHARA_NIM = "102022430027"; // Alya Salma Khoerunisaa

async function isAuthorized(session: any) {
  if (!session?.user) return false;
  return session.user.role === "Admin" || session.user.nim === BENDAHARA_NIM;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year")) || 2026;

  const supabase = getServerClient();

  // 1. Get all active users
  const { data: users, error: userErr } = await supabase
    .from("users")
    .select("id, name, nim, department, role")
    .eq("is_active", true)
    .order("department")
    .order("name");

  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 });

  // 2. Get all kas_payments for the year
  const { data: payments, error: payErr } = await supabase
    .from("kas_payments")
    .select("user_id, month")
    .eq("year", year);

  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

  return NextResponse.json({ users, payments });
}

export async function POST(req: Request) {
  const session = await auth();
  const authorized = await isAuthorized(session);

  if (!authorized) {
    return NextResponse.json({ error: "Hanya Bendahara atau Admin yang diizinkan." }, { status: 403 });
  }

  const { targetId, month, year, status } = await req.json();

  if (!targetId || !month || !year || typeof status === "undefined") {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const supabase = getServerClient();

  if (status) {
    // True: Insert (Paid)
    const { error } = await supabase
      .from("kas_payments")
      .upsert(
        { user_id: targetId, month, year },
        { onConflict: "user_id,month,year" } // safety, though insert should fail if exists, upsert just bypasses error
      );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // False: Delete (Unpaid)
    const { error } = await supabase
      .from("kas_payments")
      .delete()
      .eq("user_id", targetId)
      .eq("month", month)
      .eq("year", year);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

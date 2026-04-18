import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/motm/work-log
// Body: { month, year, content }
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { month, year, content } = await req.json();

    if (!month || !year || content === undefined) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // Restriction: Only allow work log for CURRENT month/year
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    if (month !== curMonth || year !== curYear) {
      return NextResponse.json({ error: "Hanya dapat mengisi laporan untuk bulan berjalan" }, { status: 403 });
    }

    const supabase = getServerClient();

    const { error } = await supabase.from("motm_work_logs").upsert(
      {
        user_id: session.user.id,
        month,
        year,
        content: content.trim(),
      },
      { onConflict: "user_id,month,year" }
    );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Work log POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/motm/work-log?month=4&year=2026&department=INTI
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const department = searchParams.get("department");

  if (!month || !year) {
    return NextResponse.json({ error: "Month and Year required" }, { status: 400 });
  }

  const supabase = getServerClient();

  // If department is provided, we fetch logs for all users in that department
  // This is used for the rating UI
  if (department) {
    const { data, error } = await supabase
      .from("motm_work_logs")
      .select("user_id, content")
      .eq("month", Number(month))
      .eq("year", Number(year))
      .in(
        "user_id",
        (
          await supabase
            .from("users")
            .select("id")
            .eq("department", department)
            .eq("is_active", true)
        ).data?.map((u) => u.id) || []
      );

    if (error) {
      if (error.message.includes("not find")) return NextResponse.json([]);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  }

  // Otherwise, fetch just for the current user (to populate their own report input)
  const { data, error } = await supabase
    .from("motm_work_logs")
    .select("content")
    .eq("user_id", session.user.id)
    .eq("month", Number(month))
    .eq("year", Number(year))
    .single();

  if (error) {
    // PGRST116: No rows found, PGRST204/205: Table not found
    if (error.code === "PGRST116" || error.message.includes("not find")) {
      return NextResponse.json({ content: "" });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? { content: "" });
}

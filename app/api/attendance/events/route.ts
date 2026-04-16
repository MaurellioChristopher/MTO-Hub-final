import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/attendance/events — daftar upcoming + recent events
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServerClient();
  const today = new Date().toISOString().split("T")[0];
  // 7 hari lalu sampai 60 hari ke depan
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const to   = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, date, description, location")
    .gte("date", from)
    .lte("date", to)
    .order("date");

  if (error) return NextResponse.json([], { status: 200 });

  // Hitung summary attendance per event
  const summaries = await Promise.all(
    (events ?? []).map(async (event) => {
      const { data: att } = await supabase
        .from("attendance")
        .select("status")
        .eq("event_id", event.id);

      const counts = { present: 0, excused: 0, absent: 0, total: att?.length ?? 0 };
      att?.forEach((a) => {
        if (a.status === "present") counts.present++;
        else if (a.status === "excused") counts.excused++;
        else counts.absent++;
      });

      return { ...event, attendance_summary: counts };
    })
  );

  return NextResponse.json(summaries);
}

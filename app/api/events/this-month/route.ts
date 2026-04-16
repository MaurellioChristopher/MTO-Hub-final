import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate   = new Date(year, month, 0).toISOString().split("T")[0]; // last day of month

  try {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from("events")
      .select("id, title, date, description, location")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date");

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("Events API error:", err);
    return NextResponse.json([], { status: 200 }); // graceful fallback
  }
}

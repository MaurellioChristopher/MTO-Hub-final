import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET: Fetch last 10 notifications
export async function GET() {
  try {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from("notifications")
      .select(`
        id,
        title,
        content,
        created_at,
        created_by,
        users (name)
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Fetch notifications error:", error);
    // If table doesn't exist, return empty array to prevent crash
    return NextResponse.json([], { status: 200 });
  }
}

// POST: Add new notification (Admin only)
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { title, content } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content required" }, { status: 400 });
    }

    const supabase = getServerClient();
    const { data, error } = await supabase
      .from("notifications")
      .insert([
        {
          title,
          content,
          created_by: session.user.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("Create notification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

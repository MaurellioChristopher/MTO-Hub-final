import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { aspirasiId, reply } = await req.json();

    if (!aspirasiId || !reply || reply.trim().length === 0) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const supabase = getServerClient();

    const { error } = await supabase.from("aspirasi_replies").insert({
      aspirasi_id: aspirasiId,
      user_id: session.user.id,
      reply_text: reply.trim(),
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

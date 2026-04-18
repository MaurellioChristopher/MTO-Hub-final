import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/db";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Password saat ini dan password baru harus diisi" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password baru minimal 6 karakter" }, { status: 400 });
    }

    const supabase = getServerClient();

    // 1. Fetch current password hash
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", session.user.id)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: "Gagal mengambil data user" }, { status: 500 });
    }

    // 2. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });
    }

    // 3. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 4. Update database
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: hashedPassword })
      .eq("id", session.user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, message: "Password berhasil diperbarui" });
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}

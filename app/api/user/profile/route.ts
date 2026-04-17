import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/db";
import { auth } from "@/lib/auth";

// ── PATCH: Update bio, socialLinks, dan/atau avatar ───────────────────────────
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  // ── Case 1: Avatar upload (multipart/form-data) ─────────────────────────────
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await req.formData();
      const file = formData.get("avatar") as File;

      if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
      if (file.size > 3 * 1024 * 1024) return NextResponse.json({ error: "Ukuran foto maksimal 3MB" }, { status: 400 });

      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        return NextResponse.json({ error: "Hanya JPG, PNG, WebP yang diizinkan" }, { status: 400 });
      }

      const supabase = getServerClient();

      // Upload ke Supabase Storage bucket "avatars"
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${session.user.id}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (uploadErr) throw new Error("Gagal upload foto: " + uploadErr.message);

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      // Append cache buster agar browser reload
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: dbErr } = await supabase
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", session.user.id);

      if (dbErr) throw dbErr;

      return NextResponse.json({ success: true, avatar_url: avatarUrl });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // ── Case 2: JSON update (bio + social_links) ────────────────────────────────
  try {
    const body = await req.json();
    const { bio, social_links } = body;

    // Build update object — only include fields that were sent
    const updates: Record<string, any> = {};
    if (bio !== undefined)          updates.bio          = bio?.trim() || null;
    if (social_links !== undefined) updates.social_links = social_links;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Tidak ada data yang diupdate" }, { status: 400 });
    }

    const supabase = getServerClient();
    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── GET: Fetch profil user saat ini (lengkap) ─────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, nim, username, email, role, department, bio, avatar_url, social_links, created_at")
    .eq("id", session.user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

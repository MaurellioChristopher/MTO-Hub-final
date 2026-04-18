import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET: Ambil semua galeri
export async function GET() {
  const supabase = getServerClient();

  const { data: posts, error: postErr } = await supabase
    .from("gallery_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (postErr) return NextResponse.json({ error: postErr.message }, { status: 500 });
  if (!posts || posts.length === 0) return NextResponse.json([]);

  const { data: users } = await supabase.from("users").select("id, name, department");
  const userMap = Object.fromEntries((users || []).map((u) => [u.id, u]));

  const { data: comments } = await supabase
    .from("gallery_comments")
    .select("*")
    .order("created_at", { ascending: true });

  const enriched = posts.map((p) => {
    const postComments = (comments || [])
      .filter((c) => c.gallery_post_id === p.id)
      .map((c) => ({
        id: c.id,
        user_id: c.user_id,
        comment_text: c.comment_text,
        created_at: c.created_at,
        commenter_name: userMap[c.user_id]?.name || "Unbeknownst User",
        commenter_dept: userMap[c.user_id]?.department || "??",
      }));

    return {
      ...p,
      uploader_name: userMap[p.user_id]?.name || "Unbeknownst User",
      uploader_dept: userMap[p.user_id]?.department || "??",
      comments: postComments,
    };
  });

  return NextResponse.json(enriched);
}

// POST: Upload gambar baru
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const caption = formData.get("caption") as string;
    const eventDate = formData.get("eventDate") as string;
    const driveLink = formData.get("driveLink") as string;
    const file = formData.get("file") as File;

    // Validation: Title, Caption, and Date are always required.
    // File is required UNLESS a driveLink is provided.
    if (!title || !caption || !eventDate) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    if (!file && !driveLink) {
      return NextResponse.json({ error: "Unggah foto atau sertakan link Google Drive" }, { status: 400 });
    }

    const supabase = getServerClient();
    let imageUrl = null;

    // 1. Upload to Storage only if file exists
    if (file && file.size > 0) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return NextResponse.json({ error: "Gagal mengunggah thumbnail ke storage: " + uploadError.message }, { status: 500 });
      }

      const { data: publicUrlData } = supabase.storage
        .from("gallery")
        .getPublicUrl(fileName);

      imageUrl = publicUrlData.publicUrl;
    }

    // 3. Simpan ke database
    const { error: dbError } = await supabase.from("gallery_posts").insert({
      user_id: userId,
      title,
      caption,
      event_date: eventDate,
      image_url: imageUrl,
      drive_link: driveLink?.trim() || null,
    });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Gallery POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus postingan sendiri
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("id");

  if (!postId) return NextResponse.json({ error: "ID missing" }, { status: 400 });

  const supabase = getServerClient();

  const { data: post, error: getErr } = await supabase
    .from("gallery_posts")
    .select("user_id, image_url")
    .eq("id", postId)
    .single();

  if (getErr || !post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (post.user_id !== session.user.id && session.user.role !== "Admin") {
    return NextResponse.json({ error: "Hanya pemilik/Admin yang bisa menghapus" }, { status: 403 });
  }

  // 1. Ekstrak nama file dari URL jika ada
  if (post.image_url) {
    const fileNameMatches = post.image_url.match(/\/gallery\/(.+)$/);
    if (fileNameMatches && fileNameMatches[1]) {
      const fileName = fileNameMatches[1];
      await supabase.storage.from("gallery").remove([fileName]);
    }
  }

  // 2. Hapus dari database
  const { error: delErr } = await supabase.from("gallery_posts").delete().eq("id", postId);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

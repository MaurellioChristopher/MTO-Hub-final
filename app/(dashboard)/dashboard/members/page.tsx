import { getServerClient } from "@/lib/db";
import { MembersClient } from "@/components/members/members-client";
import type { Metadata } from "next";
import type { Member } from "@/types";

export const metadata: Metadata = {
  title: "MTO Staff | MTO-Hub",
  description: "Daftar lengkap anggota Managerial Trainer Organization 25/26",
};

export const dynamic = "force-dynamic";

async function getMembers(): Promise<Member[]> {
  try {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, name, nim, email, role, department, is_active, created_at, bio, avatar_url, social_links")
      .eq("is_active", true)
      .order("department")
      .order("name");

    if (error) throw error;
    return (data ?? []) as Member[];
  } catch (err) {
    console.error("Failed to fetch members:", err);
    return [];
  }
}

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <div className="space-y-6">
      <MembersClient members={members} />
    </div>
  );
}

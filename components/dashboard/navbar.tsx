"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { Bell, Menu, X, LogOut, User, Settings, Info, Edit2, Check, Loader2, Plus, Megaphone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sidebar } from "./sidebar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Selamat datang kembali di MTO-Hub",
  },
  "/dashboard/members": {
    title: "Manajemen Anggota",
    subtitle: "Data 33 anggota MTO 25/26",
  },
  "/dashboard/attendance": {
    title: "Absensi",
    subtitle: "Rekap kehadiran event MTO",
  },
  "/dashboard/motm": {
    title: "MOTM Rating",
    subtitle: "Penilaian Member of the Month",
  },
  "/dashboard/feedback": {
    title: "Feedback & Evaluasi",
    subtitle: "Formulir evaluasi event dan anggota",
  },
  "/dashboard/settings": {
    title: "Pengaturan Profil",
    subtitle: "Edit foto, bio, dan social media kamu",
  },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const deptColors: Record<string, string> = {
  INTI: "#DC143C",
  MI: "#D4AF37",
  MP: "#4F8EF7",
  SD: "#22C55E",
  SI: "#A855F7",
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, update } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  
  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [fetchingNotifs, setFetchingNotifs] = useState(false);
  const [addNotifOpen, setAddNotifOpen] = useState(false);
  const [newNotif, setNewNotif] = useState({ title: "", content: "" });
  const [isSubmittingNotif, setIsSubmittingNotif] = useState(false);
  
  // Bio editing states
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState(session?.user?.bio || "");
  const [isSavingBio, setIsSavingBio] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (session?.user?.bio) {
      setBioValue(session.user.bio);
    }
  }, [session?.user?.bio]);

  async function fetchNotifications() {
    setFetchingNotifs(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } finally {
      setFetchingNotifs(false);
    }
  }

  async function handleAddNotification() {
    if (!newNotif.title || !newNotif.content) return;
    setIsSubmittingNotif(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNotif),
      });

      if (!res.ok) throw new Error("Gagal menambah notifikasi");

      toast.success("Notifikasi berhasil disiarkan!");
      setAddNotifOpen(false);
      setNewNotif({ title: "", content: "" });
      fetchNotifications();
    } catch (error) {
      toast.error("Gagal mengirim notifikasi.");
    } finally {
      setIsSubmittingNotif(false);
    }
  }

  const currentPage = pageTitles[pathname] ?? {
    title: "MTO-Hub",
    subtitle: "Portal Organisasi MTO",
  };

  const isAdmin = session?.user?.role === "Admin";
  const dept = session?.user?.department ?? "INTI";
  const deptColor = deptColors[dept] ?? "#DC143C";

  const handleSaveBio = async () => {
    setIsSavingBio(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bioValue }),
      });

      if (!res.ok) throw new Error("Gagal update bio");

      // Update session locally
      await update({ bio: bioValue });
      
      setIsEditingBio(false);
      toast.success("Bio berhasil diperbarui!");
    } catch (error) {
      toast.error("Terjadi kesalahan sistem saat memperbarui bio.");
    } finally {
      setIsSavingBio(false);
    }
  };

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center gap-4 px-4 md:px-6"
      style={{
        background: "rgba(10,10,15,0.80)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Mobile menu trigger */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger
          render={
            <button
              id="mobile-menu-trigger"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground md:hidden"
            >
              <Menu size={20} />
            </button>
          }
        />
        <SheetContent side="left" className="w-64 p-0 border-r-0">
          <Sidebar onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold text-foreground leading-tight truncate">
          {currentPage.title}
        </h2>
        <p className="text-xs text-muted-foreground leading-tight hidden sm:block">
          {currentPage.subtitle}
        </p>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Notification bell dropdown */}
        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger
            render={
              <button
                id="notification-bell"
                className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                aria-label="Notifikasi"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span
                    className="absolute -right-0.5 -top-0.5 flex h-2 w-2 rounded-full"
                    style={{ background: "#DC143C", boxShadow: "0 0 6px rgba(220,20,60,0.7)" }}
                  />
                )}
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-80 bg-[#111116] border-white/10 p-2 shadow-2xl">
            <DropdownMenuGroup className="flex items-center justify-between px-2 pb-2">
              <DropdownMenuLabel className="flex items-center gap-2 text-foreground font-bold">
                <Info size={14} className="text-[#DC143C]" />
                Notifikasi
              </DropdownMenuLabel>
              {isAdmin && (
                <button 
                  onClick={() => { setNotifOpen(false); setAddNotifOpen(true); }}
                  className="flex items-center gap-1 text-[10px] font-bold text-[#4F8EF7] hover:underline"
                >
                  <Plus size={12} /> Tambah
                </button>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-white/5" />
            
            <div className="max-h-80 overflow-y-auto py-2 px-2 custom-scrollbar">
              {fetchingNotifs ? (
                <div className="flex flex-col items-center py-8 gap-3 opacity-40">
                  <Loader2 size={24} className="animate-spin" />
                  <p className="text-xs">Memuat pesan...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center py-8 gap-3 opacity-40">
                  <Bell size={24} />
                  <p className="text-xs text-center">Belum ada notifikasi baru untuk Anda.</p>
                </div>
              ) : (
                <div className="space-y-3 pb-2">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] font-bold text-[#DC143C] uppercase tracking-tighter">MTO BROADCAST</p>
                        <p className="text-[9px] text-muted-foreground">
                          {new Date(notif.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <p className="text-[13px] text-foreground font-bold leading-tight mb-1">
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {notif.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem className="justify-center text-[10px] font-bold text-muted-foreground cursor-pointer uppercase tracking-widest pt-2">
              Lihat Histori Lengkap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Add Notification Sheet (Admin Only) */}
        <Sheet open={addNotifOpen} onOpenChange={setAddNotifOpen}>
          <SheetContent side="right" className="sm:max-w-md bg-[#0D0D14] border-l-white/5 p-6 shadow-2xl">
            <SheetHeader className="pb-6">
              <SheetTitle className="text-xl font-bold flex items-center gap-2 text-white">
                <Megaphone size={20} className="text-[#DC143C]" />
                Siarkan Notifikasi
              </SheetTitle>
              <SheetDescription className="text-muted-foreground">
                Pesan ini akan langsung tampil di seluruh dashboard anggota MTO.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Judul Notifikasi</label>
                <input 
                  type="text"
                  placeholder="Contoh: Pengumuman Rapat Pleno"
                  value={newNotif.title}
                  onChange={(e) => setNewNotif(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#DC143C]/50 outline-none transition-all placeholder:text-white/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Isi Pesan</label>
                <textarea 
                  placeholder="Tuliskan pesan yang ingin disampaikan..."
                  value={newNotif.content}
                  onChange={(e) => setNewNotif(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full h-40 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#DC143C]/50 outline-none transition-all resize-none placeholder:text-white/20"
                />
              </div>

              <button
                onClick={handleAddNotification}
                disabled={isSubmittingNotif || !newNotif.title || !newNotif.content}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                style={{ 
                  background: "linear-gradient(135deg, #DC143C, #8B0000)",
                  boxShadow: "0 8px 16px rgba(220,20,60,0.15)"
                }}
              >
                {isSubmittingNotif ? (
                  <><Loader2 size={16} className="animate-spin" /> Sedang Menyiarkan...</>
                ) : (
                  <><Check size={16} /> Beri Tahu Sekarang</>
                )}
              </button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* User profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity outline-none">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-foreground leading-tight">
                    {session?.user?.name?.split(" ")[0] ?? "User"}
                  </p>
                  <div className="flex items-center justify-end gap-1">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: deptColor }}
                    />
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {dept} · MTO 25/26
                    </p>
                  </div>
                </div>

                <Avatar className="h-8 w-8">
                  <AvatarFallback
                    className="text-xs font-bold text-white shadow-inner"
                    style={{ background: `linear-gradient(135deg, ${deptColor}, ${deptColor}99)` }}
                  >
                    {session?.user?.name ? getInitials(session.user.name) : "?"}
                  </AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-80 bg-[#0D0D14] border-white/10 p-3 shadow-2xl">
            {/* Header / Info */}
            <div className="flex items-center gap-4 p-2 mb-4">
              <Avatar className="h-12 w-12 border-2 border-white/5">
                <AvatarFallback
                  className="text-sm font-black text-white"
                  style={{ background: `linear-gradient(135deg, ${deptColor}, ${deptColor}99)` }}
                >
                  {session?.user?.name ? getInitials(session.user.name) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-bold text-foreground text-base truncate">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.nim} • {session?.user?.role}</p>
                <Badge 
                  variant="outline" 
                  className="mt-1.5 text-[10px] py-0 px-2 font-bold"
                  style={{ borderColor: `${deptColor}40`, color: deptColor, background: `${deptColor}10` }}
                >
                  {dept} Department
                </Badge>
              </div>
            </div>

            <DropdownMenuSeparator className="bg-white/5" />

            {/* Bio Section */}
            <div className="py-4 px-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tentang Saya</p>
                {!isEditingBio ? (
                  <button 
                    onClick={(e) => { e.preventDefault(); setIsEditingBio(true); }}
                    className="text-[10px] font-bold text-[#4F8EF7] hover:underline flex items-center gap-1"
                  >
                    <Edit2 size={10} /> Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.preventDefault(); handleSaveBio(); }}
                      disabled={isSavingBio}
                      className="text-[10px] font-bold text-green-400 hover:text-green-300 flex items-center gap-1"
                    >
                      {isSavingBio ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} Simpan
                    </button>
                    <button 
                      onClick={(e) => { e.preventDefault(); setIsEditingBio(false); }}
                      className="text-[10px] font-bold text-red-400 hover:text-red-300"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
              
              {isEditingBio ? (
                <textarea
                  value={bioValue}
                  onChange={(e) => setBioValue(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Ceritakan sedikit tentang dirimu..."
                  className="w-full h-20 bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-[#4F8EF7]/50 outline-none resize-none"
                  autoFocus
                />
              ) : (
                <p className="text-xs text-white/70 italic leading-relaxed">
                  {session?.user?.bio || "Belum ada bio. Tambahkan untuk memperkenalkan dirimu!"}
                </p>
              )}
            </div>

            <DropdownMenuSeparator className="bg-white/5" />

            {/* Actions */}
            <button
              onClick={() => router.push("/dashboard/settings")}
              className="w-full flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-white/5 cursor-pointer transition-colors"
            >
              <Settings size={14} className="text-muted-foreground" />
              <span>Pengaturan Akun</span>
            </button>

            <div className="my-1 h-px bg-white/5" />

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors font-bold"
            >
              <LogOut size={14} />
              <span>Keluar Sesi</span>
            </button>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

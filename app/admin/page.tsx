"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Settings, BookPlus, LayoutDashboard,
  BookOpen, Loader2, ChevronRight,
  Activity, Shield, Zap, Server, ShieldCheck, UserCheck, Save, UploadCloud, Trash2, Hash, Calendar,
  Users, Award, Search, Bookmark, Star, Clock, Bell
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAdmin = session?.user?.role === "admin";
  const isStaff = isAdmin || session?.user?.role === "mod";

  // Dashboard Tabs State
  const [activeTab, setActiveTab] = useState<"overview" | "manga" | "users" | "settings" | "notifications">("overview");

  // Stats
  const [stats, setStats] = useState<{ mangaCount: number; chapterCount: number } | null>(null);

  // Settings States
  const [guilds, setGuilds] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<string>("");
  const [selectedDefaultRole, setSelectedDefaultRole] = useState<string>("");
  const [selectedAdminRole, setSelectedAdminRole] = useState<string>("");
  const [selectedFounderRole, setSelectedFounderRole] = useState<string>("");
  const [selectedNotificationChannel, setSelectedNotificationChannel] = useState<string>("");
  const [topBannerUrl, setTopBannerUrl] = useState<string>("");
  const [topBannerLink, setTopBannerLink] = useState<string>("");
  const [bottomBannerUrl, setBottomBannerUrl] = useState<string>("");
  const [bottomBannerLink, setBottomBannerLink] = useState<string>("");
  const [loadingGuilds, setLoadingGuilds] = useState<boolean>(false);
  const [loadingRoles, setLoadingRoles] = useState<boolean>(false);
  const [loadingChannels, setLoadingChannels] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [settingsMessage, setSettingsMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Takvim Düzenleme State'leri
  const [mangas, setMangas] = useState<any[]>([]);
  const [loadingMangas, setLoadingMangas] = useState<boolean>(false);
  const [updatingMangaId, setUpdatingMangaId] = useState<string | null>(null);

  // Kullanıcı Yönetim State'leri
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Rozet Yönetim Modal State'leri (Kullanıcı Listesi İçin)
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState<boolean>(false);
  const [targetUserForBadges, setTargetUserForBadges] = useState<any>(null);
  const [editingBadge, setEditingBadge] = useState<any>(null);
  const [badgeFormName, setBadgeFormName] = useState<string>("");
  const [badgeFormDescription, setBadgeFormDescription] = useState<string>("");
  const [badgeFormColor, setBadgeFormColor] = useState<string>("bg-violet-500/10 text-violet-400 border-violet-500/20");
  const [badgeFormIcon, setBadgeFormIcon] = useState<string>("Award");
  const [badgeActionLoading, setBadgeActionLoading] = useState<boolean>(false);

  // Predefined Global Badges States
  const [globalBadges, setGlobalBadges] = useState<any[]>([]);
  const [loadingGlobalBadges, setLoadingGlobalBadges] = useState<boolean>(false);
  const [isBadgeLibraryModalOpen, setIsBadgeLibraryModalOpen] = useState<boolean>(false);

  // Notification States & Handlers
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);
  const [notificationTitle, setNotificationTitle] = useState<string>("");
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [sendingNotification, setSendingNotification] = useState<boolean>(false);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Bildirimler yüklenirken hata:", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationTitle || !notificationMessage) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }
    setSendingNotification(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: notificationTitle, message: notificationMessage }),
      });
      if (res.ok) {
        const newNotif = await res.json();
        setNotifications((prev) => [newNotif, ...prev]);
        setNotificationTitle("");
        setNotificationMessage("");
        alert("Bildirim başarıyla gönderildi!");
      } else {
        const err = await res.json();
        alert(err.error || "Bildirim gönderilemedi.");
      }
    } catch (err) {
      console.error("Bildirim gönderme hatası:", err);
      alert("Bildirim gönderilirken bir hata oluştu.");
    } finally {
      setSendingNotification(false);
    }
  };

  const handleDeleteNotification = async (notifId: string) => {
    if (!confirm("Bu bildirimi silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/notifications?notificationId=${notifId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== notifId));
      } else {
        const err = await res.json();
        alert(err.error || "Bildirim silinemedi.");
      }
    } catch (err) {
      console.error("Bildirim silme hatası:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "notifications") {
      fetchNotifications();
    }
  }, [activeTab]);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/mangas", { cache: "no-store" });
        if (res.ok) {
          const mangasData = await res.json();
          let totalChapters = 0;
          for (const manga of mangasData) {
            try {
              const cRes = await fetch(`/api/mangas/${manga._id}/chapters`);
              if (cRes.ok) {
                const chapters = await cRes.json();
                totalChapters += chapters.length;
              }
            } catch {}
          }
          setStats({ mangaCount: mangasData.length, chapterCount: totalChapters });
        }
      } catch (err) {
        console.error("İstatistikler yüklenirken hata:", err);
      }
    };
    fetchStats();
  }, []);

  // Load settings (staff: admin + mod)
  useEffect(() => {
    const role = session?.user?.role;
    if (role !== "admin" && role !== "mod") return;
    
    const loadSettings = async () => {
      setLoadingGuilds(true);
      try {
        const settingsRes = await fetch("/api/admin/settings");
        let currentGuildId = "";
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.guildId) {
            currentGuildId = settingsData.guildId;
            setSelectedGuild(settingsData.guildId);
            setSelectedDefaultRole(settingsData.defaultRoleId || "");
            setSelectedAdminRole(settingsData.adminRoleId || "");
            setSelectedFounderRole(settingsData.founderRoleId || "");
            setSelectedNotificationChannel(settingsData.notificationChannelId || "");
          }
          setTopBannerUrl(settingsData.topBannerUrl || "");
          setTopBannerLink(settingsData.topBannerLink || "");
          setBottomBannerUrl(settingsData.bottomBannerUrl || "");
          setBottomBannerLink(settingsData.bottomBannerLink || "");
        }

        const guildsRes = await fetch("/api/admin/discord/guilds");
        if (guildsRes.ok) {
          const guildsData = await guildsRes.json();
          setGuilds(guildsData);
          if (currentGuildId) {
            loadRoles(currentGuildId);
            loadChannels(currentGuildId);
          }
        }
      } catch (err) {
        console.error("Ayarlar yüklenirken hata:", err);
      } finally {
        setLoadingGuilds(false);
        setSettingsLoaded(true);
      }
    };
    loadSettings();
  }, [session?.user?.role]);

  // Takvim düzenleme için mangaları çek
  useEffect(() => {
    if (isStaff) {
      const fetchMangas = async () => {
        setLoadingMangas(true);
        try {
          const res = await fetch("/api/mangas", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            setMangas(data);
          }
        } catch (err) {
          console.error("Takvim mangaları yüklenirken hata:", err);
        } finally {
          setLoadingMangas(false);
        }
      };
      fetchMangas();
    }
  }, [isStaff]);

  // Kullanıcı listesini çek
  useEffect(() => {
    if (isStaff && activeTab === "users") {
      const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
          const res = await fetch("/api/admin/users", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            setUsers(data);
          }
        } catch (err) {
          console.error("Kullanıcılar yüklenirken hata:", err);
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
      fetchGlobalBadges();
    }
  }, [isStaff, activeTab]);

  const handleScheduleDayChange = async (mangaId: string, newDay: string) => {
    setUpdatingMangaId(mangaId);
    try {
      const mangaToUpdate = mangas.find(m => m._id === mangaId);
      if (!mangaToUpdate) return;

      const res = await fetch(`/api/mangas/${mangaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleDay: newDay
        })
      });

      if (res.ok) {
        setMangas(prev => prev.map(m => m._id === mangaId ? { ...m, scheduleDay: newDay } : m));
        router.refresh();
      } else {
        const errData = await res.json();
        alert(errData.error || "Yayın günü güncellenemedi.");
      }
    } catch (err) {
      console.error("Yayın günü güncelleme hatası:", err);
      alert("Bağlantı hatası oluştu.");
    } finally {
      setUpdatingMangaId(null);
    }
  };

  const handleGuildChange = (guildId: string) => {
    setSelectedGuild(guildId);
    setSelectedDefaultRole("");
    setSelectedAdminRole("");
    setSelectedFounderRole("");
    setSelectedNotificationChannel("");
    setRoles([]);
    setChannels([]);
    if (guildId) {
      loadRoles(guildId);
      loadChannels(guildId);
    }
  };

  const loadRoles = async (guildId: string) => {
    setLoadingRoles(true);
    try {
      const res = await fetch(`/api/admin/discord/roles?guildId=${guildId}`);
      if (res.ok) {
        const rolesData = await res.json();
        const filteredRoles = rolesData.filter((role: any) => role.id !== guildId && role.name !== "@everyone");
        setRoles(filteredRoles);
      }
    } catch (err) {
      console.error("Roller yüklenirken hata:", err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadChannels = async (guildId: string) => {
    setLoadingChannels(true);
    try {
      const res = await fetch(`/api/admin/discord/channels?guildId=${guildId}`);
      if (res.ok) {
        const channelsData = await res.json();
        setChannels(channelsData);
      }
    } catch (err) {
      console.error("Kanallar yüklenirken hata:", err);
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSettingsMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId: selectedGuild,
          defaultRoleId: selectedDefaultRole,
          adminRoleId: selectedAdminRole,
          founderRoleId: selectedFounderRole,
          notificationChannelId: selectedNotificationChannel,
          topBannerUrl, topBannerLink, bottomBannerUrl, bottomBannerLink,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ayarlar kaydedilirken bir hata oluştu.");
      setSettingsMessage({ text: "Ayarlar başarıyla kaydedildi!", isError: false });
    } catch (err: any) {
      setSettingsMessage({ text: err.message, isError: true });
    } finally {
      setSaving(false);
    }
  };

  // Rozet Yönetim Fonksiyonları
  const openBadgeModalForUser = (user: any) => {
    setTargetUserForBadges(user);
    setIsBadgeModalOpen(true);
  };

  const handleEditBadgeClick = (badge: any) => {
    setEditingBadge(badge);
    setBadgeFormName(badge.name);
    setBadgeFormDescription(badge.description);
    setBadgeFormColor(badge.color);
    setBadgeFormIcon(badge.icon);
  };

  const fetchGlobalBadges = async () => {
    setLoadingGlobalBadges(true);
    try {
      const res = await fetch("/api/admin/badges");
      if (res.ok) {
        const data = await res.json();
        setGlobalBadges(data);
      }
    } catch (err) {
      console.error("Global rozetler yüklenirken hata:", err);
    } finally {
      setLoadingGlobalBadges(false);
    }
  };

  const handleSaveGlobalBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeFormName || !badgeFormDescription || !badgeFormColor || !badgeFormIcon) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }

    setBadgeActionLoading(true);
    try {
      const isEditing = !!editingBadge;
      const method = isEditing ? "PUT" : "POST";
      const body = isEditing 
        ? { badgeId: editingBadge._id, name: badgeFormName, description: badgeFormDescription, color: badgeFormColor, icon: badgeFormIcon }
        : { name: badgeFormName, description: badgeFormDescription, color: badgeFormColor, icon: badgeFormIcon };

      const res = await fetch("/api/admin/badges", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        if (isEditing) {
          setGlobalBadges((prev) => prev.map((b) => b._id === data._id ? data : b));
        } else {
          setGlobalBadges((prev) => [data, ...prev]);
        }
        setEditingBadge(null);
        setBadgeFormName("");
        setBadgeFormDescription("");
        alert("Global rozet başarıyla kaydedildi!");
      } else {
        const errData = await res.json();
        alert(errData.error || "Rozet kaydedilemedi.");
      }
    } catch (err) {
      console.error("Global rozet kaydedilirken hata:", err);
      alert("Rozet kaydedilirken hata oluştu.");
    } finally {
      setBadgeActionLoading(false);
    }
  };

  const handleDeleteGlobalBadge = async (badgeId: string) => {
    if (!confirm("Bu global rozeti tamamen silmek istediğinize emin misiniz? (Bu rozet tüm kullanıcılardan silinecektir)")) return;
    setBadgeActionLoading(true);
    try {
      const res = await fetch(`/api/admin/badges?badgeId=${badgeId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setGlobalBadges((prev) => prev.filter((b) => b._id !== badgeId));
        // Remove locally from all users
        setUsers((prevUsers) => {
          return prevUsers.map((u) => {
            const updatedCustomBadges = u.customBadges?.filter((cb: any) => cb._id !== badgeId) || [];
            const dynamicBadges = u.badges.filter((b: any) => !b.isCustom);
            const newCustomBadges = updatedCustomBadges.map((cb: any) => ({
              id: cb._id,
              name: cb.name,
              description: cb.description,
              color: cb.color,
              icon: cb.icon,
              isCustom: true
            }));
            return {
              ...u,
              customBadges: updatedCustomBadges,
              badges: [...newCustomBadges, ...dynamicBadges]
            };
          });
        });
        alert("Global rozet başarıyla silindi!");
      } else {
        const errData = await res.json();
        alert(errData.error || "Rozet silinemedi.");
      }
    } catch (err) {
      console.error("Global rozet silme hatası:", err);
    } finally {
      setBadgeActionLoading(false);
    }
  };

  const handleAssignBadgeToUser = async (badgeId: string) => {
    if (!targetUserForBadges) return;
    setBadgeActionLoading(true);
    try {
      const res = await fetch(`/api/profile/${targetUserForBadges.discordId}/badges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeId }),
      });

      if (res.ok) {
        const data = await res.json();
        updateLocalUserBadges(data.customBadges);
      } else {
        const errData = await res.json();
        alert(errData.error || "Rozet atanamadı.");
      }
    } catch (err) {
      console.error("Rozet atama hatası:", err);
    } finally {
      setBadgeActionLoading(false);
    }
  };

  const handleUnassignBadgeFromUser = async (badgeId: string) => {
    if (!targetUserForBadges) return;
    setBadgeActionLoading(true);
    try {
      const res = await fetch(`/api/profile/${targetUserForBadges.discordId}/badges?badgeId=${badgeId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const data = await res.json();
        updateLocalUserBadges(data.customBadges);
      } else {
        const errData = await res.json();
        alert(errData.error || "Rozet kaldırılamadı.");
      }
    } catch (err) {
      console.error("Rozet kaldırma hatası:", err);
    } finally {
      setBadgeActionLoading(false);
    }
  };

  const updateLocalUserBadges = (updatedCustomBadges: any[]) => {
    if (!targetUserForBadges) return;

    setUsers((prevUsers) => {
      return prevUsers.map((u) => {
        if (u.discordId === targetUserForBadges.discordId) {
          const dynamicBadges = u.badges.filter((b: any) => !b.isCustom);
          const newCustomBadges = updatedCustomBadges.map((cb: any) => ({
            id: cb._id,
            name: cb.name,
            description: cb.description,
            color: cb.color,
            icon: cb.icon,
            isCustom: true
          }));
          return {
            ...u,
            customBadges: updatedCustomBadges,
            badges: [...newCustomBadges, ...dynamicBadges]
          };
        }
        return u;
      });
    });

    setTargetUserForBadges((prev: any) => {
      if (!prev) return null;
      const dynamicBadges = prev.badges.filter((b: any) => !b.isCustom);
      const newCustomBadges = updatedCustomBadges.map((cb: any) => ({
        id: cb._id,
        name: cb.name,
        description: cb.description,
        color: cb.color,
        icon: cb.icon,
        isCustom: true
      }));
      return {
        ...prev,
        customBadges: updatedCustomBadges,
        badges: [...newCustomBadges, ...dynamicBadges]
      };
    });
  };

  function getBadgeIcon(iconName: string) {
    switch (iconName) {
      case "ShieldCheck": return <ShieldCheck className="w-3 h-3 shrink-0" />;
      case "Award": return <Award className="w-3 h-3 shrink-0" />;
      case "BookOpen": return <BookOpen className="w-3 h-3 shrink-0" />;
      case "Bookmark": return <Bookmark className="w-3 h-3 shrink-0" />;
      case "Star": return <Star className="w-3 h-3 shrink-0" />;
      case "Users": return <Users className="w-3 h-3 shrink-0" />;
      case "Clock": return <Clock className="w-3 h-3 shrink-0" />;
      default: return <Award className="w-3 h-3 shrink-0" />;
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <span className="text-xs font-mono text-zinc-555">Yükleniyor...</span>
      </div>
    );
  }

  if (!isStaff) {
    router.push("/");
    return null;
  }

  const menuCards = [
    {
      title: "Yeni Manga Ekle",
      description: "MyAnimeList API'si ile otomatik veya manuel olarak yeni manga ekleyin.",
      icon: BookPlus,
      href: "/admin/add-manga",
      color: "from-emerald-500/20 to-emerald-600/5",
      borderColor: "border-emerald-500/20 hover:border-emerald-500/40",
      iconColor: "text-emerald-400",
    },
    {
      title: "Manga Kataloğu",
      description: "Mevcut mangaları görüntüleyin, düzenleyin veya bölüm ekleyin.",
      icon: BookOpen,
      href: "/mangalist",
      color: "from-sky-500/20 to-sky-600/5",
      borderColor: "border-sky-500/20 hover:border-sky-500/40",
      iconColor: "text-sky-400",
    },
  ];

  // Arama filtresi uygulanan kullanıcılar
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.discordId && u.discordId.includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col font-sans antialiased selection:bg-white selection:text-black">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        h1, h2, h3, h4 { font-family: 'Outfit', sans-serif; }
      `}</style>

      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col gap-8 animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-zinc-550">
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase tracking-widest">Yönetim Paneli</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">Dashboard</h1>
          <p className="text-xs text-zinc-400 font-light max-w-xl">
            Hoş geldin, <span className="text-white font-semibold">{session?.user?.name}</span>. Aşağıdan sistem sekmelerini yönetebilirsin.
          </p>
        </div>

        {/* Tab Menu Navigation */}
        <div className="flex gap-2 border-b border-zinc-900 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === "overview"
                ? "bg-zinc-900 text-white border-zinc-800 shadow-sm"
                : "text-zinc-400 hover:text-white border-transparent bg-transparent"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Genel Bakış
          </button>
          <button
            onClick={() => setActiveTab("manga")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === "manga"
                ? "bg-zinc-900 text-white border-zinc-800 shadow-sm"
                : "text-zinc-400 hover:text-white border-transparent bg-transparent"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Seri Yönetimi
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === "users"
                ? "bg-zinc-900 text-white border-zinc-800 shadow-sm"
                : "text-zinc-400 hover:text-white border-transparent bg-transparent"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Kullanıcı Yönetimi
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === "settings"
                ? "bg-zinc-900 text-white border-zinc-800 shadow-sm"
                : "text-zinc-400 hover:text-white border-transparent bg-transparent"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Discord & Ayarlar
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === "notifications"
                ? "bg-zinc-900 text-white border-zinc-800 shadow-sm"
                : "text-zinc-400 hover:text-white border-transparent bg-transparent"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Bildirimler
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-8 animate-fade-in">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-[#161616] border border-zinc-850 rounded-xl p-5 flex flex-col gap-1 shadow-sm">
                <div className="flex items-center gap-2 text-zinc-550 mb-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono uppercase tracking-wider">Toplam Manga</span>
                </div>
                <span className="text-2xl font-bold text-white tabular-nums">
                  {stats ? stats.mangaCount : <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />}
                </span>
              </div>
              <div className="bg-[#161616] border border-zinc-850 rounded-xl p-5 flex flex-col gap-1 shadow-sm">
                <div className="flex items-center gap-2 text-zinc-550 mb-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono uppercase tracking-wider">Toplam Bölüm</span>
                </div>
                <span className="text-2xl font-bold text-white tabular-nums">
                  {stats ? stats.chapterCount : <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />}
                </span>
              </div>
              <div className="bg-[#161616] border border-zinc-850 rounded-xl p-5 flex flex-col gap-1 col-span-2 sm:col-span-1 shadow-sm">
                <div className="flex items-center gap-2 text-zinc-550 mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono uppercase tracking-wider">Rolünüz</span>
                </div>
                <span className="text-2xl font-bold text-white capitalize">
                  {session?.user?.role === "admin" ? "Kurucu" : "Moderatör"}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 gap-5">
              {menuCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className={`group relative bg-[#161616] border rounded-xl p-6 flex flex-col gap-4 transition-all duration-200 ${card.borderColor}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
                  <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className={`bg-[#0a0a0a] border border-zinc-800 p-2.5 rounded-xl ${card.iconColor}`}>
                        <card.icon className="w-5 h-5" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-sm font-bold text-white tracking-tight">{card.title}</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed font-light">{card.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: MANGA MANAGEMENT */}
        {activeTab === "manga" && (
          <div className="animate-fade-in w-full">
            <div className="bg-[#161616] border border-zinc-800 rounded-xl overflow-hidden shadow-md">
              <div className="flex items-center gap-3.5 p-6 border-b border-zinc-850">
                <div className="bg-[#0a0a0a] border border-zinc-800 p-2.5 rounded-xl text-emerald-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white tracking-tight">Hızlı Yayın Takvimi Yönetimi</h2>
                  <p className="text-xs text-zinc-500 font-light mt-0.5">Tüm güncel serilerin yeni bölüm çıkış günlerini tek bir panelden yönetin. Değişiklikler anında kaydedilir.</p>
                </div>
              </div>

              <div className="p-6">
                {loadingMangas ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-550">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-555" />
                    <span className="text-xs font-mono">Manga listesi yükleniyor...</span>
                  </div>
                ) : mangas.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-8">Kataloğunuzda henüz hiçbir manga serisi bulunmuyor.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-850 text-zinc-550 font-mono uppercase text-[9px] tracking-wider">
                          <th className="pb-3 font-semibold">Manga Başlığı</th>
                          <th className="pb-3 font-semibold">Durumu</th>
                          <th className="pb-3 font-semibold">Yayın Günü</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850/50">
                        {mangas.map((manga) => (
                          <tr key={manga._id} className="group">
                            <td className="py-3.5 flex items-center gap-3">
                              <Link href={`/mangalist/${manga._id}`} className="shrink-0 hover:opacity-80 transition-opacity">
                                <img src={manga.coverImage} alt="" className="w-9 h-12 object-cover rounded-md border border-zinc-800" />
                              </Link>
                              <div className="flex flex-col min-w-0 text-left">
                                <Link href={`/mangalist/${manga._id}`} className="font-bold text-white hover:text-violet-400 hover:underline transition-all truncate max-w-[200px] sm:max-w-[350px]">
                                  {manga.title}
                                </Link>
                                <span className="text-[10px] text-zinc-555 font-mono mt-0.5">{manga.author}</span>
                              </div>
                            </td>
                            <td className="py-3.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                manga.status === "Devam Ediyor" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                manga.status === "Tamamlandı" ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
                                "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}>
                                {manga.status}
                              </span>
                            </td>
                            <td className="py-3.5">
                              <div className="flex items-center gap-2">
                                <select
                                  value={manga.scheduleDay || "Belirsiz"}
                                  disabled={updatingMangaId === manga._id}
                                  onChange={(e) => handleScheduleDayChange(manga._id, e.target.value)}
                                  className="bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded px-2.5 py-1.5 text-xs outline-none transition-all text-white cursor-pointer"
                                >
                                  <option value="Belirsiz">Belirsiz / Düzensiz</option>
                                  <option value="Pazartesi">Pazartesi</option>
                                  <option value="Salı">Salı</option>
                                  <option value="Çarşamba">Çarşamba</option>
                                  <option value="Perşembe">Perşembe</option>
                                  <option value="Cuma">Cuma</option>
                                  <option value="Cumartesi">Cumartesi</option>
                                  <option value="Pazar">Pazar</option>
                                </select>
                                {updatingMangaId === manga._id && (
                                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: USER MANAGEMENT & BADGE SYSTEM */}
        {activeTab === "users" && (
          <div className="animate-fade-in w-full flex flex-col gap-4">
            
            {/* Arama Barı */}
            <div className="flex justify-between items-center gap-4 flex-wrap bg-[#161616] p-5 rounded-t-xl border-t border-x border-zinc-800 shadow-sm">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-zinc-550 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Kullanıcı adı veya Discord ID ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-zinc-850 hover:border-zinc-800 focus:border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none transition-colors"
                />
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setEditingBadge(null);
                    setBadgeFormName("");
                    setBadgeFormDescription("");
                    setBadgeFormColor("bg-violet-500/10 text-violet-400 border-violet-500/20");
                    setBadgeFormIcon("Award");
                    setIsBadgeLibraryModalOpen(true);
                  }}
                  className="bg-violet-950/40 hover:bg-violet-900/40 text-violet-400 border border-violet-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Award className="w-4 h-4 text-violet-400" />
                  Rozet Kütüphanesini Yönet
                </button>
                <span className="text-[10px] font-mono text-zinc-550 uppercase font-bold tracking-wider">Toplam: {filteredUsers.length} Okuyucu</span>
              </div>
            </div>

            {/* Kullanıcılar Tablosu */}
            <div className="bg-[#161616] border-b border-x border-zinc-800 rounded-b-xl overflow-hidden shadow-md">
              {loadingUsers ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-550">
                  <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
                  <span className="text-xs font-mono">Okur listesi yükleniyor...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 italic text-xs">Hiçbir okur kaydı bulunamadı.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-900 bg-zinc-950/20 text-zinc-550 font-mono uppercase text-[9px] tracking-wider">
                        <th className="p-4 font-semibold">Kullanıcı</th>
                        <th className="p-4 font-semibold">Rol</th>
                        <th className="p-4 font-semibold">Seviye & XP</th>
                        <th className="p-4 font-semibold">Rozetler</th>
                        <th className="p-4 font-semibold text-right">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/60">
                      {filteredUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-zinc-900/10 transition-colors">
                          {/* Kullanıcı Bilgisi */}
                          <td className="p-4 flex items-center gap-3">
                            {user.image ? (
                              <img src={user.image} alt="" className="w-9 h-9 rounded-full object-cover border border-zinc-800 shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-[#0a0a0b] border border-zinc-800 flex items-center justify-center shrink-0">
                                <UserCheck className="w-4 h-4 text-zinc-600" />
                              </div>
                            )}
                            <div className="flex flex-col min-w-0 text-left">
                              <span className="font-bold text-white truncate max-w-[150px]">{user.name}</span>
                              <span className="text-[10px] font-mono text-zinc-550 mt-0.5 truncate max-w-[150px]">{user.email}</span>
                            </div>
                          </td>
                          
                          {/* Rol */}
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              user.role === "admin" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                              user.role === "mod" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                              "bg-zinc-900 text-zinc-400 border-zinc-800"
                            }`}>
                              {user.role === "admin" ? "Kurucu" : user.role === "mod" ? "Moderatör" : "Okuyucu"}
                            </span>
                          </td>

                          {/* Seviye */}
                          <td className="p-4 font-mono font-medium text-zinc-300">
                            <span>Lvl {user.level}</span>
                            <span className="text-[10px] text-zinc-550 ml-1">({user.xp} XP)</span>
                          </td>

                          {/* Sahip Olduğu Rozetler */}
                          <td className="p-4">
                            {user.badges && user.badges.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {user.badges.slice(0, 3).map((badge: any) => (
                                  <span
                                    key={badge.id}
                                    title={`${badge.name}: ${badge.description}`}
                                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[8.5px] font-semibold tracking-wide ${badge.color}`}
                                  >
                                    {getBadgeIcon(badge.icon)}
                                    {badge.name}
                                  </span>
                                ))}
                                {user.badges.length > 3 && (
                                  <span className="text-[9px] font-mono text-zinc-500 self-center">+{user.badges.length - 3}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-zinc-650 italic text-[11px]">Rozet yok</span>
                            )}
                          </td>

                          {/* İşlemler */}
                          <td className="p-4 text-right">
                            <button
                              onClick={() => openBadgeModalForUser(user)}
                              className="inline-flex items-center gap-1 bg-zinc-950 hover:bg-violet-900/20 hover:text-violet-400 border border-zinc-850 hover:border-violet-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold text-zinc-300 transition-all cursor-pointer active:scale-95 shadow-sm"
                            >
                              <Award className="w-3.5 h-3.5 text-violet-400" />
                              Rozetleri Yönet
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: DISCORD & SYSTEM SETTINGS */}
        {activeTab === "settings" && (
          <div className="animate-fade-in w-full">
            <div className="bg-[#161616] border border-zinc-800 rounded-xl overflow-hidden shadow-md">
              {/* Section Header */}
              <div className="flex items-center gap-3.5 p-6 border-b border-zinc-850">
                <div className="bg-[#0a0a0a] border border-zinc-800 p-2.5 rounded-xl text-violet-400">
                  <Server className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white tracking-tight">Discord & Sistem Ayarları</h2>
                  <p className="text-xs text-zinc-550 font-light mt-0.5">Sunucu, rol atamaları ve banner yapılandırmasını yönetin.</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border bg-violet-500/10 text-violet-400 border-violet-500/20">
                  <Zap className="w-2.5 h-2.5" />
                  Yönetici
                </span>
              </div>

              {/* Settings Form */}
              <div className="p-6">
                {loadingGuilds ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-550">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-550" />
                    <span className="text-xs font-mono">Discord sunucuları yükleniyor...</span>
                  </div>
                ) : (
                  <form onSubmit={handleSaveSettings} className="space-y-6">
                    {/* Sunucu Seçimi */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                        Discord Sunucusu (Guild)
                      </label>
                      <select
                        required
                        value={selectedGuild}
                        onChange={(e) => handleGuildChange(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md px-4 py-3 text-xs outline-none transition-all text-white cursor-pointer"
                      >
                        <option value="" className="bg-[#0a0a0a] text-zinc-500">Sunucu Seçin</option>
                        {guilds.map((guild) => (
                          <option key={guild.id} value={guild.id} className="bg-[#0a0a0a] text-white">
                            {guild.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Rol Seçimleri */}
                    {selectedGuild && (
                      <>
                        {loadingRoles ? (
                          <div className="flex items-center justify-center py-6 gap-2 text-zinc-500 text-xs">
                            <Loader2 className="w-4 h-4 animate-spin text-zinc-550" />
                            <span>Rol listesi çekiliyor...</span>
                          </div>
                        ) : (
                          <div className="grid sm:grid-cols-3 gap-5 animate-fade-in">
                            {/* Genel Bildirim Rolü */}
                            <div>
                              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-zinc-550" />
                                Bildirim Rolü
                              </label>
                              <select
                                required
                                value={selectedDefaultRole}
                                onChange={(e) => setSelectedDefaultRole(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md px-4 py-3 text-xs outline-none transition-all text-white cursor-pointer"
                              >
                                <option value="" className="bg-[#0a0a0a] text-zinc-500">Rol Seçin</option>
                                {roles.map((role) => (
                                  <option key={role.id} value={role.id} className="bg-[#0a0a0a] text-white">{role.name}</option>
                                ))}
                              </select>
                            </div>

                            {/* Kurucu Rolü */}
                            <div>
                              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-zinc-550" />
                                Kurucu Rolü
                              </label>
                              <select
                                required
                                value={selectedFounderRole}
                                onChange={(e) => setSelectedFounderRole(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md px-4 py-3 text-xs outline-none transition-all text-white cursor-pointer"
                              >
                                <option value="" className="bg-[#0a0a0a] text-zinc-500">Rol Seçin</option>
                                {roles.map((role) => (
                                  <option key={role.id} value={role.id} className="bg-[#0a0a0a] text-white">{role.name}</option>
                                ))}
                              </select>
                            </div>

                            {/* Admin Rolü */}
                            <div>
                              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-zinc-555" />
                                Moderatör Rolü
                              </label>
                              <select
                                required
                                value={selectedAdminRole}
                                onChange={(e) => setSelectedAdminRole(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md px-4 py-3 text-xs outline-none transition-all text-white cursor-pointer"
                              >
                                <option value="" className="bg-[#0a0a0a] text-zinc-500">Rol Seçin</option>
                                {roles.map((role) => (
                                  <option key={role.id} value={role.id} className="bg-[#0a0a0a] text-white">{role.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Bildirim Kanalı */}
                        <div className="border-t border-zinc-900 pt-5 mt-2">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                            <Hash className="w-3.5 h-3.5 text-zinc-550" />
                            Bildirim Kanalı
                          </label>
                          {loadingChannels ? (
                            <div className="flex items-center gap-2 text-zinc-500 text-xs py-2">
                              <Loader2 className="w-4 h-4 animate-spin text-zinc-550" />
                              <span>Kanal listesi çekiliyor...</span>
                            </div>
                          ) : (
                            <select
                              required
                              value={selectedNotificationChannel}
                              onChange={(e) => setSelectedNotificationChannel(e.target.value)}
                              className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md px-4 py-3 text-xs outline-none transition-all text-white cursor-pointer"
                            >
                              <option value="" className="bg-[#0a0a0a] text-zinc-500">Kanal Seçin</option>
                              {channels.map((ch) => (
                                <option key={ch.id} value={ch.id} className="bg-[#0a0a0a] text-white">#{ch.name}</option>
                              ))}
                            </select>
                          )}
                          <p className="text-[9px] text-zinc-650 mt-1.5 font-light">Yeni bölüm yayınlandığında bildirim gönderilecek kanal.</p>
                        </div>
                      </>
                    )}

                    {/* Banner Ayarları */}
                    <div className="border-t border-zinc-900 pt-5 mt-5 space-y-5">
                      <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-405">Okuyucu Banner Ayarları</h3>
                      
                      {/* Üst Banner */}
                      <div className="space-y-3">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500">Üst Banner Görseli</label>
                        <div className="relative group/upload w-full h-32 bg-[#0a0a0a] rounded-md border border-zinc-800 hover:border-zinc-700 transition-all duration-200 flex items-center justify-center overflow-hidden">
                          {topBannerUrl ? (
                            <>
                              <img src={topBannerUrl} alt="Üst Banner" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover/upload:opacity-100 transition-opacity">
                                <button type="button" onClick={() => setTopBannerUrl("")} className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 p-2 rounded-md transition-all cursor-pointer">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                              <UploadCloud className="w-6 h-6 text-zinc-600 mb-1" />
                              <span className="text-[10px] text-zinc-500 font-mono">PNG, JPG (Maks. 10MB)</span>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 10 * 1024 * 1024) { setSettingsMessage({ text: "Görsel 10MB'tan küçük olmalı.", isError: true }); return; }
                                const reader = new FileReader();
                                reader.onloadend = () => setTopBannerUrl(reader.result as string);
                                reader.readAsDataURL(file);
                              }} />
                            </label>
                          )}
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Üst Banner Tıklama Linki (İsteğe Bağlı)</label>
                          <input type="url" value={topBannerLink} onChange={(e) => setTopBannerLink(e.target.value)}
                            placeholder="https://example.com/target-page"
                            className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md px-4 py-2.5 text-xs outline-none transition-all text-white placeholder-zinc-800" />
                        </div>
                      </div>

                      {/* Alt Banner */}
                      <div className="space-y-3">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500">Alt Banner Görseli</label>
                        <div className="relative group/upload w-full h-32 bg-[#0a0a0a] rounded-md border border-zinc-800 hover:border-zinc-700 transition-all duration-200 flex items-center justify-center overflow-hidden">
                          {bottomBannerUrl ? (
                            <>
                              <img src={bottomBannerUrl} alt="Alt Banner" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover/upload:opacity-100 transition-opacity">
                                <button type="button" onClick={() => setBottomBannerUrl("")} className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 p-2 rounded-md transition-all cursor-pointer">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                              <UploadCloud className="w-6 h-6 text-zinc-600 mb-1" />
                              <span className="text-[10px] text-zinc-500 font-mono">PNG, JPG (Maks. 10MB)</span>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 10 * 1024 * 1024) { setSettingsMessage({ text: "Görsel 10MB'tan küçük olmalı.", isError: true }); return; }
                                const reader = new FileReader();
                                reader.onloadend = () => setBottomBannerUrl(reader.result as string);
                                reader.readAsDataURL(file);
                              }} />
                            </label>
                          )}
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">Alt Banner Tıklama Linki (İsteğe Bağlı)</label>
                          <input type="url" value={bottomBannerLink} onChange={(e) => setBottomBannerLink(e.target.value)}
                            placeholder="https://example.com/target-page"
                            className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md px-4 py-2.5 text-xs outline-none transition-all text-white placeholder-zinc-800" />
                        </div>
                      </div>
                    </div>

                    {/* Status & Submit */}
                    {settingsMessage && (
                      <div className={`text-xs text-center py-2.5 px-3 rounded-md font-medium transition-all duration-150 border ${
                        settingsMessage.isError
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                        {settingsMessage.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={saving || !selectedGuild || !selectedDefaultRole || !selectedAdminRole || !selectedFounderRole || !selectedNotificationChannel}
                      className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-3.5 rounded-md text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</>
                      ) : (
                        <><Save className="w-4 h-4" /> Yapılandırmayı Kaydet</>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="animate-fade-in w-full flex flex-col gap-6 text-left">
            
            {/* Bildirim Gönder Kartı */}
            <div className="bg-[#161616] border border-zinc-800 rounded-xl overflow-hidden shadow-md">
              <div className="flex items-center gap-3.5 p-6 border-b border-zinc-850">
                <div className="bg-[#0a0a0a] border border-zinc-800 p-2.5 rounded-xl text-violet-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white tracking-tight">Yeni Global Bildirim Gönder</h2>
                  <p className="text-xs text-zinc-500 font-light mt-0.5">Yayınlayacağınız bildirim tüm kullanıcılara anında ulaşır ve okuyana kadar Navbar üzerinde kalır.</p>
                </div>
              </div>

              <div className="p-6">
                <form onSubmit={handleSendNotification} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase">Bildirim Başlığı</label>
                    <input
                      type="text"
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      placeholder="Örn: Sunucu Güncellemesi veya Yeni Seri Yayında!"
                      required
                      className="bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md px-4 py-2.5 text-xs outline-none transition-all text-white placeholder-zinc-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase">Bildirim Mesajı</label>
                    <textarea
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      placeholder="Kullanıcılara iletmek istediğiniz detaylı duyuru metnini yazın..."
                      required
                      rows={4}
                      className="bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md px-4 py-2.5 text-xs outline-none transition-all text-white placeholder-zinc-800 resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendingNotification}
                    className="bg-white hover:bg-zinc-200 text-black font-semibold py-3 rounded-md text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                  >
                    {sendingNotification ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor...</>
                    ) : (
                      <>Bildirimi Herkese Gönder</>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Gönderilen Bildirimler Listesi */}
            <div className="bg-[#161616] border border-zinc-800 rounded-xl overflow-hidden shadow-md">
              <div className="p-6 border-b border-zinc-850">
                <h3 className="text-sm font-bold text-white tracking-tight">Gönderilen Bildirim Geçmişi ({notifications.length})</h3>
              </div>

              <div className="p-6">
                {loadingNotifications ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-550">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-555" />
                    <span className="text-xs font-mono">Bildirim geçmişi yükleniyor...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-8">Henüz hiç bildirim gönderilmemiş.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {notifications.map((notif) => (
                      <div 
                        key={notif._id} 
                        className="bg-[#0a0a0a] border border-zinc-850 p-4 rounded-xl flex justify-between items-start gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-white text-xs">{notif.title}</h4>
                            <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-850">
                              {new Date(notif.createdAt).toLocaleString("tr-TR")}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-2 font-light leading-relaxed whitespace-pre-wrap">{notif.message}</p>
                          <span className="text-[10px] text-zinc-500 font-mono block mt-1.5">Gönderen: {notif.senderName}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteNotification(notif._id)}
                          className="bg-red-950/20 hover:bg-red-955 border border-zinc-850 hover:border-red-900/60 text-zinc-500 hover:text-red-400 p-2 rounded-lg transition-colors cursor-pointer"
                          title="Bildirimi Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* KULLANICI ROZET ATAMA MODALI */}
      {isBadgeModalOpen && targetUserForBadges && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in text-xs">
          <div className="bg-[#161616] border border-zinc-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/40">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-violet-400" />
                  Rozet Atama / Yönetim
                </h3>
                <p className="text-[10px] text-zinc-500">Kullanıcı: <span className="text-zinc-300 font-semibold">{targetUserForBadges.name}</span></p>
              </div>
              <button
                onClick={() => setIsBadgeModalOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs font-mono"
              >
                KAPAT [X]
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1 text-left">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold mb-1">
                Kütüphane Rozetleri
              </span>

              {loadingGlobalBadges ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-550">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Rozetler yükleniyor...</span>
                </div>
              ) : globalBadges.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 italic">
                  Rozet kütüphanesinde tanımlı hiçbir rozet bulunamadı. Önce "Rozet Kütüphanesini Yönet" menüsünden rozet oluşturun.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {globalBadges.map((badge) => {
                    const hasBadge = targetUserForBadges.customBadges?.some(
                      (cb: any) => (cb._id || cb) === badge._id
                    );
                    return (
                      <div
                        key={badge._id}
                        className="bg-[#0a0a0b]/65 border border-zinc-850/80 p-3 rounded-xl flex justify-between items-center gap-4 hover:border-zinc-800 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-[10px] font-bold tracking-wide shrink-0 ${badge.color}`}>
                            {getBadgeIcon(badge.icon)}
                            {badge.name}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-light truncate" title={badge.description}>
                            {badge.description}
                          </span>
                        </div>

                        <button
                          onClick={() =>
                            hasBadge
                              ? handleUnassignBadgeFromUser(badge._id)
                              : handleAssignBadgeToUser(badge._id)
                          }
                          disabled={badgeActionLoading}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer active:scale-95 shrink-0 select-none ${
                            hasBadge
                              ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          }`}
                        >
                          {hasBadge ? "Kaldır" : "Ata"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ROZET KÜTÜPHANESİ CRUD MODALI */}
      {isBadgeLibraryModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in text-xs">
          <div className="bg-[#161616] border border-zinc-800 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/40">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-violet-400" />
                Global Rozet Kütüphanesini Yönet
              </h3>
              <button
                onClick={() => setIsBadgeLibraryModalOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs font-mono"
              >
                KAPAT [X]
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col md:grid md:grid-cols-12 gap-8 overflow-y-auto flex-1">
              
              {/* Form Kısmı (5 Column) */}
              <form onSubmit={handleSaveGlobalBadge} className="md:col-span-5 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-zinc-900 pb-6 md:pb-0 md:pr-6">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold text-violet-400 text-left">
                  {editingBadge ? "Rozeti Düzenle" : "Yeni Global Rozet Oluştur"}
                </span>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-mono text-zinc-450 uppercase">Rozet İsmi</label>
                  <input
                    type="text"
                    value={badgeFormName}
                    onChange={(e) => setBadgeFormName(e.target.value)}
                    placeholder="Örn: Çevirmen"
                    required
                    className="bg-zinc-950 border border-zinc-850 hover:border-zinc-800 focus:border-violet-500 p-2.5 rounded-xl text-xs text-white outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-mono text-zinc-455 uppercase">Açıklama</label>
                  <input
                    type="text"
                    value={badgeFormDescription}
                    onChange={(e) => setBadgeFormDescription(e.target.value)}
                    placeholder="Örn: Resmi çeviri ekibi üyesi"
                    required
                    className="bg-zinc-950 border border-zinc-850 hover:border-zinc-805 focus:border-violet-500 p-2.5 rounded-xl text-xs text-white outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono text-zinc-450 uppercase">İkon</label>
                    <select
                      value={badgeFormIcon}
                      onChange={(e) => setBadgeFormIcon(e.target.value)}
                      className="bg-zinc-955 border border-zinc-850 p-2.5 rounded-xl text-xs text-zinc-300 outline-none cursor-pointer"
                    >
                      <option value="Award">Madalya (Award)</option>
                      <option value="ShieldCheck">Kalkan (ShieldCheck)</option>
                      <option value="Star">Yıldız (Star)</option>
                      <option value="Zap">Şimşek (Zap)</option>
                      <option value="BookOpen">Kitap (BookOpen)</option>
                      <option value="Bookmark">Yer İşareti (Bookmark)</option>
                      <option value="Clock">Saat (Clock)</option>
                      <option value="Users">Kullanıcılar (Users)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono text-zinc-455 uppercase">Önizleme</label>
                    <div className="bg-zinc-950 border border-zinc-850 p-2 rounded-xl flex items-center justify-center min-h-[40px]">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-[10px] font-semibold ${badgeFormColor}`}>
                        {getBadgeIcon(badgeFormIcon)}
                        {badgeFormName || "Önizleme"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stil Renk Şablonları */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-mono text-zinc-450 uppercase">Renk / Tema Şablonu</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: "Kırmızı", value: "bg-red-500/10 text-red-400 border-red-500/20" },
                      { name: "Mavi", value: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
                      { name: "Yeşil", value: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
                      { name: "Sarı", value: "bg-amber-500/10 text-amber-455 border-amber-500/20" },
                      { name: "Mor", value: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
                      { name: "Pembe", value: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
                      { name: "Turkuaz", value: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
                      { name: "Menekşe", value: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
                    ].map((theme) => (
                      <button
                        key={theme.name}
                        type="button"
                        onClick={() => setBadgeFormColor(theme.value)}
                        className={`text-[9px] font-semibold px-2 py-1 rounded border transition-all cursor-pointer ${theme.value} ${
                          badgeFormColor === theme.value ? "ring-2 ring-white scale-102" : "opacity-75 hover:opacity-100"
                        }`}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 mt-2 border-t border-zinc-900 pt-4">
                  {editingBadge && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBadge(null);
                        setBadgeFormName("");
                        setBadgeFormDescription("");
                        setBadgeFormColor("bg-violet-500/10 text-violet-400 border-violet-500/20");
                        setBadgeFormIcon("Award");
                      }}
                      className="bg-transparent hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      Vazgeç
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={badgeActionLoading}
                    className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    {badgeActionLoading ? "Kaydediliyor..." : editingBadge ? "Güncelle" : "Rozeti Oluştur"}
                  </button>
                </div>
              </form>

              {/* Rozetler Listesi (7 Column) */}
              <div className="md:col-span-7 flex flex-col gap-4 text-left">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">
                  Tanımlı Global Rozetler ({globalBadges.length})
                </span>

                {loadingGlobalBadges ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-550">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-555" />
                    <span>Yükleniyor...</span>
                  </div>
                ) : globalBadges.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic bg-[#0a0a0b]/60 border border-zinc-850 p-4 rounded-xl text-center">
                    Henüz hiçbir global rozet eklenmemiş. Yandaki formu kullanarak eklemeye başlayın.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
                    {globalBadges.map((badge) => (
                      <div
                        key={badge._id}
                        className="bg-[#0a0a0b]/65 border border-zinc-850 p-3 rounded-xl flex justify-between items-center gap-4 hover:border-zinc-800 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-[10px] font-semibold shrink-0 ${badge.color}`}>
                            {getBadgeIcon(badge.icon)}
                            {badge.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-light truncate" title={badge.description}>
                            {badge.description}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleEditBadgeClick(badge)}
                            className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDeleteGlobalBadge(badge._id)}
                            disabled={badgeActionLoading}
                            className="bg-red-955/30 hover:bg-red-950 border border-zinc-805 hover:border-red-900/60 text-zinc-400 hover:text-red-400 px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-zinc-900 py-10 text-center text-xs text-zinc-550 bg-[#020202]">
        <div className="max-w-6xl mx-auto px-6">
          <span>Nexora © {new Date().getFullYear()} • Yönetim Paneli</span>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Settings, BookPlus, LayoutDashboard,
  BookOpen, Loader2, ChevronRight,
  Activity, Shield, Zap, Server, ShieldCheck, UserCheck, Save, UploadCloud, Trash2, Hash
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

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

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/mangas");
        if (res.ok) {
          const mangas = await res.json();
          let totalChapters = 0;
          for (const manga of mangas) {
            try {
              const cRes = await fetch(`/api/mangas/${manga._id}/chapters`);
              if (cRes.ok) {
                const chapters = await cRes.json();
                totalChapters += chapters.length;
              }
            } catch {}
          }
          setStats({ mangaCount: mangas.length, chapterCount: totalChapters });
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

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <span className="text-xs font-mono text-zinc-550">Yükleniyor...</span>
      </div>
    );
  }

  const isAdmin = session?.user?.role === "admin";
  const isStaff = isAdmin || session?.user?.role === "mod";

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col font-sans antialiased selection:bg-white selection:text-black">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      `}</style>

      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col gap-10 animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-zinc-550">
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase tracking-widest">Yönetim Paneli</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Dashboard</h1>
          <p className="text-sm text-zinc-400 font-light max-w-xl">
            Hoş geldin, <span className="text-white font-medium">{session?.user?.name}</span>. Aşağıdan yönetim araçlarına erişebilirsin.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-[#161616] border border-zinc-850 rounded-md p-5 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-zinc-550 mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Toplam Manga</span>
            </div>
            <span className="text-2xl font-bold text-white tabular-nums">
              {stats ? stats.mangaCount : <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />}
            </span>
          </div>
          <div className="bg-[#161616] border border-zinc-850 rounded-md p-5 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-zinc-550 mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Toplam Bölüm</span>
            </div>
            <span className="text-2xl font-bold text-white tabular-nums">
              {stats ? stats.chapterCount : <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />}
            </span>
          </div>
          <div className="bg-[#161616] border border-zinc-850 rounded-md p-5 flex flex-col gap-1 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 text-zinc-550 mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Rol</span>
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
              className={`group relative bg-[#161616] border rounded-md p-6 flex flex-col gap-4 transition-all duration-200 ${card.borderColor}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className={`bg-[#0a0a0a] border border-zinc-800 p-2.5 rounded-md ${card.iconColor}`}>
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

        {/* ─── Discord & Banner Ayarları ─── */}
        {isStaff && (
          <section className="w-full">
            <div className="bg-[#161616] border border-zinc-800 rounded-md overflow-hidden">
              {/* Section Header */}
              <div className="flex items-center gap-3.5 p-6 border-b border-zinc-850">
                <div className="bg-[#0a0a0a] border border-zinc-800 p-2.5 rounded-md text-violet-400">
                  <Server className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white tracking-tight">Discord & Sistem Ayarları</h2>
                  <p className="text-xs text-zinc-500 font-light mt-0.5">Sunucu, rol atamaları ve banner yapılandırmasını yönetin.</p>
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
                                <ShieldCheck className="w-3.5 h-3.5 text-zinc-550" />
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
                          <p className="text-[9px] text-zinc-600 mt-1.5 font-light">Yeni bölüm yayınlandığında bildirim gönderilecek kanal.</p>
                        </div>
                      </>
                    )}

                    {/* Banner Ayarları */}
                    <div className="border-t border-zinc-900 pt-5 mt-5 space-y-5">
                      <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Okuyucu Banner Ayarları</h3>
                      
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
          </section>
        )}
      </main>

      <footer className="border-t border-zinc-900 py-10 text-center text-xs text-zinc-550">
        <div className="max-w-6xl mx-auto px-6">
          <span>Nexora © {new Date().getFullYear()} • Yönetim Paneli</span>
        </div>
      </footer>
    </div>
  );
}

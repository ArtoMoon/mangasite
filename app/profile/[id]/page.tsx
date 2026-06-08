"use client";

import { useEffect, useState, use } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { 
  BookOpen, ShieldCheck, Loader2, User, BellOff, Star, Mail, Award, Clock,
  Users, UserPlus, UserMinus, ArrowLeft, Bookmark, Heart, ChevronRight, Trash2
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function ProfilePage(props: ProfilePageProps) {
  const params = use(props.params);
  const id = params.id;

  const { data: session, status } = useSession();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sub-tab filters for manga list
  const [libraryFilter, setLibraryFilter] = useState<"Okuyor" | "Okuyacak" | "Okudu" | "Favori">("Okuyor");

  // Tabs for right-side container
  const [activeRightTab, setActiveRightTab] = useState<"library" | "ratings">("library");

  // Action loaders
  const [unsubscribingId, setUnsubscribingId] = useState<string | null>(null);
  const [followingLoading, setFollowingLoading] = useState<boolean>(false);
  const [listActionLoading, setListActionLoading] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profile/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Profil bilgileri yüklenemedi.");
      }
    } catch (err) {
      console.error("Profil yüklenirken hata:", err);
      setError("Profil yüklenirken bir ağ hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id, session]);

  const handleUnsubscribe = async (mangaId: string) => {
    setUnsubscribingId(mangaId);
    try {
      const res = await fetch(`/api/mangas/${mangaId}/subscribe-discord`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProfileData((prev: any) => ({
          ...prev,
          subscribedMangas: prev.subscribedMangas.filter((m: any) => m._id !== mangaId),
        }));
      }
    } catch (err) {
      console.error("Abonelikten çıkılamadı:", err);
    } finally {
      setUnsubscribingId(null);
    }
  };

  const handleFollowToggle = async () => {
    if (!session) {
      signIn("discord");
      return;
    }

    setFollowingLoading(true);
    try {
      const res = await fetch(`/api/profile/${id}/follow`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData((prev: any) => {
          const loggedInUserObj = {
            _id: session.user.id,
            name: session.user.name,
            image: session.user.image,
            role: session.user.role,
            discordId: session.user.discordId,
          };

          let updatedFollowers = [...(prev.followers || [])];
          if (data.isFollowing) {
            if (!updatedFollowers.some((f) => f._id === session.user.id)) {
              updatedFollowers.push(loggedInUserObj);
            }
          } else {
            updatedFollowers = updatedFollowers.filter((f) => f._id !== session.user.id);
          }

          return {
            ...prev,
            isFollowing: data.isFollowing,
            followers: updatedFollowers,
          };
        });
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Takip işlemi başarısız oldu.");
      }
    } catch (err) {
      console.error("Takip etme işleminde hata:", err);
    } finally {
      setFollowingLoading(false);
    }
  };

  // Update reading status or favorite toggle in manga list
  const handleUpdateMangaList = async (mangaId: string, updates: { status?: string; isFavorite?: boolean }) => {
    setListActionLoading(mangaId);
    try {
      const res = await fetch("/api/profile/manga-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mangaId, ...updates }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData((prev: any) => ({
          ...prev,
          mangaList: data.mangaList.map((item: any) => {
            // Find existing populated manga details to maintain cover/title
            const existingItem = prev.mangaList.find((p: any) => p.mangaId._id === item.mangaId);
            return {
              ...item,
              mangaId: existingItem ? existingItem.mangaId : { _id: item.mangaId }
            };
          })
        }));
      }
    } catch (err) {
      console.error("Manga listesi güncellenemedi:", err);
    } finally {
      setListActionLoading(null);
    }
  };

  // Remove manga from list entirely
  const handleRemoveFromMangaList = async (mangaId: string) => {
    setListActionLoading(mangaId);
    try {
      const res = await fetch(`/api/profile/manga-list?mangaId=${mangaId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProfileData((prev: any) => ({
          ...prev,
          mangaList: prev.mangaList.filter((item: any) => item.mangaId._id !== mangaId)
        }));
      }
    } catch (err) {
      console.error("Listeden kaldırılamadı:", err);
    } finally {
      setListActionLoading(null);
    }
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <span className="text-xs font-mono text-zinc-550">Profil yükleniyor...</span>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-250 flex flex-col font-sans">
        <header className="border-b border-zinc-900 bg-[#0a0a0a]/80 py-4">
          <div className="max-w-6xl mx-auto px-6">
            <Link href="/" className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-semibold uppercase">
              <ArrowLeft className="w-3.5 h-3.5" /> Kataloğa Dön
            </Link>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="bg-[#161616] border border-zinc-800 p-8 rounded-lg max-w-sm w-full">
            <h1 className="text-lg font-bold text-white mb-2">Profil Bulunamadı</h1>
            <p className="text-xs text-zinc-400 mb-6 font-light leading-relaxed">{error || "Aradığınız profil mevcut değil veya silinmiş."}</p>
            <Link href="/" className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold px-4 py-2.5 rounded-md transition-all inline-block">
              Ana Sayfaya Dön
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Filter the manga list based on sub-tabs
  const filteredMangaList = profileData.mangaList?.filter((item: any) => {
    if (!item.mangaId || !item.mangaId.title) return false; // filter out non-populated or deleted mangas
    if (libraryFilter === "Favori") {
      return item.isFavorite;
    }
    return item.status === libraryFilter;
  }) || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col font-sans antialiased selection:bg-white selection:text-black pb-20 animate-fade-in">
      {/* Outfit typography and Vercel styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;450;500;600;700;800&display=swap');
        body {
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: #0a0a0a;
        }
        .bg-grid-mesh {
          background-size: 20px 20px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
        }
      `}</style>

      {/* Header */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col gap-6">
        
        {/* Profile Header (Discord structure with Vercel aesthetics) */}
        <section className="w-full bg-[#161616] border border-zinc-800 rounded-xl overflow-hidden relative shadow-xl">
          {/* Custom Vercel Banner with Grid-mesh overlay */}
          <div className="w-full h-36 bg-gradient-to-r from-zinc-900 via-[#121213] to-zinc-900 relative border-b border-zinc-850 bg-grid-mesh">
            <div className="absolute inset-0 bg-gradient-to-t from-[#161616] to-transparent" />
            {profileData.image && (
              <div 
                className="absolute inset-0 opacity-[0.03] blur-[60px] pointer-events-none scale-125"
                style={{ backgroundImage: `url(${profileData.image})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
              />
            )}
          </div>

          <div className="px-6 sm:px-8 pb-6 relative flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4">
            
            {/* Overlapping Avatar Profile Details */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-12 relative z-10 w-full sm:w-auto">
              <div className="relative shrink-0">
                {profileData.image ? (
                  <img 
                    src={profileData.image} 
                    alt={profileData.name} 
                    className="w-24 h-24 rounded-full object-cover border-8 border-[#161616] ring-1 ring-zinc-800 shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#0a0a0a] border-8 border-[#161616] ring-1 ring-zinc-800 flex items-center justify-center shadow-lg">
                    <User className="w-10 h-10 text-zinc-650" />
                  </div>
                )}
                {/* Active status ring */}
                <span className="absolute bottom-1 right-1 w-5 h-5 bg-[#23a55a] border-4 border-[#161616] rounded-full animate-pulse" />
              </div>

              <div className="text-center sm:text-left pb-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="text-2xl font-extrabold text-white tracking-tight leading-none">{profileData.name}</h1>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#0a0a0a] border border-zinc-800 text-zinc-400">
                    {profileData.role === "admin" ? "Kurucu" : profileData.role === "mod" ? "Moderatör" : "Okuyucu"}
                  </span>
                </div>
                
                <p className="text-[11px] font-mono text-zinc-500 mt-1.5 leading-none">
                  @{profileData.name.toLowerCase().replace(/\s+/g, "")}
                </p>



                {/* dynamic badges row */}
                {profileData.badges && profileData.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 justify-center sm:justify-start">
                    {profileData.badges.map((badge: any) => (
                      <span 
                        key={badge.id}
                        title={badge.description}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-semibold tracking-wide cursor-help transition-all hover:scale-[1.02] ${badge.color}`}
                      >
                        {getBadgeIcon(badge.icon)}
                        {badge.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Follow Actions (Vercel Style button) */}
            {!profileData.isOwner && (
              <div className="shrink-0 pb-1 z-10">
                <button
                  onClick={handleFollowToggle}
                  disabled={followingLoading}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 ${
                    profileData.isFollowing
                      ? "bg-transparent text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700"
                      : "bg-white text-black hover:bg-zinc-200 border border-white shadow-md shadow-white/5"
                  }`}
                >
                  {followingLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : profileData.isFollowing ? (
                    <>
                      <UserMinus className="w-3.5 h-3.5" />
                      Takipten Çık
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      Takip Et
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Side-by-Side Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Info details & Relations stats */}
          <section className="md:col-span-4 flex flex-col gap-6 w-full">
            
            {/* Hakkında */}
            <div className="bg-[#161616] border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2">Hakkında</h3>
              
              <div className="flex flex-col gap-3.5 text-xs">
                {profileData.email && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">E-Posta</span>
                    <span className="text-zinc-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-550" />
                      {profileData.email}
                    </span>
                  </div>
                )}
                
                {profileData.discordId && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Discord ID</span>
                    <span className="text-zinc-300 font-mono text-[11px] flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-zinc-500" />
                      {profileData.discordId}
                    </span>
                  </div>
                )}

                {profileData.createdAt && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Kayıt Tarihi</span>
                    <span className="text-zinc-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-550" />
                      {new Date(profileData.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-1 border-t border-zinc-900 pt-3 mt-1">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Okuma İstatistiği</span>
                  <span className="text-zinc-300 flex items-center gap-1.5 font-bold">
                    <BookOpen className="w-3.5 h-3.5 text-zinc-550" />
                    {profileData.readChapters?.length || 0} Bölüm Okundu
                  </span>
                </div>
              </div>
            </div>

            {/* Seviye & Gelişim */}
            <div className="bg-[#161616] border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2">Seviye & XP</h3>
              
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-xs font-bold font-mono text-zinc-300">
                  <span>SEVİYE {profileData.level || 1}</span>
                  <span className="text-zinc-500 font-mono">{(profileData.xp || 0) % 500} / 500 XP</span>
                </div>
                <div className="w-full h-2 bg-[#0a0a0a] rounded-full overflow-hidden border border-zinc-850 relative">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.4)] transition-all duration-500 ease-out"
                    style={{ width: `${((profileData.xp || 0) % 500) / 5}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-zinc-555 uppercase tracking-wider text-right mt-0.5">
                  Sonraki seviyeye {500 - ((profileData.xp || 0) % 500)} XP kaldı
                </span>
              </div>
            </div>

            {/* Rozetler ve Başarılar */}
            {profileData.badges && profileData.badges.length > 0 && (
              <div className="bg-[#161616] border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2">Rozet Açıklamaları</h3>
                
                <div className="flex flex-col gap-3">
                  {profileData.badges.map((badge: any) => (
                    <div 
                      key={badge.id}
                      className="flex items-center gap-3 bg-[#0a0a0a] border border-zinc-850 p-2.5 rounded-lg hover:border-zinc-700 transition-colors"
                    >
                      <div className={`p-2 rounded-md border flex items-center justify-center shrink-0 ${badge.color}`}>
                        {getBadgeIcon(badge.icon)}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <span className="font-bold text-xs text-white block leading-none">{badge.name}</span>
                        <span className="text-[10px] text-zinc-500 block mt-1.5 leading-normal font-light">{badge.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* İlişkiler Sayaçları */}
            <div className="bg-[#161616] border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2">İlişkiler</h3>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-[#0a0a0a] p-3.5 rounded-lg border border-zinc-850 flex flex-col items-center justify-center gap-1">
                  <span className="text-lg font-black text-white">{profileData.followers?.length || 0}</span>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Takipçi</span>
                </div>
                <div className="bg-[#0a0a0a] p-3.5 rounded-lg border border-zinc-850 flex flex-col items-center justify-center gap-1">
                  <span className="text-lg font-black text-white">{profileData.following?.length || 0}</span>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Takip Edilen</span>
                </div>
              </div>
            </div>

            {/* Discord Alerts Abonelikleri (Bildirim Zil abonelikleri) */}
            <div className="bg-[#161616] border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
              <div className="border-b border-zinc-900 pb-2">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400">Bildirim Abonelikleri</h3>
                <span className="text-[9px] text-zinc-500 mt-0.5 block">Discord pingi aldığınız seriler</span>
              </div>
              
              {profileData.subscribedMangas?.length === 0 ? (
                <div className="text-zinc-650 text-xs italic text-center py-2">Aktif bildirim aboneliği yok.</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {profileData.subscribedMangas.map((manga: any) => (
                    <div 
                      key={manga._id} 
                      className="bg-[#0a0a0a] border border-zinc-850 p-2 rounded-lg flex justify-between items-center text-xs"
                    >
                      <span className="font-semibold text-white truncate max-w-[130px]">{manga.title}</span>
                      {profileData.isOwner && (
                        <button
                          onClick={() => handleUnsubscribe(manga._id)}
                          disabled={unsubscribingId === manga._id}
                          className="text-red-400 hover:text-red-300 font-bold text-[9px] uppercase tracking-wider shrink-0 transition-colors"
                        >
                          {unsubscribingId === manga._id ? "..." : "İptal"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </section>

          {/* RIGHT COLUMN: Tab Panel Lists (Library Tracker, Ratings, Followers, Following) */}
          <section className="md:col-span-8 flex flex-col gap-6 w-full">
            
            {/* Library Tracker and Ratings container */}
            <div className="bg-[#161616] border border-zinc-800 rounded-xl p-5 flex flex-col gap-5">
              
              {/* Tab Selector */}
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3 flex-wrap gap-3">
                <div className="flex gap-4 text-xs font-bold font-mono tracking-wider uppercase text-zinc-500">
                  <button
                    onClick={() => setActiveRightTab("library")}
                    className={`pb-1 transition-colors relative cursor-pointer ${activeRightTab === "library" ? "text-white" : "hover:text-zinc-300"}`}
                  >
                    Manga Takip Listesi ({profileData.mangaList?.length || 0})
                    {activeRightTab === "library" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
                  </button>
                  <button
                    onClick={() => setActiveRightTab("ratings")}
                    className={`pb-1 transition-colors relative cursor-pointer ${activeRightTab === "ratings" ? "text-white" : "hover:text-zinc-300"}`}
                  >
                    Değerlendirmeler ({profileData.ratedMangas?.length || 0})
                    {activeRightTab === "ratings" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
                  </button>
                </div>
              </div>

              {/* Panel Views */}
              <div className="w-full">
                
                {/* TRACKER LIBRARY */}
                {activeRightTab === "library" && (
                  <div className="flex flex-col gap-4">
                    {/* Status Filters Bar */}
                    <div className="flex flex-wrap gap-1.5 bg-[#0a0a0a] p-1 rounded-lg border border-zinc-850 w-fit">
                      {[
                        { id: "Okuyor", label: "Okuyor" },
                        { id: "Okuyacak", label: "Okuyacak" },
                        { id: "Okudu", label: "Okudu" },
                        { id: "Favori", label: "★ Favoriler" }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setLibraryFilter(tab.id as any)}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                            libraryFilter === tab.id
                              ? "bg-[#161616] text-white border border-zinc-800"
                              : "bg-transparent text-zinc-500 hover:text-zinc-300 border border-transparent"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Manga Items list */}
                    {filteredMangaList.length === 0 ? (
                      <div className="bg-[#0a0a0a] border border-zinc-850 border-dashed rounded-xl p-10 text-center text-zinc-550 text-xs w-full">
                        Bu listede henüz hiçbir seri bulunmuyor.
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3 animate-fade-in">
                        {filteredMangaList.map((item: any) => {
                          const manga = item.mangaId;
                          return (
                            <div 
                              key={manga._id} 
                              className="bg-[#0a0a0a] border border-zinc-850 p-3.5 rounded-lg flex justify-between items-center text-xs hover:border-zinc-700 transition-colors group relative"
                            >
                              <div className="flex items-center gap-3.5 min-w-0 pr-3">
                                <div className="w-10 h-14 bg-[#161616] rounded overflow-hidden shrink-0 flex items-center justify-center relative border border-zinc-800">
                                  {manga.coverImage ? (
                                    <img src={manga.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                  ) : (
                                    <BookOpen className="w-4 h-4 text-zinc-700" />
                                  )}
                                </div>
                                <div className="min-w-0 text-left">
                                  <Link href={`/mangalist/${manga._id}`} className="font-bold text-white hover:underline text-xs block truncate">
                                    {manga.title}
                                  </Link>
                                  <span className="text-[10px] text-zinc-500 block truncate mt-0.5 font-mono">{manga.author}</span>
                                </div>
                              </div>

                              {/* Owner controls */}
                              {profileData.isOwner ? (
                                <div className="flex items-center gap-1.5 shrink-0 z-10">
                                  {/* Favorite Toggle button */}
                                  <button
                                    onClick={() => handleUpdateMangaList(manga._id, { isFavorite: !item.isFavorite })}
                                    disabled={listActionLoading === manga._id}
                                    className={`p-1.5 rounded-md border transition-all cursor-pointer ${
                                      item.isFavorite
                                        ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                                        : "bg-[#161616] border-zinc-800 text-zinc-500 hover:text-zinc-350"
                                    }`}
                                    title={item.isFavorite ? "Favorilerden Çıkar" : "Favoriye Ekle"}
                                  >
                                    <Star className={`w-3.5 h-3.5 ${item.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
                                  </button>

                                  {/* Status Selector Dropdown */}
                                  <select
                                    value={item.status}
                                    disabled={listActionLoading === manga._id}
                                    onChange={(e) => handleUpdateMangaList(manga._id, { status: e.target.value })}
                                    className="bg-[#161616] border border-zinc-800 text-zinc-300 p-1.5 rounded-md text-[10px] font-semibold outline-none cursor-pointer"
                                  >
                                    <option value="Okuyor">Okuyor</option>
                                    <option value="Okuyacak">Okuyacak</option>
                                    <option value="Okudu">Okudu</option>
                                  </select>

                                  {/* Remove Button */}
                                  <button
                                    onClick={() => handleRemoveFromMangaList(manga._id)}
                                    disabled={listActionLoading === manga._id}
                                    className="bg-[#161616] hover:bg-red-500/10 text-zinc-500 hover:text-red-400 border border-zinc-800 hover:border-red-500/20 p-1.5 rounded-md transition-all cursor-pointer"
                                    title="Listeden Kaldır"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 bg-[#161616] border border-zinc-800 px-2 py-1 rounded text-zinc-400 font-bold shrink-0 text-[10px]">
                                  {item.isFavorite && <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0 border-none mr-1" />}
                                  <span>{item.status}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* RATINGS */}
                {activeRightTab === "ratings" && (
                  <div className="flex flex-col gap-3">
                    {profileData.ratedMangas?.length === 0 ? (
                      <div className="bg-[#0a0a0a] border border-zinc-850 border-dashed rounded-xl p-10 text-center text-zinc-555 text-xs w-full">
                        Henüz hiçbir seriye puan verilmemiş.
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {profileData.ratedMangas.map((rateItem: any) => {
                          const manga = rateItem.targetId;
                          if (!manga) return null;
                          return (
                            <div 
                              key={rateItem._id || manga._id} 
                              className="bg-[#0a0a0a] border border-zinc-850 p-3 rounded-lg flex justify-between items-center text-xs hover:border-zinc-700 transition-colors group animate-fade-in"
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-3">
                                <div className="w-10 h-14 bg-[#161616] rounded overflow-hidden shrink-0 flex items-center justify-center relative border border-zinc-800">
                                  {manga.coverImage ? (
                                    <img src={manga.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                  ) : (
                                    <BookOpen className="w-4 h-4 text-zinc-700" />
                                  )}
                                </div>
                                <div className="min-w-0 text-left">
                                  <Link href={`/mangalist/${manga._id}`} className="font-bold text-white hover:underline text-xs block truncate">
                                    {manga.title}
                                  </Link>
                                  <span className="text-[10px] text-zinc-500 block truncate mt-0.5 font-mono">{manga.author}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 bg-[#161616] border border-zinc-800 px-2 py-1 rounded text-amber-400 font-bold shrink-0 text-[10px]">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400 border-none" />
                                <span>{rateItem.rating}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* Social Relations Lists (Followers and Following Details cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              
              {/* Followers list */}
              <div className="bg-[#161616] border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-zinc-550" />
                  Takipçiler ({profileData.followers?.length || 0})
                </h3>

                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                  {profileData.followers?.length === 0 ? (
                    <div className="text-zinc-650 text-xs italic text-center py-6">Takipçi bulunmuyor.</div>
                  ) : (
                    profileData.followers.map((follower: any) => (
                      <Link 
                        key={follower._id}
                        href={`/profile/${follower.discordId}`}
                        className="bg-[#0a0a0a] hover:bg-[#111112] border border-zinc-850 p-2.5 rounded-lg flex items-center gap-2.5 text-xs transition-colors group relative"
                      >
                        {follower.image ? (
                          <img src={follower.image} alt="" className="w-7 h-7 rounded-full object-cover border border-zinc-800 animate-fade-in" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-[#161616] border border-zinc-800 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-zinc-650" />
                          </div>
                        )}
                        <div className="min-w-0 text-left flex-1">
                          <span className="font-bold text-white block truncate group-hover:underline">{follower.name}</span>
                          <span className="text-[8px] font-mono uppercase tracking-widest block text-zinc-500 mt-0.5">
                            {follower.role === "admin" ? "Kurucu" : follower.role === "mod" ? "Moderatör" : "Okuyucu"}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-650 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* Following list */}
              <div className="bg-[#161616] border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-zinc-550" />
                  Takip Edilenler ({profileData.following?.length || 0})
                </h3>

                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                  {profileData.following?.length === 0 ? (
                    <div className="text-zinc-650 text-xs italic text-center py-6">Kimse takip edilmiyor.</div>
                  ) : (
                    profileData.following.map((followedUser: any) => (
                      <Link 
                        key={followedUser._id}
                        href={`/profile/${followedUser.discordId}`}
                        className="bg-[#0a0a0a] hover:bg-[#111112] border border-zinc-855 p-2.5 rounded-lg flex items-center gap-2.5 text-xs transition-colors group relative"
                      >
                        {followedUser.image ? (
                          <img src={followedUser.image} alt="" className="w-7 h-7 rounded-full object-cover border border-zinc-800 animate-fade-in" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-[#161616] border border-zinc-800 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-zinc-650" />
                          </div>
                        )}
                        <div className="min-w-0 text-left flex-1">
                          <span className="font-bold text-white block truncate group-hover:underline">{followedUser.name}</span>
                          <span className="text-[8px] font-mono uppercase tracking-widest block text-zinc-500 mt-0.5">
                            {followedUser.role === "admin" ? "Kurucu" : followedUser.role === "mod" ? "Moderatör" : "Okuyucu"}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-650 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                      </Link>
                    ))
                  )}
                </div>
              </div>

            </div>

          </section>

        </div>
      </main>
    </div>
  );
}

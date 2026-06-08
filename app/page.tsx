"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import StarRating from "@/components/StarRating";
import DiscordSubscribeButton from "@/components/DiscordSubscribeButton";
import Navbar from "@/components/Navbar";
import {
  BookOpen, ShieldCheck, ChevronUp, User, Disc,
  Loader2, Bell, Zap, Star, Activity, ArrowRight, Sparkles, Edit, Trash2, BookOpenCheck, Calendar, Clock, Eye, MessageSquare
} from "lucide-react";
import Link from "next/link";

const daysTurkish = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const getRelativeDayName = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return daysTurkish[d.getDay()];
};

export default function Home() {
  const { data: session } = useSession();
  const [mangas, setMangas] = useState<any[]>([]);
  const [latestChapters, setLatestChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [todayDay, setTodayDay] = useState<string>("");
  const [tomorrowDay, setTomorrowDay] = useState<string>("");

  useEffect(() => {
    setTodayDay(getRelativeDayName(0));
    setTomorrowDay(getRelativeDayName(1));

    const fetchData = async () => {
      try {
        const [mangasRes, chaptersRes] = await Promise.all([
          fetch("/api/mangas", { cache: "no-store" }),
          fetch("/api/chapters", { cache: "no-store" })
        ]);

        if (mangasRes.ok) {
          const mangasData = await mangasRes.json();
          setMangas(mangasData);
        }

        if (chaptersRes.ok) {
          const chaptersData = await chaptersRes.json();
          setLatestChapters(chaptersData);
        }
      } catch (error) {
        console.error("Ana sayfa verileri yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffMins < 60) {
      return `${Math.max(1, diffMins)}d önce`;
    } else if (diffHours < 24) {
      return `${diffHours}s önce`;
    } else {
      return `${diffDays} gün önce`;
    }
  };

  const getMangaType = (genres: string[]) => {
    if (!genres) return "MANGA";
    const genresLower = genres.map(g => g.toLowerCase());
    if (genresLower.includes("webtoon")) return "WEBTOON";
    if (genresLower.includes("manhwa")) return "MANHWA";
    if (genresLower.includes("manhua")) return "MANHUA";
    return "MANGA";
  };

  const getMangaTypeBadgeStyle = (type: string) => {
    switch (type) {
      case "MANHWA":
        return "bg-violet-600/90 text-white border-violet-500/30";
      case "MANHUA":
        return "bg-rose-600/90 text-white border-rose-500/30";
      case "WEBTOON":
        return "bg-amber-500/90 text-black border-amber-400/30";
      default:
        return "bg-cyan-600/90 text-white border-cyan-500/30";
    }
  };

  const getGroupedLatestChapters = () => {
    const groups: { [mangaId: string]: { manga: any; chapters: any[] } } = {};
    
    latestChapters.forEach((chapter) => {
      const manga = chapter.mangaId;
      if (!manga) return;
      
      if (!groups[manga._id]) {
        groups[manga._id] = {
          manga,
          chapters: []
        };
      }
      
      if (groups[manga._id].chapters.length < 3) {
        groups[manga._id].chapters.push(chapter);
      }
    });
    
    return Object.values(groups);
  };

  const groupedChapters = getGroupedLatestChapters();

  const trendingMangas = [...mangas]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  const todayReleases = mangas.filter(
    (m) => m.scheduleDay === todayDay && m.status === "Devam Ediyor"
  );
  const tomorrowReleases = mangas.filter(
    (m) => m.scheduleDay === tomorrowDay && m.status === "Devam Ediyor"
  );

  const featuredManga = mangas.length > 0
    ? [...mangas].sort((a, b) => {
      const aAvg = a.totalRatings > 0 ? (a.totalStars / a.totalRatings) : 0;
      const bAvg = b.totalRatings > 0 ? (b.totalStars / b.totalRatings) : 0;
      return bAvg - aAvg;
    })[0]
    : null;

  const latestMangas = mangas.slice(-4).reverse();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteManga = async (mangaId: string) => {
    if (!confirm("Bu mangayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
      return;
    }

    try {
      const res = await fetch(`/api/mangas/${mangaId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMangas((prev) => prev.filter((m) => m._id !== mangaId));
      } else {
        const data = await res.json();
        alert(data.error || "Manga silinirken bir hata oluştu.");
      }
    } catch (err) {
      console.error("Manga silme hatası:", err);
      alert("Manga silinirken bir hata oluştu.");
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-200 flex flex-col font-sans antialiased selection:bg-violet-500 selection:text-white relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-[-15%] left-[-15%] w-[800px] h-[800px] bg-violet-600/10 rounded-full blur-[160px] pointer-events-none -z-10 animate-float" />
      <div className="absolute top-[25%] right-[-15%] w-[700px] h-[700px] bg-indigo-650/10 rounded-full blur-[150px] pointer-events-none -z-10 animate-float-reverse" />
      <div className="absolute bottom-[10%] left-[10%] w-[900px] h-[900px] bg-purple-650/5 rounded-full blur-[180px] pointer-events-none -z-10" />

      {/* Global CSS for Grid Background and Floating Animations */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap');
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: #030303;
        }
        h1, h2, h3, h4 {
          font-family: 'Outfit', sans-serif;
        }
        .grid-bg {
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.008) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.008) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(12px) rotate(-1deg); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-reverse {
          animation: float-reverse 10s ease-in-out infinite;
        }
      `}</style>

      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 flex flex-col items-center gap-24 relative z-10 grid-bg">

        {/* HERO SECTION */}
        <section className="w-full grid md:grid-cols-12 gap-12 items-center pt-8 md:pt-16 animate-fade-in">
          <div className="md:col-span-7 flex flex-col items-start text-left gap-6">
            <div className="inline-flex items-center gap-2 bg-[#09090b]/80 border border-violet-500/20 text-violet-300 px-3.5 py-1 rounded-full text-xs font-semibold backdrop-blur-xl shadow-[0_0_15px_rgba(139,92,246,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Nexora Türkçe Manga & Webtoon
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.08] font-sans">
              Manga ve Manhwa <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 drop-shadow-[0_2px_15px_rgba(139,92,246,0.2)]">
                Panellerini Keşfet.
              </span>
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base font-light leading-relaxed max-w-xl">
              Türkiye'nin en hızlı çeviri ve edit ekibiyle popüler manga, manhwa ve webtoon serilerini yüksek kalitede, dikey mobil okuyucu moduyla Türkçe okuyun.
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <Link
                href="/mangalist"
                className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-6 py-3.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98] shadow-lg shadow-white/5"
              >
                Hemen Okumaya Başla
                <ArrowRight className="w-4 h-4 text-black" />
              </Link>
              <button
                onClick={() => signIn("discord")}
                className="bg-[#121214]/40 hover:bg-zinc-900/60 text-zinc-200 border border-zinc-850/80 text-xs font-bold px-6 py-3.5 rounded-xl transition-all cursor-pointer active:scale-[0.98] backdrop-blur-md hover:border-violet-500/20 shadow-md"
              >
                Discord Topluluğuna Katıl
              </button>
            </div>
          </div>

          {/* Real Manga Covers Grid (3D Collage style) */}
          <div className="md:col-span-5 w-full relative h-[380px] md:h-[450px] flex items-center justify-center hidden md:flex">
            {mangas.length === 0 ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="w-36 h-52 bg-[#121214] border border-zinc-800 rounded-xl shadow-2xl rotate-[-8deg] -translate-x-12 opacity-80" />
                <div className="w-36 h-52 bg-[#161619] border border-violet-500/30 rounded-xl shadow-2xl z-10 flex items-center justify-center">
                  <Disc className="w-10 h-10 text-zinc-850 animate-spin" />
                </div>
                <div className="w-36 h-52 bg-[#121214] border border-zinc-800 rounded-xl shadow-2xl rotate-[8deg] translate-x-12 opacity-80" />
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center perspective-[1000px] group">
                {mangas[1] && (
                  <Link 
                    href={`/mangalist/${mangas[1]._id}`} 
                    className="absolute w-36 h-52 rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.5)] border border-zinc-850/80 transition-all duration-500 ease-out z-10 group-hover:translate-x-[-120px] group-hover:rotate-[-16deg] group-hover:scale-95"
                    style={{ transform: "rotateY(-18deg) rotateX(10deg) translateZ(-50px) translateX(-60px)" }}
                  >
                    <img src={mangas[1].coverImage} alt="" className="w-full h-full object-cover" />
                  </Link>
                )}
                {mangas[2] && (
                  <Link 
                    href={`/mangalist/${mangas[2]._id}`} 
                    className="absolute w-36 h-52 rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.5)] border border-zinc-850/80 transition-all duration-500 ease-out z-10 group-hover:translate-x-[120px] group-hover:rotate-[16deg] group-hover:scale-95"
                    style={{ transform: "rotateY(18deg) rotateX(10deg) translateZ(-50px) translateX(60px)" }}
                  >
                    <img src={mangas[2].coverImage} alt="" className="w-full h-full object-cover" />
                  </Link>
                )}
                {mangas[0] && (
                  <Link 
                    href={`/mangalist/${mangas[0]._id}`} 
                    className="absolute w-40 h-56 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(139,92,246,0.18)] border-2 border-violet-500/40 z-20 transition-all duration-500 ease-out group-hover:scale-105 group-hover:-translate-y-2"
                    style={{ transform: "rotateY(0deg) rotateX(8deg) translateZ(30px) translateY(-10px)" }}
                  >
                    <img src={mangas[0].coverImage} alt={mangas[0].title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-[10px] font-mono text-violet-400 font-bold uppercase tracking-wider">Okumak İçin Tıkla</span>
                      <h4 className="font-extrabold text-white text-xs truncate mt-0.5">{mangas[0].title}</h4>
                    </div>
                  </Link>
                )}
              </div>
            )}
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-650/10 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse" />
          </div>
        </section>

        {/* STATISTICS SECTION */}
        <section className="w-full grid grid-cols-2 sm:grid-cols-4 gap-6 justify-center">
          {[
            { value: "1.5k+", label: "Kayıtlı Okuyucu" },
            { value: "450+", label: "Manga Oylaması" },
            { value: "20+", label: "Aktif Çeviri" },
            { value: "99.9%", label: "Hızlı Okuma" },
          ].map((stat, idx) => (
            <div 
              key={idx} 
              className="bg-[#121214]/25 backdrop-blur-md border border-zinc-850 hover:border-violet-500/25 p-5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(139,92,246,0.03)]"
            >
              <span className="text-3xl font-extrabold font-mono text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">{stat.value}</span>
              <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold">{stat.label}</span>
            </div>
          ))}
        </section>

        {/* LATEST UPDATES & TRENDING SECTION */}
        <section className="w-full grid lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT COLUMN: SON YÜKLENEN BÖLÜMLER */}
          <div className="lg:col-span-8 flex flex-col gap-6 w-full">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
              <div>
                <h2 className="text-xs font-mono uppercase tracking-wider text-violet-400 font-bold">Güncel Yayınlar</h2>
                <h3 className="text-2xl font-extrabold tracking-tight text-white mt-0.5">Son Yüklü Olanlar</h3>
              </div>
              <Link
                href="/mangalist"
                className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 font-semibold uppercase tracking-wider"
              >
                Katalog <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
                <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
                <span className="text-xs font-mono">Bölümler yükleniyor...</span>
              </div>
            ) : groupedChapters.length === 0 ? (
              <div className="bg-[#121214]/20 border border-zinc-850 border-dashed rounded-2xl p-16 text-center text-zinc-500 text-xs w-full">
                Yakında yeni bölümler eklenecektir.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {groupedChapters.map(({ manga, chapters }) => {
                  const mType = getMangaType(manga.genres);
                  const badgeStyle = getMangaTypeBadgeStyle(mType);
                  return (
                    <div
                      key={manga._id}
                      className="bg-gradient-to-br from-[#121214]/40 to-[#0a0a0c]/20 border border-zinc-850/80 hover:border-violet-500/25 rounded-2xl p-4 flex gap-5 transition-all duration-300 hover:shadow-[0_8px_25px_rgba(139,92,246,0.04)] group backdrop-blur-md"
                    >
                      {/* Manga Cover */}
                      <div className="w-24 h-36 bg-[#0a0a0a] rounded-xl border border-zinc-800/80 flex items-center justify-center overflow-hidden shrink-0 relative shadow-md">
                        <img
                          src={manga.coverImage}
                          alt={manga.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className={`absolute top-1.5 left-1.5 text-[7px] font-mono font-extrabold px-1.5 py-0.5 rounded uppercase border border-white/5 ${badgeStyle}`}>
                          {mType}
                        </span>
                      </div>

                      {/* Info & Chapter List */}
                      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                        <div className="min-w-0">
                          <Link href={`/mangalist/${manga._id}`} className="hover:text-violet-400 transition-colors">
                            <h4 className="font-extrabold text-white text-sm truncate leading-tight group-hover:text-violet-300 transition-colors" title={manga.title}>
                              {manga.title}
                            </h4>
                          </Link>
                          <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono mt-1">
                            <span>{manga.author}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 text-zinc-400">
                              <Eye className="w-2.5 h-2.5" />
                              {manga.views || 0}
                            </span>
                          </div>
                        </div>

                        {/* Chapter links */}
                        <div className="flex flex-col gap-1.5 mt-3">
                          {chapters.map((chapter) => (
                            <Link
                              key={chapter._id}
                              href={`/mangalist/${manga._id}/chapters/${chapter._id}`}
                              className="flex items-center justify-between bg-[#161619]/60 hover:bg-violet-900/25 hover:text-violet-300 border border-zinc-850 hover:border-violet-500/30 px-3 py-1.5 rounded-xl text-[11px] text-zinc-300 transition-all font-semibold active:scale-[0.98]"
                            >
                              <span className="truncate pr-1.5">{chapter.title}</span>
                              <span className="text-[9px] text-zinc-500 font-mono font-normal shrink-0">
                                {formatTimeAgo(chapter.createdAt)}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: HAFTALIK TRENDLER */}
          <div className="lg:col-span-4 flex flex-col gap-6 w-full lg:sticky lg:top-20">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
              <h3 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                Haftalık Trendler
              </h3>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-700" />
              </div>
            ) : trendingMangas.length === 0 ? (
              <p className="text-xs text-zinc-550 italic">Kayıtlı seri bulunamadı.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {trendingMangas.map((manga, index) => {
                  const rank = index + 1;
                  const rankBg =
                    rank === 1 ? "bg-gradient-to-br from-amber-400 to-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.25)]" :
                    rank === 2 ? "bg-gradient-to-br from-zinc-300 to-zinc-450 text-black" :
                    rank === 3 ? "bg-gradient-to-br from-amber-700 to-amber-800 text-white" :
                    "bg-[#161619] text-zinc-400 border border-zinc-800";
                  
                  return (
                    <Link
                      key={manga._id}
                      href={`/mangalist/${manga._id}`}
                      className="bg-[#121214]/45 border border-zinc-850 hover:border-violet-500/25 p-3 rounded-2xl flex items-center justify-between gap-3 transition-all group backdrop-blur-md hover:shadow-md"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${rankBg}`}>
                          {rank}
                        </span>

                        <img src={manga.coverImage} alt="" className="w-9 h-12 object-cover rounded-md border border-zinc-800 shrink-0" />
                        
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-white block group-hover:text-violet-400 transition-colors truncate">{manga.title}</span>
                          <span className="text-[9px] text-zinc-550 block truncate mt-0.5 font-mono">{manga.genres?.slice(0, 2).join(", ")}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono shrink-0">
                        <Eye className="w-3.5 h-3.5 text-zinc-650" />
                        {manga.views || 0}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* YAKINDA GELECEK OLANLAR (YAYIN TAKVİMİ) */}
        <section className="w-full flex flex-col gap-8 pt-6 border-t border-zinc-900">
          <div className="w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="text-left flex flex-col gap-1.5">
              <h2 className="text-xs font-mono uppercase tracking-wider text-violet-400 font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-violet-400" />
                Haftalık Yayın Takvimi
              </h2>
              <h3 className="text-3xl font-extrabold tracking-tight text-white font-sans">Yakında Gelecek Olanlar</h3>
              <p className="text-zinc-400 text-xs font-light max-w-xl">
                Bugün ve önümüzdeki günlerde yeni bölüm yayınlanması planlanan güncel seriler.
              </p>
            </div>
            <Link
              href="/takvim"
              className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold px-4.5 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-[0.98] w-fit font-sans"
            >
              Tam Takvimi İncele
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bugün Bölümü */}
            <div className="bg-[#121214]/20 border border-zinc-850/80 p-6 rounded-2xl flex flex-col gap-4 backdrop-blur-md">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <span className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Bugün Çıkacaklar
                </span>
                <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold tracking-wide bg-[#030303] px-2.5 py-0.5 rounded-md border border-zinc-850">
                  {todayDay}
                </span>
              </div>

              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-700" />
                </div>
              ) : todayReleases.length === 0 ? (
                <p className="text-xs text-zinc-500 py-8 text-center italic font-light">Bugün için yayınlanacak yeni bölüm bulunmuyor.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {todayReleases.map((manga) => (
                    <Link
                      key={manga._id}
                      href={`/mangalist/${manga._id}`}
                      className="bg-[#0a0a0b]/60 hover:bg-violet-950/20 hover:border-violet-500/20 border border-zinc-850 p-3 rounded-xl flex items-center justify-between gap-4 transition-all group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={manga.coverImage} alt="" className="w-9 h-12 object-cover rounded border border-zinc-800 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-extrabold text-xs text-white block group-hover:text-violet-400 transition-colors truncate">{manga.title}</span>
                          <span className="text-[9px] text-zinc-550 block truncate mt-0.5 font-mono">{manga.author}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Yarın Bölümü */}
            <div className="bg-[#121214]/20 border border-zinc-850/80 p-6 rounded-2xl flex flex-col gap-4 backdrop-blur-md">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <span className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-550"></span>
                  </span>
                  Yarın Çıkacaklar
                </span>
                <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold tracking-wide bg-[#030303] px-2.5 py-0.5 rounded-md border border-zinc-850">
                  {tomorrowDay}
                </span>
              </div>

              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-700" />
                </div>
              ) : tomorrowReleases.length === 0 ? (
                <p className="text-xs text-zinc-550 py-8 text-center italic font-light">Yarın için yayınlanacak yeni bölüm bulunmuyor.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {tomorrowReleases.map((manga) => (
                    <Link
                      key={manga._id}
                      href={`/mangalist/${manga._id}`}
                      className="bg-[#0a0a0b]/60 hover:bg-violet-950/20 hover:border-violet-500/20 border border-zinc-855 p-3 rounded-xl flex items-center justify-between gap-4 transition-all group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={manga.coverImage} alt="" className="w-9 h-12 object-cover rounded border border-zinc-800 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-extrabold text-xs text-white block group-hover:text-violet-400 transition-colors truncate">{manga.title}</span>
                          <span className="text-[9px] text-zinc-550 block truncate mt-0.5 font-mono">{manga.author}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* HAFTANIN ÖNE ÇIKAN MANGASI */}
        {featuredManga ? (
          <section className="w-full flex flex-col gap-6 pt-6 border-t border-zinc-900">
            <div className="text-left">
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">Topluluk Favorisi</h2>
              <h3 className="text-xl font-extrabold text-white tracking-tight">Haftanın Öne Çıkan Mangası</h3>
            </div>

            <div className="w-full bg-gradient-to-br from-[#161619]/60 to-[#0e0e10]/30 border border-zinc-850/80 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden backdrop-blur-md shadow-lg">
              {/* Blur Background Cover Image */}
              {featuredManga.coverImage && (
                <div
                  className="absolute inset-0 opacity-10 blur-[130px] pointer-events-none scale-150 transition-all duration-700"
                  style={{ backgroundImage: `url(${featuredManga.coverImage})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
                />
              )}

              {/* Cover Art */}
              <div className="w-44 h-64 bg-zinc-950 rounded-xl border border-zinc-800/80 flex items-center justify-center overflow-hidden shrink-0 relative z-10 shadow-2xl">
                {featuredManga.coverImage ? (
                  <img src={featuredManga.coverImage} alt={featuredManga.title} className="w-full h-full object-cover" />
                ) : (
                  <Disc className="w-10 h-10 text-zinc-800 animate-spin" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 flex flex-col justify-between py-1 relative z-10 self-stretch min-w-0">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm">
                      ★ Öne Çıkan
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#0a0a0b]/80 text-zinc-400 border border-zinc-850 flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {featuredManga.status}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate leading-tight">
                    {featuredManga.title}
                  </h3>
                  <p className="text-xs font-mono text-zinc-400 mt-1 mb-4">
                    Yazar: {featuredManga.author} {featuredManga.artist ? ` / Çizer: ${featuredManga.artist}` : ""}
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light max-w-2xl mb-6 line-clamp-3">
                    {featuredManga.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {featuredManga.genres?.map((genre: string) => (
                      <span key={genre} className="text-[9px] font-mono px-2.5 py-0.5 rounded bg-[#0a0a0b]/80 text-zinc-450 border border-zinc-850">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 border-t border-zinc-900 pt-5 mt-auto">
                  <div className="flex-1">
                    <StarRating
                      targetId={featuredManga._id}
                      targetType="manga"
                      initialTotalStars={featuredManga.totalStars || 0}
                      initialTotalRatings={featuredManga.totalRatings || 0}
                    />
                  </div>
                  {session && (
                    <div className="flex items-center justify-between bg-[#0a0a0b]/60 border border-zinc-850 rounded-xl p-3.5 gap-4 shrink-0 shadow-md">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-zinc-300">Discord Bildirim</span>
                        <span className="text-[9px] text-zinc-500 font-light truncate">Yeni bölüm pingi al</span>
                      </div>
                      <DiscordSubscribeButton mangaId={featuredManga._id} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* SON EKLENEN MANGALAR */}
        <section className="w-full flex flex-col gap-8 pt-10 border-t border-zinc-900">
          <div className="w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="text-left flex flex-col gap-1.5">
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Son Gelişmeler</h2>
              <h3 className="text-3xl font-extrabold tracking-tight text-white">Yeni Eklenen Seriler</h3>
              <p className="text-zinc-400 text-xs font-light max-w-xl">
                Kataloğumuza yeni katılan en taze manga serilerine göz atın.
              </p>
            </div>
            <Link
              href="/mangalist"
              className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold px-4.5 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-[0.98] w-fit font-sans"
            >
              Tüm Kataloğu Gör
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
                <span className="text-xs font-mono">Yükleniyor...</span>
              </div>
            ) : latestMangas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 border border-dashed border-zinc-850 rounded-2xl text-center max-w-md mx-auto w-full">
                <span className="text-zinc-350 font-semibold text-sm mb-1.5">Manga Yok</span>
                <p className="text-xs text-zinc-500 leading-relaxed font-light">Veritabanında henüz manga kaydı bulunmuyor.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8 items-start">
                {latestMangas.map((manga) => {
                  const statusDot =
                    manga.status === "Devam Ediyor" ? "bg-emerald-500" :
                      manga.status === "Tamamlandı" ? "bg-blue-500" :
                        "bg-amber-500";

                  return (
                    <div
                      key={manga._id}
                      className="bg-gradient-to-br from-[#161619]/45 to-[#0c0c0e]/20 border border-zinc-850/70 rounded-2xl p-5 flex flex-col sm:flex-row gap-6 hover:border-violet-500/25 transition-all duration-300 hover:shadow-[0_12px_30px_rgba(139,92,246,0.05)] hover:-translate-y-0.5 relative group backdrop-blur-md"
                    >
                      {/* Cover Frame */}
                      <div className="w-full sm:w-40 h-56 bg-zinc-955 rounded-xl border border-zinc-800/80 flex items-center justify-center relative overflow-hidden shrink-0 shadow-md">
                        {manga.coverImage && (manga.coverImage.startsWith("http") || manga.coverImage.startsWith("/") || manga.coverImage.startsWith("data:")) ? (
                          <img
                            src={manga.coverImage}
                            alt={manga.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-4">
                            <Disc className="w-8 h-8 text-zinc-850 animate-spin mb-2" />
                            <span className="text-[10px] font-mono text-zinc-650 uppercase tracking-widest leading-tight">
                              {manga.title}
                            </span>
                          </div>
                        )}

                        <span className="absolute top-2.5 left-2.5 text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#0a0a0b]/80 text-zinc-400 border border-zinc-850 flex items-center gap-1 shadow-sm">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                          {manga.status}
                        </span>
                      </div>

                      {/* Manga Info */}
                      <div className="flex flex-col justify-between py-0.5 flex-1 min-w-0">
                        <div>
                          {/* Title & Actions */}
                          <div className="flex justify-between items-start gap-2">
                            <Link href={`/mangalist/${manga._id}`} className="hover:underline min-w-0 flex-1">
                              <h2 className="text-xl font-extrabold text-white mb-1.5 leading-tight tracking-tight truncate font-sans group-hover:text-violet-400 transition-colors">
                                {manga.title}
                              </h2>
                            </Link>
                            {(session?.user?.role === "admin" || session?.user?.role === "mod") && (
                              <div className="flex items-center gap-1.5 shrink-0 relative z-20">
                                <Link
                                  href={`/admin/add-manga?edit=${manga._id}`}
                                  className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white p-1 rounded-md transition-colors"
                                  title="Düzenle"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  onClick={() => handleDeleteManga(manga._id)}
                                  className="bg-zinc-950 hover:bg-red-950/80 border border-zinc-800 hover:border-red-900/60 text-zinc-400 hover:text-red-400 p-1 rounded-md transition-colors cursor-pointer"
                                  title="Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Author & Stats */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-zinc-400 mb-3 border-b border-zinc-900 pb-2.5">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-zinc-550" />
                              {manga.author}
                            </span>
                            <span className="text-zinc-800 font-mono select-none">|</span>
                            <span className="flex items-center gap-1 text-zinc-300">
                              <BookOpen className="w-3 h-3 text-zinc-550" />
                              {manga.chapterCount || 0} Bölüm
                            </span>
                            {manga.views !== undefined && (
                              <>
                                <span className="text-zinc-800 font-mono select-none">|</span>
                                <span className="flex items-center gap-1 text-zinc-300">
                                  <Eye className="w-3.5 h-3.5 text-zinc-550" /> {manga.views}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 mb-4 font-light">
                            {manga.description}
                          </p>

                          {/* Genres */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {manga.genres?.map((genre: string) => (
                              <span
                                key={genre}
                                className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#0a0a0b]/80 text-zinc-400 border border-zinc-850"
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Area */}
                        <div className="flex flex-col gap-3 border-t border-zinc-900 pt-3.5 mt-4">
                          <Link
                            href={`/mangalist/${manga._id}`}
                            className="w-full bg-white hover:bg-zinc-200 text-black text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
                          >
                            <BookOpenCheck className="w-4 h-4" />
                            Oku
                          </Link>

                          {session && (
                            <div className="flex items-center justify-between bg-[#0a0a0b]/40 border border-zinc-850 rounded-xl p-2.5">
                              <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-bold text-zinc-350">Discord Bildirimi</span>
                                <span className="text-[9px] text-zinc-500 font-light truncate">Yeni bölümde rol al.</span>
                              </div>
                              <DiscordSubscribeButton mangaId={manga._id} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* BENTO GRID FEATURES */}
        <section className="w-full flex flex-col gap-10 font-sans">
          <div className="text-left">
            <h2 className="text-xs font-mono uppercase tracking-wider text-violet-400 font-bold mb-2">Platform Özellikleri</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Okuyucu Deneyimini En Üst Seviyeye Çıkarın</h3>
          </div>

          <div className="grid md:grid-cols-12 gap-6">
            {/* Box 1: Discord Bot */}
            <div className="md:col-span-8 bg-gradient-to-br from-[#161619]/40 to-[#0d0d0f]/20 border border-zinc-850/80 rounded-2xl p-6 flex flex-col sm:flex-row gap-8 justify-between items-start backdrop-blur-md">
              <div className="flex flex-col gap-3 max-w-md">
                <div className="bg-zinc-950 border border-zinc-850 p-2.5 rounded-xl text-white w-fit shadow-md">
                  <Bell className="w-4 h-4 text-violet-400" />
                </div>
                <h4 className="text-lg font-extrabold text-white">Dinamik Discord Rol Bildirimi</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Kullanıcılarınız kataloğumuzdaki mangalara tek tıkla abone olabilir. Yeni bölüm yayınlandığında Discord sunucunuzdaki bot otomatik rol ataması gerçekleştirerek anında ping gönderilmesini sağlar.
                </p>
              </div>
              <div className="w-full sm:w-60 bg-zinc-950 border border-zinc-850 rounded-xl p-4 shrink-0 flex flex-col gap-2.5 shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">BOT CONFIG CONSOLE</span>
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="flex justify-between items-center bg-[#161616]/40 p-2.5 rounded-lg border border-zinc-850">
                  <span className="text-[10px] text-zinc-450 font-mono">Guild ID</span>
                  <span className="text-[9px] text-violet-400 font-mono">15133...713</span>
                </div>
                <div className="flex justify-between items-center bg-[#161616]/40 p-2.5 rounded-lg border border-zinc-850">
                  <span className="text-[10px] text-zinc-455 font-mono">Default Role</span>
                  <span className="text-[9px] text-emerald-400 font-mono">@Nexora</span>
                </div>
              </div>
            </div>

            {/* Box 2: Okuma Deneyimi */}
            <div className="md:col-span-4 bg-gradient-to-br from-[#161619]/40 to-[#0d0d0f]/20 border border-zinc-850/80 rounded-2xl p-6 flex flex-col justify-between gap-8 backdrop-blur-md">
              <div className="bg-zinc-950 border border-zinc-850 p-2.5 rounded-xl text-white w-fit shadow-md">
                <Activity className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-lg font-extrabold text-white">Dikey Webtoon Okuyucu</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Manga sayfalarını dikey olarak sıralı yükleyen, mobil ve tablet ekranlarıyla %100 uyumlu, reklamsız ve kesintisiz okuma arayüzü.
                </p>
              </div>
            </div>

            {/* Box 3: Profil & Kütüphane */}
            <div className="md:col-span-5 bg-gradient-to-br from-[#161619]/40 to-[#0d0d0f]/20 border border-zinc-850/80 rounded-2xl p-6 flex flex-col justify-between gap-8 backdrop-blur-md">
              <div className="bg-zinc-950 border border-zinc-855 p-2.5 rounded-xl text-white w-fit shadow-md">
                <User className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-lg font-extrabold text-white">Kişisel Kütüphane</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Abone olduğunuz serileri ve puanladığınız tüm bölümleri tek bir profil paneli üzerinden yönetin, kendi okuma listenizi oluşturun.
                </p>
              </div>
            </div>

            {/* Box 4: Puanlama */}
            <div className="md:col-span-7 bg-gradient-to-br from-[#161619]/40 to-[#0d0d0f]/20 border border-zinc-850/80 rounded-2xl p-6 flex flex-col sm:flex-row gap-8 justify-between items-start backdrop-blur-md">
              <div className="flex flex-col gap-3 max-w-md">
                <div className="bg-zinc-950 border border-zinc-850 p-2.5 rounded-xl text-white w-fit shadow-md">
                  <Star className="w-4 h-4 text-violet-400" />
                </div>
                <h4 className="text-lg font-extrabold text-white">Puanlama Sistemi</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Okuyucularınız mangaları ve bölümleri 5 yıldız üzerinden derecelendirebilir. Çift oy koruması ile dürüst ve temiz istatistikler elde edersiniz.
                </p>
              </div>
              <div className="w-full sm:w-48 bg-zinc-950 border border-zinc-850 rounded-xl p-4 shrink-0 flex flex-col items-center gap-1.5 justify-center shadow-xl">
                <span className="text-4xl font-mono font-extrabold text-white leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-violet-300">4.8</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-amber-450 text-amber-450 border-none" />
                  ))}
                </div>
                <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider mt-1.5 font-bold">452 Toplam Oy</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Back to top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-zinc-950 hover:bg-zinc-900 hover:text-violet-400 text-white border border-zinc-850 rounded-full cursor-pointer active:scale-95 z-50 animate-fade-in shadow-lg hover:shadow-violet-500/10 hover:border-violet-500/30 transition-all duration-300"
          aria-label="Yukarı Çık"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12 text-center text-xs text-zinc-550 bg-[#020202]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-5">
          <span>Nexora © {new Date().getFullYear()} • Vercel Style</span>
          <div className="flex gap-5 font-mono text-[9.5px] tracking-wide">
            <Link href="/mangalist" className="hover:text-zinc-300 cursor-pointer">Katalog</Link>
            <span className="hover:text-zinc-300 cursor-pointer">Terms</span>
            <span className="hover:text-zinc-300 cursor-pointer">Privacy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useEffect, useState, use } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StarRating from "@/components/StarRating";
import DiscordSubscribeButton from "@/components/DiscordSubscribeButton";
import Navbar from "@/components/Navbar";
import { 
  BookOpen, ShieldCheck, User, Disc, Loader2, ArrowLeft, 
  PlusCircle, Edit, Trash2, Calendar, FileText, ChevronRight,
  Star, Heart, AlertTriangle, Check, X, Clock, Bell
} from "lucide-react";
import Link from "next/link";

interface MangaDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function MangaDetailsPage(props: MangaDetailsPageProps) {
  const params = use(props.params);
  const id = params.id;
  
  const { data: session } = useSession();
  const router = useRouter();

  const [manga, setManga] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [deleting, setDeleting] = useState<boolean>(false);
  const [updatingSchedule, setUpdatingSchedule] = useState<boolean>(false);
  
  // Library Tracking States
  const [readingStatus, setReadingStatus] = useState<string>("Liste Dışı");
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [trackerLoading, setTrackerLoading] = useState<boolean>(false);

  // Hata Bildirme State'leri
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportChapterId, setReportChapterId] = useState<string>("general");
  const [reportMessage, setReportMessage] = useState<string>("");
  const [submittingReport, setSubmittingReport] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);

  const isStaff = session?.user?.role === "admin" || session?.user?.role === "mod";

  // Hata Bildirimlerini Çek (Sadece Yetkililer)
  useEffect(() => {
    if (isStaff && id) {
      const fetchReports = async () => {
        setLoadingReports(true);
        try {
          const res = await fetch(`/api/reports?mangaId=${id}`);
          if (res.ok) {
            const data = await res.json();
            setReports(data);
          }
        } catch (err) {
          console.error("Hata bildirimleri çekilirken hata:", err);
        } finally {
          setLoadingReports(false);
        }
      };
      fetchReports();
    }
  }, [id, session, isStaff]);

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("Bu hata bildirimini silmek istediğinize emin misiniz?")) {
      return;
    }
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setReports(prev => prev.filter(r => r._id !== reportId));
      } else {
        const data = await res.json();
        alert(data.error || "Hata bildirimi silinemedi.");
      }
    } catch (err) {
      console.error("Silme hatası:", err);
      alert("Hata bildirimi silinirken bir hata oluştu.");
    }
  };

  const handleMangaScheduleChange = async (newDay: string) => {
    setUpdatingSchedule(true);
    try {
      const res = await fetch(`/api/mangas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleDay: newDay
        })
      });

      if (res.ok) {
        setManga((prev: any) => ({ ...prev, scheduleDay: newDay }));
        router.refresh();
      } else {
        const errData = await res.json();
        alert(errData.error || "Yayın günü güncellenemedi.");
      }
    } catch (err) {
      console.error("Yayın günü güncelleme hatası:", err);
      alert("Bağlantı hatası oluştu.");
    } finally {
      setUpdatingSchedule(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportMessage.trim()) return;

    setSubmittingReport(true);
    setReportError(null);
    setReportSuccess(false);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mangaId: id,
          chapterId: reportChapterId === "general" ? undefined : reportChapterId,
          message: reportMessage
        })
      });

      const data = await res.json();

      if (res.ok) {
        setReportSuccess(true);
        setReportMessage("");
        setReportChapterId("general");
        setTimeout(() => {
          setShowReportModal(false);
          setReportSuccess(false);
        }, 1500);
      } else {
        setReportError(data.error || "Hata bildirimi gönderilemedi.");
      }
    } catch (err) {
      console.error("Hata bildirimi gönderme hatası:", err);
      setReportError("Hata bildirimi gönderilirken hata oluştu.");
    } finally {
      setSubmittingReport(false);
    }
  };

  useEffect(() => {
    if (session && session.user?.discordId) {
      const fetchUserTracking = async () => {
        try {
          const res = await fetch(`/api/profile/${session.user.discordId}`);
          if (res.ok) {
            const data = await res.json();
            const trackedItem = data.mangaList?.find((item: any) => (item.mangaId?._id || item.mangaId) === id);
            if (trackedItem) {
              setReadingStatus(trackedItem.status);
              setIsFavorite(trackedItem.isFavorite);
            } else {
              setReadingStatus("Liste Dışı");
              setIsFavorite(false);
            }
          }
        } catch (err) {
          console.error("Kullanıcı takip bilgisi çekilemedi:", err);
        }
      };
      fetchUserTracking();
    }
  }, [id, session]);

  const handleStatusChange = async (newStatus: string) => {
    if (!session) {
      signIn("discord");
      return;
    }
    setTrackerLoading(true);
    try {
      if (newStatus === "Liste Dışı") {
        const res = await fetch(`/api/profile/manga-list?mangaId=${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setReadingStatus("Liste Dışı");
          setIsFavorite(false);
        }
      } else {
        const res = await fetch("/api/profile/manga-list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mangaId: id, status: newStatus, isFavorite }),
        });
        if (res.ok) {
          setReadingStatus(newStatus);
        }
      }
    } catch (err) {
      console.error("Takip durumu güncellenemedi:", err);
    } finally {
      setTrackerLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!session) {
      signIn("discord");
      return;
    }
    setTrackerLoading(true);
    const newFavorite = !isFavorite;
    try {
      const currentStatus = readingStatus === "Liste Dışı" ? "Okuyor" : readingStatus;
      const res = await fetch("/api/profile/manga-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mangaId: id, status: currentStatus, isFavorite: newFavorite }),
      });
      if (res.ok) {
        setIsFavorite(newFavorite);
        if (readingStatus === "Liste Dışı") {
          setReadingStatus(currentStatus);
        }
      }
    } catch (err) {
      console.error("Favori durumu güncellenemedi:", err);
    } finally {
      setTrackerLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const mangaRes = await fetch(`/api/mangas/${id}`);
        if (!mangaRes.ok) {
          throw new Error("Manga detayları yüklenemedi.");
        }
        const mangaData = await mangaRes.json();
        setManga(mangaData);

        const chaptersRes = await fetch(`/api/mangas/${id}/chapters`);
        if (chaptersRes.ok) {
          const chaptersData = await chaptersRes.json();
          setChapters(chaptersData);
        }
      } catch (err: any) {
        setError(err.message || "Bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleDeleteManga = async () => {
    const confirmDelete = window.confirm("Bu mangayı ve ona ait tüm verileri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.");
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/mangas/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/mangalist");
      } else {
        const data = await res.json();
        alert(data.error || "Manga silinirken bir hata oluştu.");
      }
    } catch (err) {
      console.error("Manga silme hatası:", err);
      alert("Manga silinirken bir hata oluştu.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteChapter = async (e: React.MouseEvent, chapterId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmDelete = window.confirm("Bu bölümü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/chapters/${chapterId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setChapters((prev) => prev.filter((ch) => ch._id !== chapterId));
      } else {
        const data = await res.json();
        alert(data.error || "Bölüm silinirken bir hata oluştu.");
      }
    } catch (err) {
      console.error("Bölüm silme hatası:", err);
      alert("Bölüm silinirken bir hata oluştu.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <span className="text-xs font-mono text-zinc-550">Manga detayları yükleniyor...</span>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="bg-[#161616] border border-zinc-800 p-8 rounded-md max-w-sm w-full">
            <h1 className="text-lg font-bold text-white mb-2">Hata Oluştu</h1>
            <p className="text-xs text-zinc-400 mb-6 font-light">{error || "Manga bulunamadı."}</p>
            <Link href="/mangalist" className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold px-4 py-2.5 rounded-md transition-all">
              Kataloğa Dön
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const statusDot = 
    manga.status === "Devam Ediyor" ? "bg-emerald-500" :
    manga.status === "Tamamlandı" ? "bg-blue-500" :
    "bg-amber-500";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col font-sans antialiased selection:bg-white selection:text-black animate-fade-in">
      {/* Vercel Font Import */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
      `}</style>

      {/* Header */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 flex flex-col gap-10">
        
        {/* Navigation Breadcrumb */}
        <div>
          <Link href="/mangalist" className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-semibold uppercase tracking-wider">
            <ArrowLeft className="w-3.5 h-3.5" /> Kataloğa Dön
          </Link>
        </div>

        {/* Manga Banner Section */}
        <section className="w-full bg-[#121214]/80 backdrop-blur-md border border-zinc-850 rounded-2xl p-6 sm:p-8 flex flex-col gap-8 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {manga.coverImage && (
            <div 
              className="absolute inset-0 opacity-10 blur-[100px] pointer-events-none scale-150 transition-all duration-700"
              style={{ backgroundImage: `url(${manga.coverImage})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
            />
          )}
          {/* Subtle colored glow based on manga status */}
          <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-[120px] pointer-events-none -z-10 opacity-20 transition-all duration-500 ${
            manga.status === "Devam Ediyor" ? "bg-emerald-500/30" :
            manga.status === "Tamamlandı" ? "bg-sky-500/30" :
            "bg-amber-500/30"
          }`} />

          {/* Top row: Cover image and main details */}
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10 w-full">
            {/* Cover Art */}
            <div className="w-48 h-68 bg-[#0a0a0b] rounded-xl border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 relative z-10 shadow-2xl group transition-all duration-300 hover:border-violet-500/40">
              {manga.coverImage ? (
                <img src={manga.coverImage} alt={manga.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <Disc className="w-10 h-10 text-zinc-850 animate-spin" />
              )}
            </div>

            {/* Details */}
            <div className="flex-1 flex flex-col justify-between py-1 min-w-0 self-stretch">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-[#0a0a0b]/80 text-zinc-350 border border-zinc-800 flex items-center gap-1.5 shadow-sm">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot} animate-pulse`} />
                      {manga.status}
                    </span>
                    <span className="text-[10px] font-bold font-mono px-3 py-1 rounded-full bg-[#0a0a0b]/80 border border-zinc-800 text-zinc-350 flex items-center gap-1.5 shadow-sm">
                      <Calendar className="w-3.5 h-3.5 text-zinc-550" />
                      {manga.releaseYear}
                    </span>

                    {/* Yayın Günü Gösterimi */}
                    <div className="text-[10px] font-bold font-mono px-3 py-1 rounded-full bg-[#0a0a0b]/80 border border-zinc-800 text-zinc-350 flex items-center gap-1.5 shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-violet-400" />
                      {isStaff ? (
                        <div className="flex items-center gap-1">
                          <span className="text-zinc-500 mr-0.5">Yayın:</span>
                          <select
                            value={manga.scheduleDay || "Belirsiz"}
                            disabled={updatingSchedule}
                            onChange={(e) => handleMangaScheduleChange(e.target.value)}
                            className="bg-transparent text-violet-400 font-bold focus:text-violet-300 outline-none cursor-pointer border-none p-0 pr-1 text-[10px]"
                            title="Takvim gününü güncelle"
                          >
                            <option value="Belirsiz" className="bg-[#121214] text-white">Belirsiz</option>
                            <option value="Pazartesi" className="bg-[#121214] text-white">Pazartesi</option>
                            <option value="Salı" className="bg-[#121214] text-white">Salı</option>
                            <option value="Çarşamba" className="bg-[#121214] text-white">Çarşamba</option>
                            <option value="Perşembe" className="bg-[#121214] text-white">Perşembe</option>
                            <option value="Cuma" className="bg-[#121214] text-white">Cuma</option>
                            <option value="Cumartesi" className="bg-[#121214] text-white">Cumartesi</option>
                            <option value="Pazar" className="bg-[#121214] text-white">Pazar</option>
                          </select>
                          {updatingSchedule && <Loader2 className="w-3 h-3 animate-spin text-violet-400" />}
                        </div>
                      ) : (
                        <span>Yayın Günü: {manga.scheduleDay || "Belirsiz / Düzensiz"}</span>
                      )}
                    </div>
                  </div>

                  {/* Admin Controls */}
                  {isStaff && (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/add-manga?edit=${manga._id}`}
                        className="bg-[#0a0a0b] hover:bg-zinc-900 border border-zinc-800 text-zinc-350 p-2.5 rounded-lg transition-all hover:text-white hover:border-zinc-750 active:scale-95 shadow-md"
                        title="Manga Bilgilerini Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={handleDeleteManga}
                        disabled={deleting}
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 p-2.5 rounded-lg transition-all active:scale-95 disabled:opacity-50 shadow-md animate-fade-in"
                        title="Mangayı Sil"
                      >
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-none mb-3 font-outfit bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-zinc-400">
                  {manga.title}
                </h1>
                
                <div className="flex flex-col gap-1 text-[11px] font-mono text-zinc-400 mb-5">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-550" />
                    <span>Yazar: <strong className="text-zinc-350 font-semibold">{manga.author}</strong></span>
                    {manga.artist && (
                      <>
                        <span className="text-zinc-650">•</span>
                        <span>Çizer: <strong className="text-zinc-350 font-semibold">{manga.artist}</strong></span>
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-light max-w-3xl mb-6 bg-[#0a0a0b]/30 p-4 border border-zinc-900/50 rounded-xl backdrop-blur-sm">
                  {manga.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {manga.genres?.map((genre: string) => (
                    <span key={genre} className="text-[9px] font-bold font-mono px-3 py-1 rounded-full bg-[#0a0a0b]/60 text-zinc-450 border border-zinc-800 shadow-sm hover:border-violet-500/20 transition-colors">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row: Ratings & Notifications & Tracking */}
          <div className="flex flex-col md:flex-row flex-wrap items-stretch gap-4 border-t border-zinc-850 pt-6 mt-4 relative z-10 w-full">
            <div className="flex-1 min-w-[240px]">
              <StarRating
                targetId={manga._id}
                targetType="manga"
                initialTotalStars={manga.totalStars || 0}
                initialTotalRatings={manga.totalRatings || 0}
              />
            </div>

            {/* Library Tracker */}
            <div className="flex-1 min-w-[290px] bg-[#0a0a0b]/60 border border-zinc-850/85 rounded-xl p-4 flex items-center justify-between gap-4 backdrop-blur-md shadow-sm">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-zinc-300 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-zinc-500" />
                  Kütüphane
                </span>
                <span className="text-[9px] text-zinc-550 font-light truncate">Takip durumu seçin</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleToggleFavorite}
                  disabled={trackerLoading}
                  className={`p-2 rounded-lg border transition-all cursor-pointer active:scale-95 ${
                    isFavorite
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                      : "bg-[#121214] border-zinc-800 text-zinc-500 hover:text-zinc-350 hover:border-zinc-700"
                  }`}
                  title={isFavorite ? "Favorilerden Çıkar" : "Favoriye Ekle"}
                >
                  <Star className={`w-3.5 h-3.5 ${isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
                </button>

                <select
                  value={readingStatus}
                  disabled={trackerLoading}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="bg-[#121214] border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold outline-none cursor-pointer transition-colors"
                >
                  <option value="Liste Dışı">Listeden Kaldır</option>
                  <option value="Okuyor">Okuyor</option>
                  <option value="Okuyacak">Okuyacak</option>
                  <option value="Okudu">Okudu</option>
                </select>
              </div>
            </div>

            {/* Discord Subscribe */}
            {session ? (
              <div className="flex-1 min-w-[290px] bg-[#0a0a0b]/60 border border-zinc-850/85 rounded-xl p-4 flex items-center justify-between gap-4 backdrop-blur-md shadow-sm">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-zinc-300 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-zinc-550" />
                    Bildirimler
                  </span>
                  <span className="text-[9px] text-zinc-550 font-light truncate">Yeni bölüm pingi al</span>
                </div>
                <div className="shrink-0">
                  <DiscordSubscribeButton mangaId={manga._id} />
                </div>
              </div>
            ) : (
              <div className="flex-1 min-w-[290px] bg-[#0a0a0b]/30 border border-zinc-850 border-dashed rounded-xl p-4 flex items-center justify-between gap-3 opacity-60">
                <span className="text-[9px] text-zinc-550 leading-normal">Discord bildirimlerini açmak için giriş yapmalısınız.</span>
              </div>
            )}

            {/* Hata Bildir */}
            {session ? (
              <div className="flex-1 min-w-[220px] bg-[#0a0a0b]/60 border border-zinc-850/85 rounded-xl p-4 flex items-center justify-between gap-4 backdrop-blur-md shadow-sm">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-zinc-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-zinc-550" />
                    Sorun Bildir
                  </span>
                  <span className="text-[9px] text-zinc-550 font-light truncate">Çeviri/sayfa hatası</span>
                </div>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/15 text-red-400 border border-red-500/20 hover:border-red-500/30 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Hata Bildir
                </button>
              </div>
            ) : (
              <div className="flex-1 min-w-[220px] bg-[#0a0a0b]/30 border border-zinc-850 border-dashed rounded-xl p-4 flex items-center justify-between gap-3 opacity-60">
                <span className="text-[9px] text-zinc-555 leading-normal">Hata bildirmek için giriş yapmalısınız.</span>
              </div>
            )}
          </div>
        </section>

        {/* Chapters Section */}
        <section className="w-full flex flex-col gap-6 pt-6 border-t border-zinc-900">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight font-outfit">Manga Bölümleri</h2>
              <p className="text-xs text-zinc-500 font-light mt-0.5">Yayınlanan tüm bölümler aşağıda sıralanmıştır.</p>
            </div>
            
            {/* Admin Add Chapter Button */}
            {isStaff && (
              <Link
                href={`/admin/mangas/${manga._id}/add-chapter`}
                className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 active:scale-[0.98] shadow-md shadow-white/5"
              >
                <PlusCircle className="w-4 h-4" />
                Yeni Bölüm Ekle
              </Link>
            )}
          </div>

          {chapters.length === 0 ? (
            <div className="bg-[#121214]/50 border border-zinc-850 border-dashed rounded-xl p-12 text-center text-zinc-500 text-xs w-full">
              <span className="font-semibold block mb-1 text-zinc-400">Bölüm Bulunamadı</span>
              Bu manga için henüz yüklenmiş bir bölüm bulunmuyor.
            </div>
          ) : (
            <div className="bg-[#121214]/40 border border-zinc-850 rounded-xl overflow-hidden shadow-sm">
              <div className="flex flex-col divide-y divide-zinc-900">
                {chapters.map((chapter, index) => (
                  <div 
                    key={chapter._id} 
                    className="flex justify-between items-center p-4 hover:bg-[#1a1a1e]/40 transition-colors group relative"
                  >
                    <Link 
                      href={`/mangalist/${id}/chapters/${chapter._id}`}
                      className="flex-1 flex justify-between items-center min-w-0"
                    >
                      <div className="flex items-center gap-4.5 min-w-0 pr-3">
                        <div className="bg-[#0a0a0b] border border-zinc-850 p-2.5 rounded-lg text-zinc-400 group-hover:text-violet-400 group-hover:border-violet-500/20 group-hover:shadow-[0_0_15px_rgba(124,58,237,0.15)] transition-all">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-white block group-hover:text-violet-300 transition-colors leading-tight">
                            {chapter.title}
                          </span>
                          <span className="text-[10px] text-zinc-550 font-mono mt-1 block">
                            Eklenme: {new Date(chapter.createdAt).toLocaleDateString("tr-TR")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Rating details preview */}
                        {chapter.totalRatings > 0 && (
                          <div className="flex items-center gap-1 bg-[#0a0a0b] border border-zinc-850 px-2.5 py-1 rounded-md text-amber-400 font-mono text-[10px] mr-2 shadow-sm">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{(chapter.totalStars / chapter.totalRatings).toFixed(1)}</span>
                          </div>
                        )}
                        
                        <div className="text-zinc-550 group-hover:text-white transition-colors mr-2">
                          <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>

                    {/* Admin / Mod Controls for Chapter */}
                    {isStaff && (
                      <div className="flex items-center gap-2 ml-4 shrink-0 relative z-20 animate-fade-in">
                        <Link
                          href={`/admin/mangas/${id}/edit-chapter/${chapter._id}`}
                          className="bg-[#0a0a0b] hover:bg-[#121214] border border-zinc-850 hover:border-zinc-750 text-zinc-350 p-2 rounded-lg transition-all active:scale-95 shadow-sm"
                          title="Bölümü Düzenle"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={(e) => handleDeleteChapter(e, chapter._id)}
                          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 p-2 rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm"
                          title="Bölümü Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Yetkili Hata Bildirimleri Paneli */}
        {isStaff && reports.length > 0 && (
          <section className="w-full flex flex-col gap-6 pt-6 border-t border-zinc-900">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Aktif Hata Bildirimleri
              </h2>
              <p className="text-xs text-zinc-500 font-light mt-0.5">Okuyucular tarafından bildirilen son sorunlar.</p>
            </div>

            <div className="bg-[#161616] border border-zinc-800 rounded-md overflow-hidden">
              <div className="flex flex-col divide-y divide-zinc-850">
                {reports.map((report) => (
                  <div key={report._id} className="flex justify-between items-start p-4 gap-4">
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono bg-[#0a0a0a] border border-zinc-850 text-zinc-300 px-2.5 py-0.5 rounded font-bold">
                          {report.chapterId ? `Bölüm: ${report.chapterId.title}` : "Genel Manga"}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          Bildiren: {report.reportedBy}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-mono">
                          {new Date(report.createdAt).toLocaleDateString("tr-TR")} {new Date(report.createdAt).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 font-light leading-relaxed mt-1.5 whitespace-pre-wrap">
                        {report.message}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteReport(report._id)}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 hover:text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-all active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Çözüldü / Sil
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-10 text-center text-xs text-zinc-500 mt-20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>Nexora © {new Date().getFullYear()} • Vercel Style</span>
          <div className="flex gap-4 font-mono text-[10px]">
            <Link href="/" className="hover:text-zinc-350 cursor-pointer">Ana Sayfa</Link>
            <Link href="/mangalist" className="hover:text-zinc-350 cursor-pointer">Katalog</Link>
          </div>
        </div>
      </footer>

      {/* Hata Bildirme Modalı */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#161616] border border-zinc-800 rounded-xl p-6 sm:p-8 max-w-md w-full relative flex flex-col gap-5">
            <button
              onClick={() => setShowReportModal(false)}
              className="absolute top-4 right-4 text-zinc-550 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Hata Bildir
              </h3>
              <p className="text-xs text-zinc-400 font-light mt-1.5 font-sans">
                Karşılaştığınız görsel yüklenmeme, yanlış sayfa sırası veya çeviri hatası gibi sorunları bildirin.
              </p>
            </div>

            <form onSubmit={handleSubmitReport} className="flex flex-col gap-4 font-sans">
              <div>
                <label htmlFor="reportChapter" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                  İlgili Bölüm
                </label>
                <select
                  id="reportChapter"
                  value={reportChapterId}
                  onChange={(e) => setReportChapterId(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md px-3.5 py-2.5 text-xs outline-none transition-all text-white cursor-pointer"
                >
                  <option value="general">Manga Genel</option>
                  {chapters.map((ch) => (
                    <option key={ch._id} value={ch._id}>
                      {ch.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="reportMessage" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                  Açıklama <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="reportMessage"
                  required
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  placeholder="Sorunu açıklayın (Örn: 20. sayfa eksik)..."
                  rows={4}
                  className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md px-3.5 py-2.5 text-xs outline-none transition-all text-white placeholder-zinc-750 resize-none leading-relaxed"
                />
              </div>

              {reportError && (
                <div className="text-xs text-center py-2 px-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md font-mono">
                  {reportError}
                </div>
              )}

              {reportSuccess && (
                <div className="text-xs text-center py-2 px-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-mono">
                  Hata bildirimi başarıyla gönderildi!
                </div>
              )}

              <button
                type="submit"
                disabled={submittingReport || reportSuccess}
                className="bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-semibold py-2.5 rounded-md text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                {submittingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Gönder
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

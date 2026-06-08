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
  Star, Heart
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
  
  // Library Tracking States
  const [readingStatus, setReadingStatus] = useState<string>("Liste Dışı");
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [trackerLoading, setTrackerLoading] = useState<boolean>(false);

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
        <section className="w-full bg-[#161616] border border-zinc-800 rounded-lg p-6 sm:p-8 flex flex-col gap-8 relative overflow-hidden">
          {manga.coverImage && (
            <div 
              className="absolute inset-0 opacity-5 blur-[120px] pointer-events-none scale-150"
              style={{ backgroundImage: `url(${manga.coverImage})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
            />
          )}

          {/* Top row: Cover image and main details */}
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10 w-full">
            {/* Cover Art */}
            <div className="w-44 h-64 bg-[#0a0a0a] rounded-md border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 relative z-10">
              {manga.coverImage ? (
                <img src={manga.coverImage} alt={manga.title} className="w-full h-full object-cover" />
              ) : (
                <Disc className="w-10 h-10 text-zinc-800 animate-spin" />
              )}
            </div>

            {/* Details */}
            <div className="flex-1 flex flex-col justify-between py-1 min-w-0 self-stretch">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#0a0a0a] text-zinc-400 border border-zinc-800 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                      {manga.status}
                    </span>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#0a0a0a] border border-zinc-850 text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      {manga.releaseYear}
                    </span>
                  </div>

                  {/* Admin Controls */}
                  {(session?.user?.role === "admin" || session?.user?.role === "mod") && (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/add-manga?edit=${manga._id}`}
                        className="bg-[#0a0a0a] hover:bg-zinc-900 border border-zinc-800 text-zinc-350 p-2 rounded-md transition-all active:scale-95"
                        title="Manga Bilgilerini Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={handleDeleteManga}
                        disabled={deleting}
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 p-2 rounded-md transition-all active:scale-95 disabled:opacity-50"
                        title="Mangayı Sil"
                      >
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>

                <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight mb-2">
                  {manga.title}
                </h1>
                <p className="text-xs font-mono text-zinc-400 mb-4">
                  Yazar: {manga.author} {manga.artist ? ` / Çizer: ${manga.artist}` : ""}
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed font-light max-w-2xl mb-6">
                  {manga.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {manga.genres?.map((genre: string) => (
                    <span key={genre} className="text-[9px] font-mono px-2.5 py-0.5 rounded bg-[#0a0a0a] text-zinc-400 border border-zinc-800">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row: Ratings & Notifications & Tracking */}
          <div className="flex flex-col lg:flex-row gap-4 border-t border-zinc-800 pt-6 mt-2 relative z-10 w-full">
            <div className="flex-1 min-w-[200px]">
              <StarRating
                targetId={manga._id}
                targetType="manga"
                initialTotalStars={manga.totalStars || 0}
                initialTotalRatings={manga.totalRatings || 0}
              />
            </div>

            {/* Library Tracker */}
            <div className="flex items-center justify-between bg-[#0a0a0a]/80 border border-zinc-800 rounded-md p-3.5 gap-4 shrink-0 flex-1 lg:flex-initial min-w-[280px]">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-300">Kütüphane Takibi</span>
                <span className="text-[9px] text-zinc-550 font-light truncate">Okuma durumunu seçin</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleFavorite}
                  disabled={trackerLoading}
                  className={`p-2 rounded-md border transition-all cursor-pointer ${
                    isFavorite
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                      : "bg-[#161616] border-zinc-800 text-zinc-500 hover:text-zinc-350"
                  }`}
                  title={isFavorite ? "Favorilerden Çıkar" : "Favoriye Ekle"}
                >
                  <Star className={`w-4 h-4 ${isFavorite ? "fill-amber-400 text-amber-400 animate-pulse" : ""}`} />
                </button>

                <select
                  value={readingStatus}
                  disabled={trackerLoading}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="bg-[#161616] border border-zinc-800 text-zinc-350 px-3 py-2 rounded-md text-xs font-semibold outline-none cursor-pointer"
                >
                  <option value="Liste Dışı">Listeden Kaldır</option>
                  <option value="Okuyor">Okuyor</option>
                  <option value="Okuyacak">Okuyacak</option>
                  <option value="Okudu">Okudu</option>
                </select>
              </div>
            </div>

            {/* Discord Subscribe */}
            <div className="flex items-center justify-between bg-[#0a0a0a]/80 border border-zinc-800 rounded-md p-3.5 gap-4 shrink-0 flex-1 lg:flex-initial min-w-[280px]">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-300">Discord Bildirim</span>
                <span className="text-[9px] text-zinc-550 font-light truncate">Yeni bölüm pingi al</span>
              </div>
              <DiscordSubscribeButton mangaId={manga._id} />
            </div>
          </div>
        </section>

        {/* Chapters Section */}
        <section className="w-full flex flex-col gap-6 pt-6 border-t border-zinc-900">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Manga Bölümleri</h2>
              <p className="text-xs text-zinc-500 font-light mt-0.5">Yayınlanan tüm bölümler aşağıda sıralanmıştır.</p>
            </div>
            
            {/* Admin Add Chapter Button */}
            {(session?.user?.role === "admin" || session?.user?.role === "mod") && (
              <Link
                href={`/admin/mangas/${manga._id}/add-chapter`}
                className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold px-4 py-2 rounded-md transition-all flex items-center gap-1.5 active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4" />
                Yeni Bölüm Ekle
              </Link>
            )}
          </div>

          {chapters.length === 0 ? (
            <div className="bg-[#161616] border border-zinc-850 border-dashed rounded-md p-12 text-center text-zinc-500 text-xs w-full">
              <span className="font-semibold block mb-1 text-zinc-400">Bölüm Bulunamadı</span>
              Bu manga için henüz yüklenmiş bir bölüm bulunmuyor.
            </div>
          ) : (
            <div className="bg-[#161616] border border-zinc-800 rounded-md overflow-hidden">
              <div className="flex flex-col divide-y divide-zinc-850">
                {chapters.map((chapter, index) => (
                  <div 
                    key={chapter._id} 
                    className="flex justify-between items-center p-4 hover:bg-[#1c1c1c] transition-colors group relative"
                  >
                    <Link 
                      href={`/mangalist/${id}/chapters/${chapter._id}`}
                      className="flex-1 flex justify-between items-center min-w-0"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        <div className="bg-[#0a0a0a] border border-zinc-800 p-2 rounded-md text-zinc-400 group-hover:text-white transition-colors">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-white block group-hover:text-zinc-200 transition-colors">
                            {chapter.title}
                          </span>
                          <span className="text-[10px] text-zinc-555 font-mono mt-0.5 block">
                            Eklenme: {new Date(chapter.createdAt).toLocaleDateString("tr-TR")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Rating details preview */}
                        {chapter.totalRatings > 0 && (
                          <div className="flex items-center gap-1 bg-[#0a0a0a] border border-zinc-800 px-2 py-0.5 rounded text-amber-400 font-mono text-[9px] mr-2">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{(chapter.totalStars / chapter.totalRatings).toFixed(1)}</span>
                          </div>
                        )}
                        
                        <div className="text-zinc-400 group-hover:text-white transition-colors mr-2">
                          <ChevronRight className="w-4 h-4 transition-transform duration-250 group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </Link>

                    {/* Admin / Mod Controls for Chapter */}
                    {(session?.user?.role === "admin" || session?.user?.role === "mod") && (
                      <div className="flex items-center gap-2 ml-4 shrink-0 relative z-20">
                        <Link
                          href={`/admin/mangas/${id}/edit-chapter/${chapter._id}`}
                          className="bg-[#0a0a0a] hover:bg-zinc-900 border border-zinc-800 text-zinc-350 p-2 rounded-md transition-all active:scale-95"
                          title="Bölümü Düzenle"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={(e) => handleDeleteChapter(e, chapter._id)}
                          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 p-2 rounded-md transition-all active:scale-95 cursor-pointer"
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
    </div>
  );
}

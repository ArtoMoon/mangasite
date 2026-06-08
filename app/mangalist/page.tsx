"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import DiscordSubscribeButton from "@/components/DiscordSubscribeButton";
import Navbar from "@/components/Navbar";
import { BookOpen, ShieldCheck, Search, SlidersHorizontal, ChevronUp, User, Disc, Loader2, Edit, PlusCircle, BookOpenCheck, Trash2 } from "lucide-react";
import Link from "next/link";

const GENRES_LIST = [
  "Aksiyon", "Macera", "Fantezi", "Romantizm", "Dram", 
  "Komedi", "Webtoon", "Bilim Kurgu", "Gizem", "Korku", 
  "Doğaüstü", "Tarihi", "Yaşamdan Kesitler", "Okul"
];

export default function MangasPage() {
  const { data: session } = useSession();
  const [mangas, setMangas] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filtreleme ve Arama State'leri
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  // Scroll durumu
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const fetchMangas = async () => {
      try {
        const res = await fetch("/api/mangas");
        if (res.ok) {
          const data = await res.json();
          setMangas(data);
        }
      } catch (err) {
        console.error("Manga listesi yüklenemedi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMangas();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Sıralanmış ve Filtrelenmiş Mangalar
  const sortedAndFilteredMangas = [...mangas]
    .filter((manga) => {
      const matchesSearch = 
        manga.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manga.author?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGenre = selectedGenre === "" || manga.genres?.includes(selectedGenre);
      const matchesStatus = selectedStatus === "" || manga.status === selectedStatus;

      return matchesSearch && matchesGenre && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "views") {
        return (b.views || 0) - (a.views || 0);
      }
      if (sortBy === "chapters") {
        return (b.chapterCount || 0) - (a.chapterCount || 0);
      }
      if (sortBy === "alphabetical") {
        return a.title.localeCompare(b.title, "tr");
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

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

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col gap-10">
        
        {/* Banner Section */}
        <div className="flex justify-between items-center w-full flex-wrap gap-4">
          <div className="text-left">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-550">Nexora Catalog</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1">
              Tüm Türkçe Çeviriler
            </h1>
          </div>
          {(session?.user?.role === "admin" || session?.user?.role === "mod") && (
            <Link
              href="/admin/add-manga"
              className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold px-4 py-2.5 rounded-md transition-all flex items-center gap-1.5 active:scale-[0.98] shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              Yeni Manga Ekle
            </Link>
          )}
        </div>

        {/* Search & Filters Controls */}
        <div className="w-full flex flex-col gap-4 bg-[#161616] border border-zinc-850 p-4 rounded-md">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Manga veya yazar adı ile arayın..."
                className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md pl-10 pr-4 py-2.5 text-xs outline-none transition-all text-white placeholder-zinc-700"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 border rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                showFilters || selectedGenre !== "" || selectedStatus !== ""
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filtrele</span>
            </button>
          </div>

          {/* Collapsible Filters Bar */}
          {showFilters && (
            <div className="grid sm:grid-cols-3 gap-6 pt-4 border-t border-zinc-850 animate-fade-in">
              {/* Status */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-550 mb-2">
                  Yayın Durumu
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["", "Devam Ediyor", "Tamamlandı", "Ara Verildi"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setSelectedStatus(status)}
                      className={`px-3 py-1 rounded-md text-[10px] font-medium border transition-colors cursor-pointer ${
                        selectedStatus === status
                          ? "bg-white text-black border-white"
                          : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      {status === "" ? "Tümü" : status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genre */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-550 mb-2">
                  Kategori / Tür
                </label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => setSelectedGenre("")}
                    className={`px-2 py-1 rounded-md text-[10px] border transition-colors cursor-pointer ${
                      selectedGenre === ""
                        ? "bg-white text-black border-white"
                        : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    Tümü
                  </button>
                  {GENRES_LIST.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => setSelectedGenre(genre)}
                      className={`px-2 py-1 rounded-md text-[10px] border transition-colors cursor-pointer ${
                        selectedGenre === genre
                          ? "bg-white text-black border-white"
                          : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-550 mb-2">
                  Sıralama
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: "newest", label: "En Yeni" },
                    { value: "views", label: "En Çok Okunan" },
                    { value: "chapters", label: "En Çok Bölüm" },
                    { value: "alphabetical", label: "İsim (A-Z)" }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSortBy(option.value)}
                      className={`px-3 py-1 rounded-md text-[10px] font-medium border transition-colors cursor-pointer ${
                        sortBy === option.value
                          ? "bg-white text-black border-white"
                          : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Catalog Grid */}
        <div className="w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3 text-zinc-550">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
              <span className="text-xs font-mono">Veriler alınıyor...</span>
            </div>
          ) : sortedAndFilteredMangas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 border border-dashed border-zinc-850 rounded-md text-center max-w-md mx-auto w-full">
              <span className="text-zinc-300 font-semibold text-sm mb-2">Manga Bulunamadı</span>
              <p className="text-xs text-zinc-550 leading-relaxed mb-6">
                Arama ve filtreleme kriterlerinize uygun hiçbir sonuç bulunmuyor.
              </p>
              {(session?.user?.role === "admin" || session?.user?.role === "mod") && (
                <Link
                  href="/admin/add-manga"
                  className="bg-white hover:bg-zinc-200 text-black font-semibold px-4 py-2 rounded-md text-xs transition-colors"
                >
                  Manga Ekle
                </Link>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8 items-start">
              {sortedAndFilteredMangas.map((manga) => {
                const statusDot = 
                  manga.status === "Devam Ediyor" ? "bg-emerald-500" :
                  manga.status === "Tamamlandı" ? "bg-blue-500" :
                  "bg-amber-500";

                return (
                  <div 
                    key={manga._id} 
                    className="bg-[#161616] border border-zinc-855 rounded-md p-5 flex flex-col sm:flex-row gap-6 hover:border-zinc-700 transition-colors duration-200 relative group"
                  >
                    {/* Cover Frame */}
                    <div className="w-full sm:w-40 h-56 bg-[#0a0a0a] rounded-md border border-zinc-800 flex items-center justify-center relative overflow-hidden shrink-0">
                      {manga.coverImage && (manga.coverImage.startsWith("http") || manga.coverImage.startsWith("/") || manga.coverImage.startsWith("data:")) ? (
                        <img
                          src={manga.coverImage}
                          alt={manga.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-4">
                          <Disc className="w-8 h-8 text-zinc-800 animate-spin mb-2" />
                          <span className="text-[10px] font-mono text-zinc-650 uppercase tracking-widest leading-tight">
                            {manga.title}
                          </span>
                        </div>
                      )}

                      {/* Status indicator pill */}
                      <span className="absolute top-2.5 left-2.5 text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#0a0a0a]/80 text-zinc-400 border border-zinc-855 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                        {manga.status}
                      </span>
                    </div>

                    {/* Manga Info & Components */}
                    <div className="flex flex-col justify-between py-0.5 flex-1 min-w-0">
                      <div>
                        {/* Title */}
                        <div className="flex justify-between items-start gap-2">
                          <Link href={`/mangalist/${manga._id}`} className="hover:underline min-w-0 flex-1">
                            <h2 className="text-xl font-bold text-white mb-1 leading-tight tracking-tight truncate">
                              {manga.title}
                            </h2>
                          </Link>
                          {(session?.user?.role === "admin" || session?.user?.role === "mod") && (
                            <div className="flex items-center gap-1.5 shrink-0 relative z-20">
                              <Link
                                href={`/admin/add-manga?edit=${manga._id}`}
                                className="bg-[#0a0a0a] hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white p-1 rounded transition-colors"
                                title="Düzenle"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                onClick={() => handleDeleteManga(manga._id)}
                                className="bg-[#0a0a0a] hover:bg-red-950 border border-zinc-800 hover:border-red-900 text-zinc-400 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                                title="Manga Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Author & Stats */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-zinc-400 mb-2.5">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-zinc-500" />
                            {manga.author} {manga.artist ? ` / ${manga.artist}` : ""}
                          </span>
                          <span className="text-zinc-800 font-mono select-none">|</span>
                          <span className="flex items-center gap-1 text-zinc-300">
                            <BookOpen className="w-3 h-3 text-zinc-500" />
                            {manga.chapterCount || 0} Bölüm
                          </span>
                          {manga.views !== undefined && (
                            <>
                              <span className="text-zinc-800 font-mono select-none">|</span>
                              <span className="flex items-center gap-1 text-zinc-350" title="Okunma Sayısı">
                                <span className="text-zinc-500 font-sans">👁</span> {manga.views} Okunma
                              </span>
                            </>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3 mb-4 font-light">
                          {manga.description}
                        </p>

                        {/* Genres */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {manga.genres?.map((genre: string) => (
                            <span 
                              key={genre} 
                              className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#0a0a0a] text-zinc-400 border border-zinc-800"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3 border-t border-zinc-800 pt-3.5 mt-4">
                        {/* Oku Butonu */}
                        <Link
                          href={`/mangalist/${manga._id}`}
                          className="w-full bg-white hover:bg-zinc-200 text-black text-xs font-semibold py-2.5 rounded-md transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                          <BookOpenCheck className="w-4 h-4" />
                          Oku
                        </Link>
                        
                        {/* Subscribe Button */}
                        <div className="flex items-center justify-between bg-[#0a0a0a]/50 border border-zinc-855 rounded-md p-2.5">
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold text-zinc-350">Discord Bildirimi</span>
                            <span className="text-[9px] text-zinc-550 font-light truncate">Yeni bölümde rol al.</span>
                          </div>
                          <DiscordSubscribeButton mangaId={manga._id} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Back to top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-2.5 bg-[#161616] hover:bg-zinc-850 text-white border border-zinc-800 rounded-md cursor-pointer active:scale-95 z-50 animate-fade-in"
          aria-label="Yukarı Çık"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-10 text-center text-xs text-zinc-550">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>Nexora © {new Date().getFullYear()} • Vercel Style</span>
          <div className="flex gap-4 font-mono text-[10px]">
            <span className="hover:text-zinc-350 cursor-pointer">Terms</span>
            <span className="hover:text-zinc-350 cursor-pointer">Privacy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

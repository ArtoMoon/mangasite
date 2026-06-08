"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StarRating from "@/components/StarRating";
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Loader2, BookOpen, AlertCircle
} from "lucide-react";
import Link from "next/link";

interface ChapterReaderPageProps {
  params: Promise<{ id: string; chapterId: string }>;
}

export default function ChapterReaderPage(props: ChapterReaderPageProps) {
  const params = use(props.params);
  const { id, chapterId } = params;

  const { data: session } = useSession();
  const router = useRouter();

  const [manga, setManga] = useState<any>(null);
  const [chapter, setChapter] = useState<any>(null);
  const [chaptersList, setChaptersList] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Manga detayını çek
        const mangaRes = await fetch(`/api/mangas/${id}`);
        if (!mangaRes.ok) throw new Error("Manga detayları yüklenemedi.");
        const mangaData = await mangaRes.json();
        setManga(mangaData);

        // Bölüm verisini çek
        const chapterRes = await fetch(`/api/chapters/${chapterId}`);
        if (!chapterRes.ok) throw new Error("Bölüm verileri yüklenemedi.");
        const chapterData = await chapterRes.json();
        setChapter(chapterData);

        // Banner ayarlarını çek
        try {
          const settingsRes = await fetch("/api/settings");
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            setSettings(settingsData);
          }
        } catch (err) {
          console.error("Bannerlar yüklenirken hata oluştu:", err);
        }

        // Bölüm okundu kaydı tetikle
        if (session) {
          fetch("/api/profile/read-chapter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chapterId }),
          }).catch((err) => console.error("Okuma kaydı ve XP hatası:", err));
        }

        // Bölüm listesini çek (Önceki/Sonraki navigasyonu için)
        const chaptersListRes = await fetch(`/api/mangas/${id}/chapters`);
        if (chaptersListRes.ok) {
          const listData = await chaptersListRes.json();
          setChaptersList(listData);
        }
      } catch (err: any) {
        setError(err.message || "Bölüm yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, chapterId, session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <span className="text-xs font-mono text-zinc-550">Bölüm yükleniyor...</span>
      </div>
    );
  }

  if (error || !chapter || !manga) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col font-sans">
        <header className="border-b border-zinc-900 bg-[#0a0a0a]/80 py-4">
          <div className="max-w-6xl mx-auto px-6">
            <Link href={`/mangalist/${id}`} className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-semibold uppercase">
              <ArrowLeft className="w-3.5 h-3.5" /> Mangaya Dön
            </Link>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="bg-[#161616] border border-zinc-800 p-8 rounded-md max-w-sm w-full">
            <AlertCircle className="w-8 h-8 text-red-500 mb-3 mx-auto" />
            <h1 className="text-lg font-bold text-white mb-2">Hata Oluştu</h1>
            <p className="text-xs text-zinc-450 mb-6 font-light">{error || "Bölüm bulunamadı."}</p>
            <Link href={`/mangalist/${id}`} className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold px-4 py-2.5 rounded-md transition-all">
              Mangaya Dön
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Önceki/Sonraki bölüm hesaplama
  const currentIndex = chaptersList.findIndex((ch) => ch._id === chapterId);
  const prevChapter = currentIndex > 0 ? chaptersList[currentIndex - 1] : null;
  const nextChapter = currentIndex !== -1 && currentIndex < chaptersList.length - 1 ? chaptersList[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-200 flex flex-col font-sans antialiased selection:bg-white selection:text-black animate-fade-in">
      
      {/* Sticky Top Reader Navigation Bar */}
      <header className="border-b border-zinc-900 bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link 
            href={`/mangalist/${id}`} 
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-semibold uppercase transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Mangaya Dön</span>
          </Link>
          
          <div className="flex flex-col items-center min-w-0 px-2 text-center">
            <span className="text-[10px] text-zinc-550 font-mono uppercase tracking-widest truncate max-w-xs">{manga.title}</span>
            <span className="text-xs font-bold text-white truncate max-w-xs mt-0.5">{chapter.title}</span>
          </div>

          <div className="flex items-center gap-2">
            {prevChapter ? (
              <Link 
                href={`/mangalist/${id}/chapters/${prevChapter._id}`}
                className="bg-[#161616] hover:bg-zinc-800 text-zinc-350 border border-zinc-850 p-1.5 rounded-md transition-all active:scale-95"
                title="Önceki Bölüm"
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
            ) : (
              <button disabled className="opacity-30 bg-[#161616] text-zinc-650 border border-zinc-850 p-1.5 rounded-md cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {nextChapter ? (
              <Link 
                href={`/mangalist/${id}/chapters/${nextChapter._id}`}
                className="bg-[#161616] hover:bg-zinc-800 text-zinc-350 border border-zinc-850 p-1.5 rounded-md transition-all active:scale-95"
                title="Sonraki Bölüm"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <button disabled className="opacity-30 bg-[#161616] text-zinc-650 border border-zinc-850 p-1.5 rounded-md cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Pages View Area (Stacked Images) */}
      <main className="flex-1 w-full max-w-3xl mx-auto flex flex-col items-center bg-black">
        {/* Üst Banner */}
        {settings?.topBannerUrl && (
          <div className="w-full flex justify-center bg-black">
            {settings.topBannerLink ? (
              <a href={settings.topBannerLink} target="_blank" rel="noopener noreferrer" className="w-full block hover:opacity-90 transition-opacity">
                <img src={settings.topBannerUrl} alt="Top Banner" className="w-full h-auto object-contain" />
              </a>
            ) : (
              <img src={settings.topBannerUrl} alt="Top Banner" className="w-full h-auto object-contain" />
            )}
          </div>
        )}

        {chapter.pages && chapter.pages.length > 0 ? (
          chapter.pages.map((page: string, idx: number) => (
            <img 
              key={idx} 
              src={page} 
              alt={`Sayfa ${idx + 1}`} 
              className="w-full h-auto object-contain select-none"
              loading={idx < 2 ? "eager" : "lazy"} // Eager load first two pages for speed
            />
          ))
        ) : (
          <div className="py-20 text-zinc-600 text-xs font-mono text-center">
            Bu bölümde yüklü sayfa bulunmuyor.
          </div>
        )}

        {/* Alt Banner */}
        {settings?.bottomBannerUrl && (
          <div className="w-full flex justify-center bg-black">
            {settings.bottomBannerLink ? (
              <a href={settings.bottomBannerLink} target="_blank" rel="noopener noreferrer" className="w-full block hover:opacity-90 transition-opacity">
                <img src={settings.bottomBannerUrl} alt="Bottom Banner" className="w-full h-auto object-contain" />
              </a>
            ) : (
              <img src={settings.bottomBannerUrl} alt="Bottom Banner" className="w-full h-auto object-contain" />
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation & Star Rating */}
      <section className="w-full max-w-xl mx-auto px-6 py-12 flex flex-col gap-10 items-center border-t border-zinc-900 mt-6">
        
        {/* Rate Chapter */}
        <div className="w-full">
          <StarRating 
            targetId={chapterId} 
            targetType="chapter" 
            initialTotalStars={chapter.totalStars || 0} 
            initialTotalRatings={chapter.totalRatings || 0} 
          />
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex justify-between items-center w-full gap-4">
          {prevChapter ? (
            <Link 
              href={`/mangalist/${id}/chapters/${prevChapter._id}`}
              className="flex-1 bg-[#161616] hover:bg-zinc-850 text-zinc-200 border border-zinc-800 px-4 py-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1 active:scale-[0.98]"
            >
              <ChevronLeft className="w-4 h-4" />
              Önceki Bölüm
            </Link>
          ) : (
            <div className="flex-1 bg-[#161616]/20 border border-zinc-855/40 text-zinc-600 px-4 py-3 rounded-md text-xs font-semibold text-center select-none cursor-not-allowed">
              İlk Bölümdesiniz
            </div>
          )}

          {nextChapter ? (
            <Link 
              href={`/mangalist/${id}/chapters/${nextChapter._id}`}
              className="flex-1 bg-white hover:bg-zinc-200 text-black px-4 py-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1 active:scale-[0.98]"
            >
              Sonraki Bölüm
              <ChevronRight className="w-4 h-4 text-black" />
            </Link>
          ) : (
            <Link 
              href={`/mangalist/${id}`}
              className="flex-1 bg-[#161616] hover:bg-zinc-850 text-zinc-200 border border-zinc-800 px-4 py-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1 active:scale-[0.98]"
            >
              Tüm Bölümler
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-10 text-center text-xs text-zinc-550">
        <span>Nexora © {new Date().getFullYear()} • Vercel Style Reader</span>
      </footer>
    </div>
  );
}

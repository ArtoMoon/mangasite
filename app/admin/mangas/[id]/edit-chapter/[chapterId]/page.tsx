"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Loader2, UploadCloud, Trash2, Save, FileText, CheckCircle2, AlertCircle
} from "lucide-react";
import Link from "next/link";

interface EditChapterPageProps {
  params: Promise<{ id: string; chapterId: string }>;
}

export default function EditChapterPage(props: EditChapterPageProps) {
  const params = use(props.params);
  const { id, chapterId } = params;

  const { data: session, status } = useSession();
  const router = useRouter();

  const [manga, setManga] = useState<any>(null);
  const [title, setTitle] = useState<string>("");
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [processingFiles, setProcessingFiles] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Verileri yükle ve yetki kontrolü
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (session && session.user?.role !== "admin" && session.user?.role !== "mod") {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      try {
        // Manga bilgilerini çek
        const mangaRes = await fetch(`/api/mangas/${id}`);
        if (mangaRes.ok) {
          const mangaData = await mangaRes.json();
          setManga(mangaData);
        } else {
          setMessage({ text: "Manga bilgisi yüklenemedi.", isError: true });
        }

        // Bölüm bilgilerini çek
        const chapterRes = await fetch(`/api/chapters/${chapterId}`);
        if (chapterRes.ok) {
          const chapterData = await chapterRes.json();
          setTitle(chapterData.title || "");
          setPages(chapterData.pages || []);
        } else {
          setMessage({ text: "Bölüm bilgisi yüklenemedi.", isError: true });
        }
      } catch (err) {
        console.error("Başlangıç verileri yüklenirken hata:", err);
        setMessage({ text: "Veriler yüklenirken hata oluştu.", isError: true });
      } finally {
        setLoadingInitial(false);
      }
    };

    if (session) {
      fetchData();
    }
  }, [id, chapterId, session, status, router]);

  // Görsel yükleme ve Base64'e dönüştürme
  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setProcessingFiles(true);
    setMessage(null);

    const base64Promises = Array.from(files).map((file) => {
      return new Promise<string>((resolve, reject) => {
        if (file.size > 2.5 * 1024 * 1024) {
          reject(new Error(`${file.name} boyutu 2.5MB'tan büyüktür.`));
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(`${file.name} okunamadı.`));
        reader.readAsDataURL(file);
      });
    });

    try {
      const results = await Promise.all(base64Promises);
      setPages((prev) => [...prev, ...results]);
    } catch (err: any) {
      setMessage({ text: err.message || "Görseller yüklenirken hata oluştu.", isError: true });
    } finally {
      setProcessingFiles(false);
    }
  };

  const handleRemovePage = (indexToRemove: number) => {
    setPages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleClearAll = () => {
    setPages([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (pages.length === 0) {
      setMessage({ text: "Lütfen en az bir adet sayfa resmi ekleyin.", isError: true });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/chapters/${chapterId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          pages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Bölüm güncellenirken bir hata oluştu.");
      }

      setMessage({ text: "Bölüm başarıyla güncellendi!", isError: false });
      
      setTimeout(() => {
        router.push(`/mangalist/${id}`);
      }, 1500);
    } catch (err: any) {
      setMessage({ text: err.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  if (loadingInitial || status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <span className="text-xs font-mono text-zinc-550">Bölüm bilgileri yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col font-sans relative overflow-hidden">
      {/* Vercel Font Import */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-zinc-900 bg-[#0a0a0a]/85 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href={`/mangalist/${id}`} className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-all text-xs font-semibold uppercase tracking-wider">
              <ArrowLeft className="w-3.5 h-3.5" />
              Mangaya Dön
            </Link>
          </div>
          <div className="bg-zinc-900 text-zinc-350 px-3.5 py-1.5 rounded-md text-xs font-semibold border border-zinc-800 font-mono">
            Bölüm Düzenle
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full relative z-10 animate-fade-in">
        <div className="w-full bg-[#161616] border border-zinc-800 p-8 sm:p-10 rounded-md">
          
          {/* Header Title */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8 border-b border-zinc-800 pb-6">
            <div className="flex items-center gap-4">
              <div className="bg-[#0a0a0a] border border-zinc-800 p-3 rounded-md text-white">
                <FileText className="w-5 h-5 text-zinc-350" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  Bölümü Düzenle
                </h1>
                <p className="text-xs text-zinc-400 font-light mt-1.5">
                  {manga ? `"${manga.title}"` : "Manga"} serisinin bölüm başlığını ve sayfalarını güncelleyin.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Chapter Title */}
            <div>
              <label htmlFor="chapterTitle" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Bölüm Başlığı / Numarası <span className="text-red-500">*</span>
              </label>
              <input
                id="chapterTitle"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Bölüm 15 veya Bölüm 1: Uyanış"
                className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md px-4 py-3 text-xs outline-none transition-all text-white placeholder-zinc-700 font-semibold"
              />
            </div>

            {/* Pages Multi-file Upload zone */}
            <div className="flex flex-col gap-2">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                Görsel Ekle (Listenin Sonuna Eklenir)
              </label>
              
              <div className="relative group/upload w-full py-10 bg-[#0a0a0a] rounded-md border border-zinc-800 hover:border-zinc-700 transition-all duration-200 flex flex-col items-center justify-center overflow-hidden">
                <label className="flex flex-col items-center justify-center p-6 text-center cursor-pointer w-full h-full">
                  {processingFiles ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                  ) : (
                    <UploadCloud className="w-8 h-8 text-zinc-650 mb-2" />
                  )}
                  <span className="text-xs font-semibold text-zinc-300">
                    {processingFiles ? "Dosyalar İşleniyor..." : "Dosyaları Seçin veya Sürükleyin"}
                  </span>
                  <span className="text-[10px] text-zinc-550 mt-1 font-mono">PNG, JPG (Maks. 2.5MB sayfa başına) • Çoklu seçim yapabilirsiniz</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={processingFiles}
                    onChange={handleFilesChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Page Previews Grid */}
            {pages.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-450">Yüklenen Sayfalar ({pages.length})</span>
                  <button 
                    type="button" 
                    onClick={handleClearAll}
                    className="text-[10px] font-semibold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider"
                  >
                    Tümünü Temizle
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {pages.map((page, idx) => (
                    <div 
                      key={idx} 
                      className="relative group/preview border border-zinc-850 bg-[#0a0a0a] rounded-md overflow-hidden aspect-[3/4] flex flex-col justify-end"
                    >
                      <img src={page} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover/preview:opacity-50 transition-opacity" />
                      
                      {/* Delete Overlay */}
                      <button
                        type="button"
                        onClick={() => handleRemovePage(idx)}
                        className="absolute top-2 right-2 bg-red-500/10 border border-red-500/20 text-red-400 p-1.5 rounded-md opacity-0 group-hover/preview:opacity-100 transition-opacity cursor-pointer"
                        title="Sayfayı Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Page Index Badge */}
                      <span className="relative z-10 m-2 text-[9px] font-mono bg-black/80 px-2 py-0.5 rounded border border-zinc-800 text-zinc-400 w-fit">
                        Sayfa {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Messages */}
            {message && (
              <div
                className={`text-xs text-center py-2.5 px-4 rounded-md font-medium transition-all duration-150 border flex items-center justify-center gap-2 ${
                  message.isError
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}
              >
                {message.isError ? <AlertCircle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || processingFiles || pages.length === 0}
              className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-3.5 rounded-md text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Değişiklikler Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-black" />
                  Değişiklikleri Kaydet
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, PlusCircle, Sparkles, UploadCloud, Trash2, Calendar, User, UserPlus, Search } from "lucide-react";
import Link from "next/link";

const GENRES_LIST = [
  "Aksiyon", "Macera", "Fantezi", "Romantizm", "Dram", 
  "Komedi", "Webtoon", "Bilim Kurgu", "Gizem", "Korku", 
  "Doğaüstü", "Tarihi", "Yaşamdan Kesitler", "Okul"
];

function AddMangaForm() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState<string>("");
  const [bannerImage, setBannerImage] = useState<string>("");
  const [author, setAuthor] = useState("");
  const [artist, setArtist] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("Devam Ediyor");
  const [releaseYear, setReleaseYear] = useState<string>(new Date().getFullYear().toString());
  const [discordRoleId, setDiscordRoleId] = useState("");
  const [scheduleDay, setScheduleDay] = useState<string>("Belirsiz");

  // Jikan Arama ve Otomatik Doldurma State'leri
  const [apiSearchQuery, setApiSearchQuery] = useState("");
  const [apiSearchResults, setApiSearchResults] = useState<any[]>([]);
  const [searchingApi, setSearchingApi] = useState(false);
  const [fetchingDetailsId, setFetchingDetailsId] = useState<string | null>(null);

  // Durum Yönetimi
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Düzenleme modunda manga detaylarını çek
  useEffect(() => {
    if (editId) {
      const fetchMangaDetails = async () => {
        try {
          const res = await fetch(`/api/mangas/${editId}`);
          if (res.ok) {
            const data = await res.json();
            setTitle(data.title || "");
            setDescription(data.description || "");
            setCoverImage(data.coverImage || "");
            setBannerImage(data.bannerImage || "");
            setAuthor(data.author || "");
            setArtist(data.artist || "");
            setGenres(data.genres || []);
            setStatus(data.status || "Devam Ediyor");
            setReleaseYear(data.releaseYear?.toString() || new Date().getFullYear().toString());
            setDiscordRoleId(data.discordRoleId || "");
            setScheduleDay(data.scheduleDay || "Belirsiz");
          } else {
            setMessage({ text: "Manga detayları veritabanından çekilemedi.", isError: true });
          }
        } catch (err) {
          console.error("Düzenleme verisi çekilirken hata:", err);
          setMessage({ text: "Manga bilgileri yüklenirken hata oluştu.", isError: true });
        }
      };
      fetchMangaDetails();
    }
  }, [editId]);

  // Dosya Yükleme & Base64 Dönüşümü
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "cover" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      setMessage({ text: "Görsel boyutu 2.5MB'tan küçük olmalıdır.", isError: true });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (type === "cover") {
        setCoverImage(base64String);
      } else {
        setBannerImage(base64String);
      }
      setMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // API Arama İşlemi
  const handleApiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiSearchQuery.trim()) return;

    setSearchingApi(true);
    setApiSearchResults([]);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/manga-search?q=${encodeURIComponent(apiSearchQuery)}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Arama işlemi başarısız oldu.");
      }
      const data = await res.json();
      setApiSearchResults(data);
      if (data.length === 0) {
        setMessage({ text: "MyAnimeList üzerinde bu arama için sonuç bulunamadı.", isError: true });
      }
    } catch (err: any) {
      setMessage({ text: err.message, isError: true });
    } finally {
      setSearchingApi(false);
    }
  };

  // Seçilen Manga Detaylarını Çekme & Formu Doldurma
  const handleSelectMangaFromApi = async (malId: string) => {
    setFetchingDetailsId(malId);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/manga-details?malId=${malId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Manga detayları API'den alınamadı.");
      }
      const data = await res.json();

      // Formu veritabanından gelen verilerle otomatik doldur
      setTitle(data.title || "");
      setDescription(data.description || "");
      setAuthor(data.author || "");
      setGenres(data.genres || []);
      setStatus(data.status || "Devam Ediyor");
      setReleaseYear(data.releaseYear?.toString() || new Date().getFullYear().toString());
      setCoverImage(data.coverImage || ""); // Base64 görsel

      setApiSearchResults([]);
      setApiSearchQuery("");
      setMessage({ text: "Manga bilgileri ve kapak görseli MyAnimeList üzerinden başarıyla çekildi!", isError: false });
    } catch (err: any) {
      setMessage({ text: err.message, isError: true });
    } finally {
      setFetchingDetailsId(null);
    }
  };

  // Tür Seçim Yönetimi
  const handleGenreToggle = (genre: string) => {
    if (genres.includes(genre)) {
      setGenres(genres.filter((g) => g !== genre));
    } else {
      setGenres([...genres, genre]);
    }
  };

  // Form Gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!coverImage) {
      setMessage({ text: "Lütfen bir kapak görseli yükleyin veya API ile otomatik çekin.", isError: true });
      setLoading(false);
      return;
    }

    if (genres.length === 0) {
      setMessage({ text: "Lütfen en az bir tür seçin.", isError: true });
      setLoading(false);
      return;
    }

    try {
      const url = editId ? `/api/mangas/${editId}` : "/api/mangas";
      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          coverImage,
          bannerImage: bannerImage || undefined,
          author,
          artist,
          genres,
          status,
          releaseYear: Number(releaseYear),
          discordRoleId,
          scheduleDay,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Manga kaydedilirken hata oluştu.");
      }

      setMessage({ 
        text: editId ? "Manga başarıyla güncellendi!" : "Manga başarıyla veritabanına ve kataloğa eklendi! Yönlendiriliyorsunuz...", 
        isError: false 
      });
      
      setTimeout(() => {
        router.push("/mangalist");
      }, 1500);
    } catch (error: any) {
      setMessage({ text: error.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <span className="text-xs font-mono text-zinc-550">Yükleniyor...</span>
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
            <Link href="/mangalist" className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-all text-xs font-semibold uppercase tracking-wider">
              <ArrowLeft className="w-3.5 h-3.5" />
              Katalog
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 text-zinc-350 px-3.5 py-1.5 rounded-md text-xs font-semibold border border-zinc-800 font-mono">
              Yönetici Paneli
            </div>
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
                <PlusCircle className="w-5 h-5 text-zinc-350" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  {editId ? "Mangayı Düzenle" : "Yeni Manga Yayınla"} {editId ? "" : <Sparkles className="w-4 h-4 text-amber-500" />}
                </h1>
                <p className="text-xs text-zinc-400 font-light mt-1.5">
                  {editId ? "Manga bilgilerini güncelleyin." : "Bilgileri doldurun veya MyAnimeList API'sini kullanarak otomatik doldurun."}
                </p>
              </div>
            </div>
          </div>

          {/* MAL API Automation Section (Sadece Yeni Manga Ekleme Modunda) */}
          {!editId && (
            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-md p-6 mb-8">
              <h3 className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                MyAnimeList API ile Otomatik Doldur
              </h3>
              <form onSubmit={handleApiSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-550 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={apiSearchQuery}
                    onChange={(e) => setApiSearchQuery(e.target.value)}
                    placeholder="Manga ismini girin (Örn: Solo Leveling)..."
                    className="w-full bg-[#161616] border border-zinc-800 focus:border-zinc-600 rounded-md pl-10 pr-4 py-2.5 text-xs outline-none transition-all text-white placeholder-zinc-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searchingApi || !apiSearchQuery.trim()}
                  className="bg-white hover:bg-zinc-200 text-black font-semibold px-6 py-2.5 rounded-md text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {searchingApi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Ara
                </button>
              </form>

              {/* API Arama Sonuçları */}
              {apiSearchResults.length > 0 && (
                <div className="mt-4 space-y-2 max-h-52 overflow-y-auto pr-1">
                  {apiSearchResults.map((result, index) => (
                    <div 
                      key={`${result.mal_id}-${index}`} 
                      className="flex justify-between items-center bg-[#161616] border border-zinc-800 p-3 rounded-md hover:border-zinc-700 transition-all text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        {result.images?.jpg?.small_image_url && (
                          <img src={result.images.jpg.small_image_url} alt="" className="w-8 h-10 object-cover rounded-md border border-zinc-800" />
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-white block truncate">{result.title}</span>
                          <span className="text-[10px] text-zinc-550 truncate block mt-0.5 font-mono">
                            {result.authors?.map((a: any) => a.name).join(", ")} • {result.published?.from ? new Date(result.published.from).getFullYear() : "N/A"}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={fetchingDetailsId !== null}
                        onClick={() => handleSelectMangaFromApi(result.mal_id)}
                        className="bg-[#0a0a0a] hover:bg-[#111111] text-zinc-200 border border-zinc-800 px-3 py-1.5 rounded-md font-semibold text-[10px] uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        {fetchingDetailsId === result.mal_id.toString() ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : null}
                        Seç ve Doldur
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Visual File Uploader Section */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Cover Image Upload */}
              <div className="flex flex-col gap-2">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Kapak Görseli <span className="text-red-500">*</span>
                </label>
                <div className="relative group/upload w-full h-60 bg-[#0a0a0a] rounded-md border border-zinc-800 hover:border-zinc-700 transition-all duration-200 flex flex-col items-center justify-center overflow-hidden">
                  {coverImage ? (
                    <>
                      <img src={coverImage} alt="Kapak Önizleme" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover/upload:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setCoverImage("")}
                          className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 p-2.5 rounded-md transition-all cursor-pointer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 text-center cursor-pointer w-full h-full">
                      <UploadCloud className="w-8 h-8 text-zinc-650 mb-2" />
                      <span className="text-xs font-semibold text-zinc-300">Görsel Seç veya Sürükle</span>
                      <span className="text-[10px] text-zinc-555 mt-1 font-mono">PNG, JPG (Maks. 2.5MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "cover")}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Banner Image Upload */}
              <div className="flex flex-col gap-2">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Afiş / Arka Plan Görseli
                </label>
                <div className="relative group/upload w-full h-60 bg-[#0a0a0a] rounded-md border border-zinc-800 hover:border-zinc-700 transition-all duration-200 flex flex-col items-center justify-center overflow-hidden">
                  {bannerImage ? (
                    <>
                      <img src={bannerImage} alt="Afiş Önizleme" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover/upload:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setBannerImage("")}
                          className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 p-2.5 rounded-md transition-all cursor-pointer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 text-center cursor-pointer w-full h-full">
                      <UploadCloud className="w-8 h-8 text-zinc-650 mb-2" />
                      <span className="text-xs font-semibold text-zinc-300">Görsel Seç veya Sürükle</span>
                      <span className="text-[10px] text-zinc-555 mt-1 font-mono">PNG, JPG (Maks. 2.5MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "banner")}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* General Fields */}
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <label htmlFor="title" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                  Manga Başlığı <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Solo Leveling"
                  className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md px-4 py-3 text-xs outline-none transition-all text-white placeholder-zinc-750 font-semibold"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                  Manga Durumu
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md px-4 py-3 text-xs outline-none transition-all text-white cursor-pointer"
                >
                  <option value="Devam Ediyor" className="bg-[#0a0a0a] text-white">Devam Ediyor</option>
                  <option value="Tamamlandı" className="bg-[#0a0a0a] text-white">Tamamlandı</option>
                  <option value="Ara Verildi" className="bg-[#0a0a0a] text-white">Ara Verildi</option>
                </select>
              </div>

              <div>
                <label htmlFor="scheduleDay" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                  Yayın Günü (Takvim)
                </label>
                <select
                  id="scheduleDay"
                  value={scheduleDay}
                  onChange={(e) => setScheduleDay(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md px-4 py-3 text-xs outline-none transition-all text-white cursor-pointer"
                >
                  <option value="Belirsiz" className="bg-[#0a0a0a] text-white">Belirsiz</option>
                  <option value="Pazartesi" className="bg-[#0a0a0a] text-white">Pazartesi</option>
                  <option value="Salı" className="bg-[#0a0a0a] text-white">Salı</option>
                  <option value="Çarşamba" className="bg-[#0a0a0a] text-white">Çarşamba</option>
                  <option value="Perşembe" className="bg-[#0a0a0a] text-white">Perşembe</option>
                  <option value="Cuma" className="bg-[#0a0a0a] text-white">Cuma</option>
                  <option value="Cumartesi" className="bg-[#0a0a0a] text-white">Cumartesi</option>
                  <option value="Pazar" className="bg-[#0a0a0a] text-white">Pazar</option>
                </select>
              </div>
            </div>

            {/* Creators / Date */}
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <label htmlFor="author" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-550" />
                  Yazar <span className="text-red-500">*</span>
                </label>
                <input
                  id="author"
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Örn: Chugong"
                  className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md px-4 py-3 text-xs outline-none transition-all text-white placeholder-zinc-750"
                />
              </div>

              <div>
                <label htmlFor="artist" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-zinc-550" />
                  Çizer (Sanatçı)
                </label>
                <input
                  id="artist"
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Örn: DUBU (REDICE STUDIO)"
                  className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md px-4 py-3 text-xs outline-none transition-all text-white placeholder-zinc-750"
                />
              </div>

              <div>
                <label htmlFor="releaseYear" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-550" />
                  Yayın Yılı <span className="text-red-500">*</span>
                </label>
                <input
                  id="releaseYear"
                  type="number"
                  required
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(e.target.value)}
                  placeholder="Örn: 2018"
                  className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md px-4 py-3 text-xs outline-none transition-all text-white placeholder-zinc-750"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Konusu / Açıklama <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Manganın konusunu detaylıca girin..."
                rows={5}
                className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md px-4 py-3 text-xs outline-none transition-all text-white placeholder-zinc-750 resize-none leading-relaxed"
              />
            </div>

            {/* Genres Multiselect */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-3">
                Manga Türleri (En az bir adet seçin) <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {GENRES_LIST.map((genre) => {
                  const isSelected = genres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => handleGenreToggle(genre)}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all duration-150 border cursor-pointer ${
                        isSelected
                          ? "bg-white text-black border-white"
                          : "bg-[#0a0a0a] text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discord Role Integration */}
            <div>
              <label htmlFor="discordRoleId" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Discord Rol ID (Bu Mangaya Özel Bildirim Rolü - İsteğe Bağlı)
              </label>
              <input
                id="discordRoleId"
                type="text"
                value={discordRoleId}
                onChange={(e) => setDiscordRoleId(e.target.value)}
                placeholder="Örn: 1513349244579479713"
                className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-700 rounded-md px-4 py-3 text-xs outline-none transition-all text-white placeholder-zinc-750 font-mono"
              />
            </div>

            {/* Status Messages */}
            {message && (
              <div
                className={`text-xs text-center py-2.5 px-4 rounded-md font-medium transition-all duration-150 border ${
                  message.isError
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-3.5 rounded-md text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {editId ? "Manga Güncelleniyor..." : "Manga Kaydediliyor..."}
                </>
              ) : (
                <>
                  {editId ? "Manga Güncellemesini Kaydet" : "Yayına Al ve Kaydet"}
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function AddMangaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <span className="text-xs font-mono text-zinc-550">Yükleniyor...</span>
      </div>
    }>
      <AddMangaForm />
    </Suspense>
  );
}

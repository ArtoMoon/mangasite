"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import StarRating from "@/components/StarRating";
import DiscordSubscribeButton from "@/components/DiscordSubscribeButton";
import Navbar from "@/components/Navbar";
import {
  BookOpen, ShieldCheck, ChevronUp, User, Disc,
  Loader2, Bell, Zap, Star, Activity, ArrowRight, Sparkles, Edit, Trash2
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();
  const [mangas, setMangas] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
      } catch (error) {
        console.error("Mangalar yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMangas();

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // En yüksek puanlı mangayı öne çıkar
  const featuredManga = mangas.length > 0
    ? [...mangas].sort((a, b) => {
      const aAvg = a.totalRatings > 0 ? (a.totalStars / a.totalRatings) : 0;
      const bAvg = b.totalRatings > 0 ? (b.totalStars / b.totalRatings) : 0;
      return bAvg - aAvg;
    })[0]
    : null;

  // Son eklenen 4 mangayı al
  const latestMangas = mangas.slice(-4).reverse();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col font-sans antialiased selection:bg-white selection:text-black">
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
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 flex flex-col items-center gap-20">

        {/* HERO SECTION */}
        <section className="w-full grid md:grid-cols-12 gap-12 items-center pt-8 md:pt-16 animate-fade-in">
          <div className="md:col-span-7 flex flex-col items-start text-left gap-6">
            <div className="inline-flex items-center gap-2 bg-[#161616] border border-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Discord Bildirim Entegrasyonu Aktif
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Okumanın ve Takip Etmenin <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-650">
                En Minimal Hali.
              </span>
            </h1>
            <p className="text-zinc-400 text-base font-light leading-relaxed max-w-xl">
              Türkçe Manga çevirilerini yüksek hızda okuyun, topluluk oylamalarıyla değerlendirin ve Discord aboneliği sayesinde yeni bölüm yayınlandığı an rolünüzü kapın.
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <Link
                href="/mangalist"
                className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold px-6 py-3 rounded-md transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                Kataloğu Keşfet
                <ArrowRight className="w-4 h-4 text-black" />
              </Link>
              <button
                onClick={() => signIn("discord")}
                className="bg-[#161616] hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-semibold px-6 py-3 rounded-md transition-all cursor-pointer active:scale-[0.98]"
              >
                Discord ile Bağlan
              </button>
            </div>
          </div>

          {/* Mockup Dashboard Preview Container */}
          <div className="md:col-span-5 w-full relative hidden md:block">
            <div className="w-full bg-[#161616] border border-zinc-800 rounded-lg p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Dashboard Console</span>
              </div>

              {/* Mockup Manga Card */}
              <div className="flex gap-4 bg-[#0a0a0a] border border-zinc-800 rounded-md p-3.5">
                <div className="w-20 h-28 bg-[#161616] rounded-md border border-zinc-850 flex items-center justify-center shrink-0 overflow-hidden relative">
                  <div className="text-[9px] font-mono text-zinc-650 uppercase tracking-widest text-center px-1">Manga Cover</div>
                  <span className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <div className="flex flex-col justify-between py-0.5 flex-1 min-w-0">
                  <div>
                    <h4 className="font-bold text-white text-xs truncate">Solo Leveling</h4>
                    <p className="text-[9px] font-mono text-zinc-500 mt-0.5">Chugong / DUBU</p>
                    <p className="text-[10px] text-zinc-400 line-clamp-2 mt-1.5 font-light leading-normal">
                      Dünyanın en zayıf avcısı Jinwoo, gizemli zindandan sağ çıkıp seviye atlamaya başlar.
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[#161616] border border-zinc-855 text-zinc-400">Aksiyon</span>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[#161616] border border-zinc-855 text-zinc-400">Fantezi</span>
                  </div>
                </div>
              </div>

              {/* Mockup Interactive Area */}
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-md p-2 flex flex-col justify-center items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= 4 ? "fill-amber-400 text-amber-400" : "text-zinc-750"}`} />
                    ))}
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400">Puan: 4.8 / 5</span>
                </div>
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-md p-2 flex flex-col justify-center items-center gap-1">
                  <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 text-[8px] font-mono font-bold uppercase">
                    Aktif
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400">Zil Bildirimi</span>
                </div>
              </div>
            </div>

            {/* Ambient Background Glow Effect (Subtle Mono) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-zinc-900/40 rounded-full blur-3xl -z-10 pointer-events-none" />
          </div>
        </section>

        {/* STATISTICS SECTION */}
        <section className="w-full border-y border-zinc-900 py-8 grid grid-cols-2 sm:grid-cols-4 gap-8 justify-center text-center">
          <div className="flex flex-col gap-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">1.5k+</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-550">Kayıtlı Okuyucu</span>
          </div>
          <div className="flex flex-col gap-1 border-l border-zinc-900">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">450+</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-550">Manga Oylaması</span>
          </div>
          <div className="flex flex-col gap-1 border-l border-zinc-900">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">20+</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-550">Aktif Çeviri</span>
          </div>
          <div className="flex flex-col gap-1 border-l border-zinc-900">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">99.9%</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-550">Hızlı Okuma</span>
          </div>
        </section>

        {/* BENTO GRID FEATURES SECTION */}
        <section className="w-full flex flex-col gap-10">
          <div className="text-left">
            <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-550 mb-2">Platform Özellikleri</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Okuyucu Deneyimini En Üst Seviyeye Çıkarın</h3>
          </div>

          <div className="grid md:grid-cols-12 gap-6">
            {/* Box 1: Discord Bot */}
            <div className="md:col-span-8 bg-[#161616] border border-zinc-800 rounded-lg p-6 flex flex-col sm:flex-row gap-6 justify-between items-start">
              <div className="flex flex-col gap-3 max-w-md">
                <div className="bg-[#0a0a0a] border border-zinc-800 p-2.5 rounded-md text-white w-fit">
                  <Bell className="w-4 h-4 text-zinc-400" />
                </div>
                <h4 className="text-lg font-bold text-white">Dinamik Discord Rol Bildirimi</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Kullanıcılarınız kataloğumuzdaki mangalara tek tıkla abone olabilir. Yeni bölüm yayınlandığında Discord sunucunuzdaki bot otomatik rol ataması gerçekleştirerek anında ping gönderilmesini sağlar.
                </p>
              </div>
              <div className="w-full sm:w-60 bg-[#0a0a0a] border border-zinc-850 rounded-md p-4 shrink-0 flex flex-col gap-2">
                <span className="text-[9px] font-mono text-zinc-550 uppercase tracking-widest border-b border-zinc-900 pb-1.5 block">BOT CONFIG CONSOLE</span>
                <div className="flex justify-between items-center bg-[#161616]/60 p-2 rounded border border-zinc-850">
                  <span className="text-[10px] text-zinc-300 font-mono">Guild ID</span>
                  <span className="text-[9px] text-zinc-500 font-mono">15133...713</span>
                </div>
                <div className="flex justify-between items-center bg-[#161616]/60 p-2 rounded border border-zinc-850">
                  <span className="text-[10px] text-zinc-300 font-mono">Default Role</span>
                  <span className="text-[9px] text-zinc-500 font-mono">@Nexora</span>
                </div>
              </div>
            </div>

            {/* Box 2: Okuma Deneyimi */}
            <div className="md:col-span-4 bg-[#161616] border border-zinc-800 rounded-lg p-6 flex flex-col justify-between gap-6">
              <div className="bg-[#0a0a0a] border border-zinc-800 p-2.5 rounded-md text-white w-fit">
                <Activity className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-lg font-bold text-white">Dikey Webtoon Okuyucu</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Manga sayfalarını dikey olarak sıralı yükleyen, mobil ve tablet ekranlarıyla %100 uyumlu, reklamsız ve kesintisiz okuma arayüzü.
                </p>
              </div>
            </div>

            {/* Box 3: Profil & Kütüphane */}
            <div className="md:col-span-5 bg-[#161616] border border-zinc-800 rounded-lg p-6 flex flex-col justify-between gap-6">
              <div className="bg-[#0a0a0a] border border-zinc-800 p-2.5 rounded-md text-white w-fit">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-lg font-bold text-white">Kişisel Profil & Kütüphane</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Abone olduğunuz serileri ve puanladığınız tüm bölümleri tek bir profil paneli üzerinden yönetin, kendi okuma listenizi oluşturun.
                </p>
              </div>
            </div>

            {/* Box 4: Puanlama */}
            <div className="md:col-span-7 bg-[#161616] border border-zinc-800 rounded-lg p-6 flex flex-col sm:flex-row gap-6 justify-between items-start">
              <div className="flex flex-col gap-3 max-w-md">
                <div className="bg-[#0a0a0a] border border-zinc-800 p-2.5 rounded-md text-white w-fit">
                  <Star className="w-4 h-4 text-zinc-400" />
                </div>
                <h4 className="text-lg font-bold text-white">Topluluk Puanlama Sistemi</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Okuyucularınız mangaları ve bölümleri 5 yıldız üzerinden derecelendirebilir. Çift oy koruması ile dürüst ve temiz istatistikler elde edersiniz.
                </p>
              </div>
              <div className="w-full sm:w-48 bg-[#0a0a0a] border border-zinc-855 rounded-md p-4 shrink-0 flex flex-col items-center gap-1.5 justify-center">
                <span className="text-[36px] font-mono font-extrabold text-white leading-none">4.8</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400 border-none" />
                  ))}
                </div>
                <span className="text-[9px] font-mono text-zinc-550 uppercase tracking-wider mt-1">452 Toplam Oy</span>
              </div>
            </div>
          </div>
        </section>

        {/* HAFTANIN ÖNE ÇIKAN MANGASI (FEATURED SHOWCASE) */}
        {featuredManga ? (
          <section className="w-full flex flex-col gap-6">
            <div className="text-left">
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-550 mb-1">Topluluk Favorisi</h2>
              <h3 className="text-xl font-bold text-white tracking-tight">Haftanın Öne Çıkan Mangası</h3>
            </div>

            <div className="w-full bg-[#161616] border border-zinc-800 rounded-lg p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
              {/* Blur Background Cover Image */}
              {featuredManga.coverImage && (
                <div
                  className="absolute inset-0 opacity-5 blur-[120px] pointer-events-none scale-150"
                  style={{ backgroundImage: `url(${featuredManga.coverImage})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
                />
              )}

              {/* Cover Art */}
              <div className="w-44 h-64 bg-[#0a0a0a] rounded-md border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 relative z-10">
                {featuredManga.coverImage ? (
                  <img src={featuredManga.coverImage} alt={featuredManga.title} className="w-full h-full object-cover" />
                ) : (
                  <Disc className="w-10 h-10 text-zinc-800 animate-spin" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 flex flex-col justify-between py-1 relative z-10 self-stretch min-w-0">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      ★ Öne Çıkan
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#0a0a0a] text-zinc-400 border border-zinc-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {featuredManga.status}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate leading-tight">
                    {featuredManga.title}
                  </h3>
                  <p className="text-xs font-mono text-zinc-400 mt-1 mb-4">
                    Yazar: {featuredManga.author} {featuredManga.artist ? ` / Çizer: ${featuredManga.artist}` : ""}
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light max-w-2xl mb-6">
                    {featuredManga.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {featuredManga.genres?.map((genre: string) => (
                      <span key={genre} className="text-[9px] font-mono px-2.5 py-0.5 rounded bg-[#0a0a0a] text-zinc-400 border border-zinc-800">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 border-t border-zinc-800 pt-5 mt-auto">
                  <div className="flex-1">
                    <StarRating
                      targetId={featuredManga._id}
                      targetType="manga"
                      initialTotalStars={featuredManga.totalStars || 0}
                      initialTotalRatings={featuredManga.totalRatings || 0}
                    />
                  </div>
                  <div className="flex items-center justify-between bg-[#0a0a0a]/80 border border-zinc-800 rounded-md p-3.5 gap-4 shrink-0">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-300">Discord Bildirim</span>
                      <span className="text-[9px] text-zinc-555 font-light truncate">Yeni bölüm pingi al</span>
                    </div>
                    <DiscordSubscribeButton mangaId={featuredManga._id} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* SON EKLENEN MANGALAR PREVIEW SECTION */}
        <section className="w-full flex flex-col gap-8 pt-10 border-t border-zinc-900">
          <div className="w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="text-left flex flex-col gap-1.5">
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-550">Son Gelişmeler</h2>
              <h3 className="text-3xl font-extrabold tracking-tight text-white">Yeni Eklenen Seriler</h3>
              <p className="text-zinc-400 text-xs font-light max-w-xl">
                Kataloğumuza yeni katılan en taze manga serilerine göz atın.
              </p>
            </div>
            <Link
              href="/mangalist"
              className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold px-4 py-2 rounded-md transition-all shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-[0.98] w-fit"
            >
              Tüm Kataloğu Gör
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Manga Catalog Grid */}
          <div className="w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-550">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
                <span className="text-xs font-mono">Yükleniyor...</span>
              </div>
            ) : latestMangas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 border border-dashed border-zinc-850 rounded-md text-center max-w-md mx-auto w-full">
                <span className="text-zinc-350 font-semibold text-sm mb-1.5">Manga Yok</span>
                <p className="text-xs text-zinc-500 leading-relaxed">Veritabanında henüz manga kaydı bulunmuyor.</p>
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
                      className="bg-[#161616] border border-zinc-850 rounded-md p-5 flex flex-col sm:flex-row gap-6 hover:border-zinc-700 transition-colors duration-200 relative group"
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
                        <span className="absolute top-2.5 left-2.5 text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#0a0a0a]/80 text-zinc-400 border border-zinc-850 flex items-center gap-1">
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
                            {session?.user?.role === "admin" && (
                              <div className="flex items-center gap-1.5 shrink-0 relative z-20">
                                <Link
                                  href={`/admin/add-manga?edit=${manga._id}`}
                                  className="bg-[#0a0a0a] hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white p-1 rounded transition-colors"
                                  title="Düzenle"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    const confirmDelete = window.confirm("Bu mangayı silmek istediğinizden emin misiniz?");
                                    if (!confirmDelete) return;
                                    try {
                                      const res = await fetch(`/api/mangas/${manga._id}`, { method: "DELETE" });
                                      if (res.ok) {
                                        setMangas((prev) => prev.filter((m) => m._id !== manga._id));
                                      } else {
                                        alert("Silme hatası.");
                                      }
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 p-1 rounded transition-colors cursor-pointer"
                                  title="Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Author */}
                          <p className="text-[10px] font-mono text-zinc-400 mb-2 flex items-center gap-1">
                            <User className="w-3 h-3 text-zinc-500" />
                            {manga.author} {manga.artist ? ` / ${manga.artist}` : ""}
                          </p>

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

                        {/* Interactive Section */}
                        <div className="flex flex-col gap-3 border-t border-zinc-800 pt-3.5 mt-4">
                          {/* Star Rating */}
                          <StarRating
                            targetId={manga._id}
                            targetType="manga"
                            initialTotalStars={manga.totalStars || 0}
                            initialTotalRatings={manga.totalRatings || 0}
                          />

                          {/* Subscribe Button */}
                          <div className="flex items-center justify-between bg-[#0a0a0a]/50 border border-zinc-855 rounded-md p-2.5">
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-bold text-zinc-350">Discord Bildirimi</span>
                              <span className="text-[9px] text-zinc-500 font-light truncate">Yeni bölümde rol al.</span>
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
        </section>
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
      <footer className="border-t border-zinc-900 py-10 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>Nexora © {new Date().getFullYear()} • Vercel Style</span>
          <div className="flex gap-4 font-mono text-[10px]">
            <Link href="/mangalist" className="hover:text-zinc-350 cursor-pointer">Katalog</Link>
            <span className="hover:text-zinc-350 cursor-pointer">Terms</span>
            <span className="hover:text-zinc-350 cursor-pointer">Privacy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

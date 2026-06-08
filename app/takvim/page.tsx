"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Calendar, Clock, BookOpen, Disc, Loader2, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

const DAYS_OF_WEEK = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
  "Belirsiz"
];

export default function TakvimPage() {
  const [mangas, setMangas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<string>("Pazartesi");
  const [todayDayName, setTodayDayName] = useState<string>("");

  useEffect(() => {
    // Sayfa yüklendiğinde bugünün gününü belirle ve active yap
    const daysTurkish = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    const todayIndex = new Date().getDay();
    const todayName = daysTurkish[todayIndex];
    setTodayDayName(todayName);
    if (DAYS_OF_WEEK.includes(todayName)) {
      setActiveDay(todayName);
    }

    const fetchMangas = async () => {
      try {
        const res = await fetch("/api/mangas", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          // Sadece "Devam Ediyor" durumundaki serileri takvimde aktif gösterelim
          setMangas(data);
        }
      } catch (err) {
        console.error("Takvim verileri yüklenirken hata:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMangas();
  }, []);

  // Gün bazlı gruplama yapısı
  const getMangasForDay = (day: string) => {
    return mangas.filter(
      (manga) => (manga.scheduleDay === day || (!manga.scheduleDay && day === "Belirsiz")) && manga.status === "Devam Ediyor"
    );
  };

  return (
    <div className="min-h-screen bg-[#070708] text-zinc-200 flex flex-col font-sans antialiased selection:bg-violet-500 selection:text-white relative overflow-hidden">
      {/* Ambient backgrounds */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-650/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-650/5 rounded-full blur-[150px] pointer-events-none -z-10" />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap');
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: #070708;
        }
        h1, h2, h3, h4 {
          font-family: 'Outfit', sans-serif;
        }
        .grid-bg {
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.012) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.012) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>

      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col gap-10 relative z-10 grid-bg">
        
        {/* Title */}
        <div className="flex flex-col gap-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-[#121214] border border-violet-500/25 text-violet-300 px-3 py-1 rounded-full text-xs font-semibold w-fit">
            <Calendar className="w-3.5 h-3.5 text-violet-400" />
            Haftalık Yayın Takvimi
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Yeni Bölüm Çıkış Günleri
          </h1>
          <p className="text-zinc-400 text-xs font-light">
            Çevirisini ve editörlüğünü yaptığımız güncel serilerin haftalık yayın akışını buradan takip edebilirsiniz.
          </p>
        </div>

        {/* Desktop View (Weekly Grid Layout) & Mobile View Switcher */}
        <div className="flex flex-col gap-8">
          {/* Day Navigation Tabs for Mobile & Desktop quick view */}
          <div className="flex flex-wrap gap-2.5 border-b border-zinc-900 pb-5">
            {DAYS_OF_WEEK.map((day) => {
              const count = getMangasForDay(day).length;
              const isActive = activeDay === day;
              const isToday = day === todayDayName;
              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`relative px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2.5 cursor-pointer active:scale-[0.97] border ${
                    isActive
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-500 shadow-[0_4px_20px_rgba(124,58,237,0.25)]"
                      : "bg-[#121214]/40 backdrop-blur-md text-zinc-400 border-zinc-850 hover:text-zinc-200 hover:border-zinc-800 hover:bg-[#161619]/60"
                  }`}
                >
                  {isToday && (
                    <span className="flex h-2 w-2 relative shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                  <span>{day}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold transition-colors ${
                      isActive ? "bg-white/20 text-white" : "bg-zinc-900/60 text-zinc-400 border border-zinc-800"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Grid Layout of Active Selected Day */}
          <div className="w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-550">
                <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                <span className="text-xs font-mono">Takvim yükleniyor...</span>
              </div>
            ) : (
              <div className="min-h-[300px]">
                {getMangasForDay(activeDay).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-6 border border-dashed border-zinc-850 rounded-xl text-center max-w-sm mx-auto w-full backdrop-blur-sm bg-[#121214]/20">
                    <Clock className="w-10 h-10 text-zinc-700 mb-3" />
                    <span className="text-zinc-400 font-semibold text-sm mb-1">{activeDay} Günü İçin Seri Yok</span>
                    <p className="text-xs text-zinc-500 leading-relaxed font-light">
                      {activeDay === "Belirsiz"
                        ? "Düzensiz yayınlanan aktif bir serimiz bulunmuyor."
                        : `${activeDay} günü için planlanmış bir güncel serimiz bulunmuyor.`}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {getMangasForDay(activeDay).map((manga) => (
                      <div
                        key={manga._id}
                        className="bg-gradient-to-br from-[#121214]/50 to-[#0c0c0e]/30 border border-zinc-850/80 hover:border-violet-500/35 rounded-2xl p-4 flex gap-4 transition-all duration-350 ease-out group hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(124,58,237,0.06)] relative backdrop-blur-md"
                      >
                        {/* Cover Art */}
                        <div className="w-22 h-30 bg-zinc-950 rounded-xl border border-zinc-800/80 flex items-center justify-center overflow-hidden shrink-0 relative">
                          {manga.coverImage ? (
                            <img
                              src={manga.coverImage}
                              alt={manga.title}
                              className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out"
                            />
                          ) : (
                            <Disc className="w-6 h-6 text-zinc-800 animate-spin" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex flex-col justify-between py-0.5 flex-1 min-w-0">
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[9px] font-mono uppercase tracking-wider text-violet-400 font-semibold flex items-center gap-1 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20 w-fit">
                                <Sparkles className="w-2.5 h-2.5 text-violet-400" />
                                {activeDay}
                              </span>
                              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
                                {manga.status}
                              </span>
                            </div>
                            <Link href={`/mangalist/${manga._id}`} className="hover:text-violet-400 transition-colors mt-2">
                              <h4 className="text-sm font-extrabold text-white tracking-tight truncate leading-snug group-hover:text-violet-300 transition-colors" title={manga.title}>
                                {manga.title}
                              </h4>
                            </Link>
                            <p className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">
                              {manga.author}
                            </p>
                          </div>

                          <div className="flex flex-col gap-2 mt-3">
                            <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-zinc-650" />
                              <span className="font-bold text-zinc-300">{manga.chapterCount || 0}</span> Bölüm
                            </span>

                            <Link
                              href={`/mangalist/${manga._id}`}
                              className="inline-flex items-center justify-center gap-1.5 bg-[#161619]/80 hover:bg-violet-600 hover:text-white border border-zinc-800/60 hover:border-violet-500 px-3.5 py-2 rounded-xl text-[10px] font-bold text-zinc-300 transition-all duration-300 w-full mt-1 active:scale-[0.98] group/btn"
                            >
                              Detayları Gör
                              <ArrowRight className="w-3.5 h-3.5 text-zinc-550 group-hover:text-white group-hover/btn:translate-x-1 transition-all duration-300" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

                {!loading && mangas.length > 0 && (
          <div className="hidden lg:flex flex-col gap-6 mt-10 border-t border-zinc-900 pt-10">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-400" />
              Haftalık Genel Bakış
            </h3>
            
            <div className="grid grid-cols-7 gap-3">
              {DAYS_OF_WEEK.slice(0, 7).map((day) => {
                const dayMangas = getMangasForDay(day);
                const isToday = day === todayDayName;
                return (
                  <div
                    key={day}
                    className={`rounded-2xl p-3 flex flex-col gap-2 transition-all duration-300 relative ${
                      isToday
                        ? "bg-violet-950/10 border-2 border-violet-500/40 shadow-[0_0_20px_rgba(124,58,237,0.1)] scale-102 z-10"
                        : "bg-[#121214]/30 border border-zinc-850/60"
                    }`}
                  >
                    {isToday && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-violet-500 text-[8px] font-extrabold text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow shadow-violet-500/30">
                        Bugün
                      </span>
                    )}
                    <span className={`text-[10px] font-bold border-b pb-1.5 block text-center uppercase tracking-wide ${
                      isToday ? "text-violet-400 border-violet-500/30 font-extrabold" : "text-zinc-455 border-zinc-900"
                    }`}>
                      {day.substring(0, 3)}
                    </span>
                    <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[220px] pr-0.5">
                      {dayMangas.length === 0 ? (
                        <span className="text-[9px] text-zinc-600 font-mono text-center py-4 select-none">Boş</span>
                      ) : (
                        dayMangas.map((manga) => (
                          <Link
                            key={manga._id}
                            href={`/mangalist/${manga._id}`}
                            className={`p-2 rounded-lg flex flex-col gap-1 transition-all duration-200 group/item border ${
                              isToday
                                ? "bg-violet-900/10 hover:bg-violet-900/35 border-violet-900/40 hover:border-violet-500/40"
                                : "bg-[#0a0a0b]/60 hover:bg-zinc-900 border-zinc-855 hover:border-zinc-750"
                            }`}
                          >
                            <span className="text-[9px] font-bold text-white truncate group-hover/item:text-violet-400 leading-tight">
                              {manga.title}
                            </span>
                            <span className="text-[8.5px] text-zinc-550 font-mono leading-none">
                              {manga.chapterCount || 0} Bölüm
                            </span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

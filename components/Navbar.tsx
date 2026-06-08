"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { BookOpen, ShieldCheck, LogOut, Bell, Check, Loader2, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const isStaff = session?.user?.role === "admin" || session?.user?.role === "mod";

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.isRead).length);
      }
    } catch (err) {
      console.error("Bildirimler yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchNotifications();
    }
  }, [session]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notifId: string) => {
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notifId }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Bildirim okundu işaretleme hatası:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Tümünü okundu işaretleme hatası:", err);
    }
  };

  const handleDeleteNotification = async (notifId: string) => {
    try {
      const res = await fetch("/api/notifications/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notifId }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== notifId));
        setUnreadCount((prev) => {
          const wasRead = notifications.find((n) => n._id === notifId)?.isRead;
          return wasRead ? prev : Math.max(0, prev - 1);
        });
      }
    } catch (err) {
      console.error("Bildirim silme hatası:", err);
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (!confirm("Tüm bildirimleri temizlemek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch("/api/notifications/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteAll: true }),
      });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Tüm bildirimleri temizleme hatası:", err);
    }
  };

  return (
    <header className="border-b border-zinc-900 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <BookOpen className="w-5 h-5 text-white" />
          <span className="font-semibold text-sm tracking-tight text-white uppercase">
            Nex<span className="text-zinc-500 font-normal">ora</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden sm:flex items-center gap-6 text-xs font-semibold">
          <Link 
            href="/" 
            className={`transition-colors ${pathname === "/" ? "text-white" : "text-zinc-400 hover:text-white"}`}
          >
            Ana Sayfa
          </Link>
          <Link 
            href="/mangalist" 
            className={`transition-colors ${pathname === "/mangalist" || pathname.startsWith("/mangalist/") ? "text-white" : "text-zinc-400 hover:text-white"}`}
          >
            Katalog
          </Link>
          <Link 
            href="/takvim" 
            className={`transition-colors ${pathname === "/takvim" ? "text-white" : "text-zinc-400 hover:text-white"}`}
          >
            Yayın Takvimi
          </Link>
          {session && (
            <Link 
              href={`/profile/${session.user.discordId}`} 
              className={`transition-colors ${pathname.startsWith("/profile/") ? "text-white" : "text-zinc-400 hover:text-white"}`}
            >
              Profil
            </Link>
          )}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
              {/* Notification Bell Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="relative p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer flex items-center justify-center border border-transparent hover:border-zinc-800"
                  title="Bildirimler"
                >
                  <Bell className="w-4 h-4 text-zinc-450" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                  )}
                </button>

                {isOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-[#161616] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 text-left animate-fade-in">
                    <div className="px-4 py-3 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/20">
                      <span className="text-xs font-bold text-white">Bildirimler ({unreadCount})</span>
                      <div className="flex gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-[10px] text-violet-400 hover:text-violet-350 font-semibold transition-colors cursor-pointer"
                          >
                            Tümünü Okundu Yap
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button
                            onClick={handleDeleteAllNotifications}
                            className="text-[10px] text-zinc-500 hover:text-red-400 font-semibold transition-colors cursor-pointer"
                          >
                            Temizle
                          </button>
                        )}
                      </div>
                    </div>

                    {/* List */}
                    <div className="max-h-64 overflow-y-auto divide-y divide-zinc-900/60">
                      {loading ? (
                        <div className="flex items-center justify-center py-8 gap-2 text-zinc-550 text-xs">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Yükleniyor...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="py-10 text-center text-zinc-500 text-xs italic">
                          Hiç bildirim bulunmuyor.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`p-3.5 flex items-start gap-2.5 transition-colors relative group ${
                              notif.isRead ? "bg-transparent" : "bg-violet-500/5 hover:bg-violet-500/10"
                            }`}
                          >
                            {!notif.isRead && (
                              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full shrink-0 mt-1.5" />
                            )}
                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="font-bold text-white text-xs leading-tight">{notif.title}</h4>
                              <p className="text-[11px] text-zinc-400 mt-1 font-light leading-relaxed whitespace-pre-wrap">{notif.message}</p>
                              <span className="text-[9px] text-zinc-500 font-mono block mt-1">
                                {new Date(notif.createdAt).toLocaleDateString("tr-TR")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 self-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notif.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead(notif._id)}
                                  className="p-1 bg-[#0a0a0b] hover:bg-zinc-800 border border-zinc-800 text-zinc-450 hover:text-white rounded transition-colors cursor-pointer"
                                  title="Okundu İşaretle"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteNotification(notif._id)}
                                className="p-1 bg-[#0a0a0b] hover:bg-red-950/40 border border-zinc-800 hover:border-red-900/40 text-zinc-450 hover:text-red-400 rounded transition-colors cursor-pointer"
                                title="Bildirimi Sil"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {isStaff && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#161616] hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-colors animate-fade-in"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                  Yönetim
                </Link>
              )}
              
              <Link
                href={`/profile/${session.user.discordId}`}
                className="flex items-center gap-2 bg-[#161616]/40 hover:bg-zinc-800/40 border border-zinc-800 px-2.5 py-1 rounded-md transition-colors"
              >
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover"
                  />
                )}
                <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
                  {session.user?.name}
                </span>
              </Link>

              <button
                onClick={() => signOut()}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-transparent border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer flex items-center gap-1"
                title="Çıkış Yap"
              >
                <LogOut className="w-3.5 h-3.5 sm:hidden" />
                <span className="hidden sm:inline">Çıkış</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn("discord")}
              className="px-4 py-2 rounded-md text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-colors cursor-pointer"
            >
              Giriş Yap
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

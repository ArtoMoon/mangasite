"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { BookOpen, ShieldCheck, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isStaff = session?.user?.role === "admin" || session?.user?.role === "mod";

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

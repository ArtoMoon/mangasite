"use client";

import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, User } from "lucide-react";
import Link from "next/link";

export default function ProfileRedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.discordId) {
      router.replace(`/profile/${session.user.discordId}`);
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <span className="text-xs font-mono text-zinc-550">Profil kontrol ediliyor...</span>
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <span className="text-xs font-mono text-zinc-550">Profilinize yönlendiriliyorsunuz...</span>
      </div>
    );
  }

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
      <header className="border-b border-zinc-900 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <BookOpen className="w-5 h-5 text-white" />
            <span className="font-semibold text-sm tracking-tight text-white uppercase">
              Manga<span className="text-zinc-500 font-normal">Reader</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-6 flex flex-col items-center justify-center py-20 text-center gap-6">
        <div className="bg-[#161616] border border-zinc-800 p-8 rounded-md w-full flex flex-col items-center gap-4">
          <div className="bg-[#0a0a0a] border border-zinc-800 p-4 rounded-md text-white">
            <User className="w-8 h-8 text-zinc-400" />
          </div>
          <h1 className="text-lg font-bold text-white">Giriş Yapılmadı</h1>
          <p className="text-xs text-zinc-400 leading-relaxed font-light">
            Profil sayfanızı, aboneliklerinizi, takipçilerinizi ve oyladığınız mangaları görüntülemek veya diğer kullanıcıları takip etmek için lütfen Discord hesabınızla giriş yapın.
          </p>
          <button
            onClick={() => signIn("discord")}
            className="w-full bg-white hover:bg-zinc-200 text-black text-xs font-semibold py-2.5 rounded-md transition-all cursor-pointer"
          >
            Discord ile Giriş Yap
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-10 text-center text-xs text-zinc-500 mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>Manga Reader © {new Date().getFullYear()} • Vercel Style</span>
        </div>
      </footer>
    </div>
  );
}

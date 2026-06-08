"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, BellOff, Loader2 } from "lucide-react";

interface DiscordSubscribeButtonProps {
  mangaId: string;
}

export default function DiscordSubscribeButton({ mangaId }: DiscordSubscribeButtonProps) {
  const { data: session } = useSession();
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // İlk yüklemede abonelik durumunu sorgula
  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/mangas/${mangaId}/subscribe-discord`);
        if (res.ok) {
          const data = await res.json();
          setSubscribed(data.subscribed);
        }
      } catch (err) {
        console.error("Abonelik durumu sorgulanırken hata:", err);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [mangaId, session]);

  const handleToggle = async () => {
    if (!session) {
      setError("Bildirimleri açmak için Discord ile giriş yapmalısınız.");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const method = subscribed ? "DELETE" : "POST";
      const res = await fetch(`/api/mangas/${mangaId}/subscribe-discord`, {
        method,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Abonelik güncellenirken hata oluştu.");
      }

      setSubscribed(!subscribed);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#161616] text-zinc-500 border border-zinc-800 cursor-not-allowed text-xs font-medium w-fit"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
        Sorgulanıyor...
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-fit">
      <button
        onClick={handleToggle}
        disabled={actionLoading}
        className={`flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-tight transition-all duration-150 ${
          actionLoading ? "opacity-75 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"
        } ${
          subscribed
            ? "bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
            : "bg-white hover:bg-zinc-200 text-black border border-white"
        }`}
      >
        {actionLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : subscribed ? (
          <BellOff className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Bell className="w-3.5 h-3.5 text-black" />
        )}
        <span>{subscribed ? "Kapat" : "Aç"}</span>
      </button>

      {error && (
        <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 py-1 px-2.5 rounded-md max-w-xs font-medium">
          {error}
        </span>
      )}
    </div>
  );
}


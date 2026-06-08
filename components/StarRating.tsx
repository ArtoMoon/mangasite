"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Star } from "lucide-react";

interface StarRatingProps {
  targetId: string;
  targetType: "manga" | "chapter";
  initialTotalStars: number;
  initialTotalRatings: number;
  userRating?: number; // Giriş yapmış kullanıcının daha önce verdiği puan
}

export default function StarRating({
  targetId,
  targetType,
  initialTotalStars,
  initialTotalRatings,
  userRating = 0,
}: StarRatingProps) {
  const { data: session } = useSession();
  const [rating, setRating] = useState<number>(userRating);
  const [hover, setHover] = useState<number>(0);
  const [totalStars, setTotalStars] = useState<number>(initialTotalStars);
  const [totalRatings, setTotalRatings] = useState<number>(initialTotalRatings);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const avgRating = totalRatings > 0 ? (totalStars / totalRatings).toFixed(1) : "0.0";

  const handleRate = async (value: number) => {
    if (!session) {
      setMessage({ text: "Puan vermek için giriş yapmalısınız.", isError: true });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/${targetType === "manga" ? "mangas" : "chapters"}/${targetId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating: value }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Puan kaydedilirken bir hata oluştu.");
      }

      setRating(value);
      setTotalStars(data.totalStars);
      setTotalRatings(data.totalRatings);
      setMessage({ text: "Puanınız başarıyla kaydedildi!", isError: false });
    } catch (error: any) {
      setMessage({ text: error.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-[#0a0a0b]/60 border border-zinc-850/85 text-zinc-200 w-full backdrop-blur-md shadow-sm">
      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold text-zinc-400">
          {targetType === "manga" ? "Puanlama" : "Bölüm Puanı"}
        </span>
        <div className="flex items-center gap-1.5 bg-[#0a0a0a] border border-zinc-800 px-2.5 py-0.5 rounded-md font-mono text-[10px] text-zinc-350">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 border-none" />
          <span>{avgRating} ({totalRatings} Oy)</span>
        </div>
      </div>

      <div className="flex flex-col items-center py-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((index) => {
            const isActive = hover >= index || (!hover && rating >= index);
            return (
              <button
                key={index}
                type="button"
                disabled={loading}
                onClick={() => handleRate(index)}
                onMouseEnter={() => setHover(index)}
                onMouseLeave={() => setHover(0)}
                className={`p-1 transition-all duration-150 focus:outline-none ${
                  loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-110"
                }`}
                aria-label={`${index} Yıldız Puanı`}
              >
                <Star
                  className={`w-6 h-6 transition-all duration-150 ${
                    isActive
                      ? "fill-amber-400 text-amber-400"
                      : "text-zinc-700 fill-transparent hover:text-zinc-500"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {rating > 0 && (
          <p className="text-[10px] text-emerald-400 mt-2 font-semibold tracking-wider uppercase font-mono">
            Verdiğin Puan: {rating} / 5
          </p>
        )}
      </div>

      {message && (
        <div
          className={`text-[10px] text-center py-2 px-3 rounded-md font-medium transition-all duration-150 border ${
            message.isError
              ? "bg-red-500/10 text-red-400 border-red-500/20"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}


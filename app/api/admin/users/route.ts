import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

function getUserBadges(user: any) {
  const badges = [];

  // 1. Custom Badges
  if (user.customBadges && user.customBadges.length > 0) {
    user.customBadges.forEach((cb: any) => {
      if (cb && cb.name) {
        badges.push({
          id: cb._id ? cb._id.toString() : Math.random().toString(),
          name: cb.name,
          description: cb.description,
          color: cb.color,
          icon: cb.icon,
          isCustom: true
        });
      }
    });
  }

  // 2. Discord Badge
  if (user.discordId) {
    badges.push({
      id: "discord",
      name: "Discord Dostu",
      description: "Discord hesabını entegre etti",
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      icon: "Award",
    });
  }

  // 3. Manga Worm Badge (Completed 3+ mangas)
  const completedCount = user.mangaList?.filter((item: any) => item.status === "Okudu").length || 0;
  if (completedCount >= 3) {
    badges.push({
      id: "worm",
      name: "Manga Kurdu",
      description: "3 veya daha fazla seriyi tamamen okudu",
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      icon: "BookOpen",
    });
  }

  // 4. Active Reader Badge (Currently reading 2+ mangas)
  const readingCount = user.mangaList?.filter((item: any) => item.status === "Okuyor").length || 0;
  if (readingCount >= 2) {
    badges.push({
      id: "active",
      name: "Aktif Okur",
      description: "Şu anda 2 veya daha fazla seriyi okuyor",
      color: "bg-amber-500/10 text-amber-455 border-amber-500/20",
      icon: "Bookmark",
    });
  }

  // 5. Critic Badge (Rated 3+ mangas)
  const ratedCount = user.ratedMangas?.length || 0;
  if (ratedCount >= 3) {
    badges.push({
      id: "critic",
      name: "Eleştirmen",
      description: "3 veya daha fazla seriye puan verdi",
      color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      icon: "Star",
    });
  }

  // 6. Community Star Badge (3+ followers)
  const followersCount = user.followers?.length || 0;
  if (followersCount >= 3) {
    badges.push({
      id: "star",
      name: "Topluluk Yıldızı",
      description: "3 veya daha fazla okuyucu tarafından takip ediliyor",
      color: "bg-pink-500/10 text-pink-400 border-pink-500/20",
      icon: "Users",
    });
  }

  // 7. Early Adopter Badge (Joined in 2026 or earlier)
  if (user.createdAt && new Date(user.createdAt).getFullYear() <= 2026) {
    badges.push({
      id: "early",
      name: "Öncü Okur",
      description: "Platformun erken aşamadaki kurucu üyelerinden",
      color: "bg-teal-500/10 text-teal-400 border-teal-500/20",
      icon: "Clock",
    });
  }

  // 8. Seviye Bazlı Rozetler (Level Badges)
  const userLevel = user.level || 1;
  if (userLevel >= 100) {
    badges.push({
      id: "lvl-legendary",
      name: "Efsanevi Okur",
      description: "100. Seviyeye ulaştı!",
      color: "bg-red-500/20 text-red-300 border-red-500/40 font-bold animate-pulse",
      icon: "Award",
    });
  } else if (userLevel >= 50) {
    badges.push({
      id: "lvl-platinum",
      name: "Platin Okur",
      description: "50. Seviyeye ulaştı!",
      color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      icon: "Award",
    });
  } else if (userLevel >= 20) {
    badges.push({
      id: "lvl-gold",
      name: "Altın Okur",
      description: "20. Seviyeye ulaştı!",
      color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      icon: "Award",
    });
  } else if (userLevel >= 10) {
    badges.push({
      id: "lvl-silver",
      name: "Gümüş Okur",
      description: "10. Seviyeye ulaştı!",
      color: "bg-zinc-400/10 text-zinc-300 border-zinc-450/20",
      icon: "Award",
    });
  } else if (userLevel >= 5) {
    badges.push({
      id: "lvl-bronze",
      name: "Bronz Okur",
      description: "5. Seviyeye ulaştı!",
      color: "bg-orange-850/15 text-orange-400 border-orange-500/20",
      icon: "Award",
    });
  }

  return badges;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user.role !== "admin" && session.user.role !== "mod")) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz bulunmamaktadır." }, { status: 403 });
    }

    await dbConnect();
    const users = await User.find({}).populate("customBadges").sort({ createdAt: -1 }).lean();

    const usersWithBadges = users.map((user: any) => {
      const calculatedBadges = getUserBadges(user);
      return {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role || "user",
        discordId: user.discordId,
        level: user.level || 1,
        xp: user.xp || 0,
        customBadges: user.customBadges || [],
        badges: calculatedBadges,
        createdAt: user.createdAt,
      };
    });

    return NextResponse.json(usersWithBadges);
  } catch (error: any) {
    console.error("Yönetici kullanıcı listesi yüklenirken hata:", error);
    return NextResponse.json({ error: "Kullanıcılar yüklenirken bir sunucu hatası oluştu." }, { status: 500 });
  }
}

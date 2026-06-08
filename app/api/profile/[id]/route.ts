import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Manga from "@/models/Manga"; // Required for Mongoose populate registration

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    // Simple validation: Discord ID is a string of numbers
    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { error: "Geçersiz Discord ID formatı." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Ensure models are registered in mongoose context
    const registeredManga = Manga;

    const session = await getServerSession(authOptions);
    const loggedInUserId = session?.user?.id;
    const loggedInUserRole = session?.user?.role;

    // Query by discordId instead of MongoDB ObjectId and populate mangaList
    const targetUser = await User.findOne({ discordId: id })
      .populate("subscribedMangas")
      .populate("ratedMangas.targetId")
      .populate("followers", "name image role discordId")
      .populate("following", "name image role discordId")
      .populate("mangaList.mangaId");

    if (!targetUser) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    const isOwner = session?.user?.discordId === targetUser.discordId;
    const isAdmin = loggedInUserRole === "admin";
    
    // Check if the current user is following the target user (followers array has MongoDB _ids)
    const isFollowing = loggedInUserId 
      ? targetUser.followers.some((f: any) => f._id.toString() === loggedInUserId)
      : false;

    // Calculate dynamic badges based on user stats
    const badges = [];

    // 1. Staff / Admin Badge
    if (targetUser.role === "admin") {
      badges.push({
        id: "staff-founder",
        name: "Kurucu",
        description: "Nexora Platform Kurucusu",
        color: "bg-red-500/10 text-red-400 border-red-500/20",
        icon: "ShieldCheck",
      });
    } else if (targetUser.role === "mod") {
      badges.push({
        id: "staff-mod",
        name: "Moderatör",
        description: "Nexora Platform Moderatörü",
        color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        icon: "ShieldCheck",
      });
    }

    // 2. Discord Badge
    if (targetUser.discordId) {
      badges.push({
        id: "discord",
        name: "Discord Dostu",
        description: "Discord hesabını entegre etti",
        color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        icon: "Award",
      });
    }

    // 3. Manga Worm Badge (Completed 3+ mangas)
    const completedCount = targetUser.mangaList?.filter((item: any) => item.status === "Okudu").length || 0;
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
    const readingCount = targetUser.mangaList?.filter((item: any) => item.status === "Okuyor").length || 0;
    if (readingCount >= 2) {
      badges.push({
        id: "active",
        name: "Aktif Okur",
        description: "Şu anda 2 veya daha fazla seriyi okuyor",
        color: "bg-amber-500/10 text-amber-450 border-amber-500/20",
        icon: "Bookmark",
      });
    }

    // 5. Critic Badge (Rated 3+ mangas)
    const ratedCount = targetUser.ratedMangas?.length || 0;
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
    const followersCount = targetUser.followers?.length || 0;
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
    if (targetUser.createdAt && new Date(targetUser.createdAt).getFullYear() <= 2026) {
      badges.push({
        id: "early",
        name: "Öncü Okur",
        description: "Platformun erken aşamadaki kurucu üyelerinden",
        color: "bg-teal-500/10 text-teal-400 border-teal-500/20",
        icon: "Clock",
      });
    }

    // 8. Seviye Bazlı Rozetler (Level Badges)
    const userLevel = targetUser.level || 1;
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

    return NextResponse.json({
      id: targetUser.discordId,
      mongoId: targetUser._id.toString(),
      name: targetUser.name,
      email: (isOwner || isAdmin) ? targetUser.email : undefined,
      image: targetUser.image,
      role: targetUser.role,
      discordId: targetUser.discordId,
      subscribedMangas: targetUser.subscribedMangas || [],
      ratedMangas: targetUser.ratedMangas || [],
      followers: targetUser.followers || [],
      following: targetUser.following || [],
      mangaList: targetUser.mangaList || [],
      xp: targetUser.xp || 0,
      level: targetUser.level || 1,
      readChapters: targetUser.readChapters || [],
      badges, // Expose dynamic badges list
      createdAt: targetUser.createdAt,
      isOwner,
      isFollowing,
    });
  } catch (error: any) {
    console.error("Profil detayları çekilirken hata:", error);
    return NextResponse.json(
      { error: "Profil detayları yüklenirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

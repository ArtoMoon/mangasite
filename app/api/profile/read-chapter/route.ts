import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Giriş yapmanız gerekmektedir." }, { status: 401 });
    }

    const body = await request.json();
    const { chapterId } = body;

    if (!chapterId) {
      return NextResponse.json({ error: "Bölüm ID (chapterId) gereklidir." }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    const chapterObjectId = new mongoose.Types.ObjectId(chapterId);

    // Mükerrer okuma kontrolü
    const isAlreadyRead = user.readChapters?.some(
      (id: mongoose.Types.ObjectId) => id.toString() === chapterId
    );

    let xpGained = 0;
    let leveledUp = false;
    let oldLevel = user.level || 1;
    let newLevel = oldLevel;

    if (!isAlreadyRead) {
      // Eğer readChapters yoksa diziyi başlat
      if (!user.readChapters) {
        user.readChapters = [];
      }
      user.readChapters.push(chapterObjectId);

      // XP ve Seviye Hesaplama
      xpGained = 100;
      user.xp = (user.xp || 0) + xpGained;
      
      // Seviye formülü: her 500 XP = 1 seviye
      newLevel = Math.floor(user.xp / 500) + 1;
      
      if (newLevel > oldLevel) {
        user.level = newLevel;
        leveledUp = true;
      }

      await user.save();
    }

    return NextResponse.json({
      success: true,
      xpGained,
      currentXp: user.xp,
      currentLevel: user.level,
      leveledUp,
      totalReadChapters: user.readChapters.length
    });
  } catch (error: any) {
    console.error("Bölüm okuma kaydı ve XP hatası:", error);
    return NextResponse.json(
      { error: "İşlem sırasında sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Chapter from "@/models/Chapter";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chapterId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { rating } = body;

    // Puan doğrulaması
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Geçersiz puan! Puan 1 ile 5 arasında olmalıdır." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Bölüm kontrolü
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return NextResponse.json(
        { error: "Bölüm bulunamadı." },
        { status: 404 }
      );
    }

    // Kullanıcı kontrolü
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    const existingRatingIndex = user.ratedChapters.findIndex(
      (item: any) => item.targetId.toString() === chapterId
    );

    let starDifference = rating;
    let ratingCountDifference = 1;

    if (existingRatingIndex > -1) {
      // Kullanıcı zaten puanlamış, aradaki farkı hesapla
      const previousRating = user.ratedChapters[existingRatingIndex].rating;
      starDifference = rating - previousRating;
      ratingCountDifference = 0; // Toplam oy sayısı değişmez

      // Puanı güncelle
      user.ratedChapters[existingRatingIndex].rating = rating;
    } else {
      // Yeni puanlama
      user.ratedChapters.push({ targetId: chapterId as any, rating });
    }

    // Değişiklikleri kaydet
    await user.save();

    // Bölümün puan istatistiklerini güncelle
    chapter.totalStars = (chapter.totalStars || 0) + starDifference;
    chapter.totalRatings = (chapter.totalRatings || 0) + ratingCountDifference;
    await chapter.save();

    const averageRating = chapter.totalRatings > 0 ? (chapter.totalStars / chapter.totalRatings) : 0;

    return NextResponse.json({
      success: true,
      message: "Puanınız başarıyla kaydedildi.",
      totalStars: chapter.totalStars,
      totalRatings: chapter.totalRatings,
      averageRating: parseFloat(averageRating.toFixed(2)),
    });
  } catch (error: any) {
    console.error("Bölüm puanlama hatası:", error);
    return NextResponse.json(
      { error: "Puanlama işlemi sırasında sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

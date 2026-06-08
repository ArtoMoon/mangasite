import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Manga from "@/models/Manga";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mangaId } = await params;
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

    // Manga kontrolü
    const manga = await Manga.findById(mangaId);
    if (!manga) {
      return NextResponse.json(
        { error: "Manga bulunamadı." },
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

    const existingRatingIndex = user.ratedMangas.findIndex(
      (item: any) => item.targetId.toString() === mangaId
    );

    let starDifference = rating;
    let ratingCountDifference = 1;

    if (existingRatingIndex > -1) {
      // Kullanıcı zaten puanlamış, aradaki farkı hesapla
      const previousRating = user.ratedMangas[existingRatingIndex].rating;
      starDifference = rating - previousRating;
      ratingCountDifference = 0; // Toplam oy veren sayısı değişmez, sadece toplam yıldız güncellenir

      // Puanı güncelle
      user.ratedMangas[existingRatingIndex].rating = rating;
    } else {
      // Yeni puanlama
      user.ratedMangas.push({ targetId: mangaId as any, rating });
    }

    // Değişiklikleri kaydet
    await user.save();

    // Manganın puan istatistiklerini güncelle
    manga.totalStars = (manga.totalStars || 0) + starDifference;
    manga.totalRatings = (manga.totalRatings || 0) + ratingCountDifference;
    await manga.save();

    const averageRating = manga.totalRatings > 0 ? (manga.totalStars / manga.totalRatings) : 0;

    return NextResponse.json({
      success: true,
      message: "Puanınız başarıyla kaydedildi.",
      totalStars: manga.totalStars,
      totalRatings: manga.totalRatings,
      averageRating: parseFloat(averageRating.toFixed(2)),
    });
  } catch (error: any) {
    console.error("Manga puanlama hatası:", error);
    return NextResponse.json(
      { error: "Puanlama işlemi sırasında sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

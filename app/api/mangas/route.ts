import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Manga from "@/models/Manga";
import Chapter from "@/models/Chapter";

// POST: Yeni manga oluşturur (Sadece Admin yetkilileri)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Yetki kontrolü (admin veya mod)
    if (!session || !session.user || (session.user.role !== "admin" && session.user.role !== "mod")) {
      return NextResponse.json(
        { error: "Bu işlemi gerçekleştirmek için yetkiniz olmalıdır." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      coverImage, 
      bannerImage, 
      author, 
      artist, 
      genres, 
      status, 
      releaseYear, 
      discordRoleId 
    } = body;

    // Gerekli alanların doğrulanması
    if (!title || !description || !coverImage || !author || !genres || !genres.length || !releaseYear) {
      return NextResponse.json(
        { error: "Lütfen gerekli alanları (başlık, açıklama, kapak görseli, yazar, türler ve yayın yılı) doldurun." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Yeni manga oluşturulması
    const newManga = await Manga.create({
      title,
      description,
      coverImage, // Base64 kodlanmış veri
      bannerImage: bannerImage || undefined, // Base64 kodlanmış veri
      author,
      artist: artist || undefined,
      genres,
      status: status || "Devam Ediyor",
      releaseYear: Number(releaseYear),
      discordRoleId: discordRoleId || undefined,
      totalStars: 0,
      totalRatings: 0,
      views: 0,
    });

    return NextResponse.json({
      success: true,
      message: "Manga başarıyla eklendi.",
      manga: newManga,
    });
  } catch (error: any) {
    console.error("Manga ekleme hatası:", error);
    return NextResponse.json(
      { error: "Manga eklenirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

// GET: Tüm mangaları listeler
export async function GET() {
  try {
    await dbConnect();
    const mangas = await Manga.find({}).sort({ createdAt: -1 });

    const mangasWithChapterCount = await Promise.all(
      mangas.map(async (manga) => {
        const chapterCount = await Chapter.countDocuments({ mangaId: manga._id });
        return {
          ...manga.toObject(),
          chapterCount,
        };
      })
    );

    return NextResponse.json(mangasWithChapterCount);
  } catch (error) {
    console.error("Mangaları çekme hatası:", error);
    return NextResponse.json(
      { error: "Mangalar listelenirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

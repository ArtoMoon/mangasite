import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Chapter from "@/models/Chapter";
import Manga from "@/models/Manga";

// GET: Tek bir bölümün verilerini (sayfalar dahil) getirir
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    await dbConnect();

    const chapter = await Chapter.findById(id);

    if (!chapter) {
      return NextResponse.json(
        { error: "Bölüm bulunamadı." },
        { status: 404 }
      );
    }

    // Manga okunma sayısını artır
    try {
      await Manga.findByIdAndUpdate(chapter.mangaId, { $inc: { views: 1 } });
    } catch (viewErr) {
      console.error("Manga okunma sayısı artırılamadı:", viewErr);
    }

    return NextResponse.json(chapter);
  } catch (error: any) {
    console.error("Bölüm çekme hatası:", error);
    return NextResponse.json(
      { error: "Bölüm yüklenirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

// PUT: Bölümü günceller (Sadece Admin/Mod)
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user.role !== "admin" && session.user.role !== "mod")) {
      return NextResponse.json(
        { error: "Bu işlemi gerçekleştirmek için yetkiniz olmalıdır." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, pages } = body;

    if (!title || !pages || !pages.length) {
      return NextResponse.json(
        { error: "Lütfen bölüm başlığını girin ve en az bir sayfa resmi yükleyin." },
        { status: 400 }
      );
    }

    await dbConnect();

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      return NextResponse.json(
        { error: "Güncellenecek bölüm bulunamadı." },
        { status: 404 }
      );
    }

    chapter.title = title;
    chapter.pages = pages;
    await chapter.save();

    return NextResponse.json({ success: true, message: "Bölüm başarıyla güncellendi.", chapter });
  } catch (error: any) {
    console.error("Bölüm güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Bölüm güncellenirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

// DELETE: Bölümü siler (Sadece Admin/Mod)
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user.role !== "admin" && session.user.role !== "mod")) {
      return NextResponse.json(
        { error: "Bu işlemi gerçekleştirmek için yetkiniz olmalıdır." },
        { status: 403 }
      );
    }

    await dbConnect();

    const chapter = await Chapter.findByIdAndDelete(id);
    if (!chapter) {
      return NextResponse.json(
        { error: "Silinecek bölüm bulunamadı." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Bölüm başarıyla silindi." });
  } catch (error: any) {
    console.error("Bölüm silme hatası:", error);
    return NextResponse.json(
      { error: "Bölüm silinirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}


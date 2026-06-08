import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Manga from "@/models/Manga";

// GET: Tek bir manga detayını getirir
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    await dbConnect();

    const manga = await Manga.findById(id);

    if (!manga) {
      return NextResponse.json(
        { error: "Manga bulunamadı." },
        { status: 404 }
      );
    }

    return NextResponse.json(manga);
  } catch (error: any) {
    console.error("Manga getirme hatası:", error);
    return NextResponse.json(
      { error: "Manga bilgileri yüklenirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

// PUT: Mangayı günceller (Sadece Admin yetkilileri)
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const session = await getServerSession(authOptions);

    // Yetki kontrolü (admin veya mod)
    if (!session || !session.user || (session.user.role !== "admin" && session.user.role !== "mod")) {
      return NextResponse.json(
        { error: "Bu işlemi gerçekleştirmek için yetkiniz olmalıdır." },
        { status: 403 }
      );
    }

    const body = await request.json();
    await dbConnect();

    const updatedManga = await Manga.findByIdAndUpdate(
      id,
      {
        title: body.title,
        description: body.description,
        coverImage: body.coverImage,
        bannerImage: body.bannerImage || undefined,
        author: body.author,
        artist: body.artist || undefined,
        genres: body.genres,
        status: body.status,
        releaseYear: Number(body.releaseYear),
        discordRoleId: body.discordRoleId || undefined,
      },
      { new: true }
    );

    if (!updatedManga) {
      return NextResponse.json(
        { error: "Güncellenecek manga bulunamadı." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Manga başarıyla güncellendi.",
      manga: updatedManga,
    });
  } catch (error: any) {
    console.error("Manga güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Manga güncellenirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

// DELETE: Mangayı siler (Sadece Admin yetkilileri)
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const session = await getServerSession(authOptions);

    // Yetki kontrolü (admin veya mod)
    if (!session || !session.user || (session.user.role !== "admin" && session.user.role !== "mod")) {
      return NextResponse.json(
        { error: "Bu işlemi gerçekleştirmek için yetkiniz olmalıdır." },
        { status: 403 }
      );
    }

    await dbConnect();

    const deletedManga = await Manga.findByIdAndDelete(id);

    if (!deletedManga) {
      return NextResponse.json(
        { error: "Silinecek manga bulunamadı." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Manga başarıyla silindi.",
    });
  } catch (error: any) {
    console.error("Manga silme hatası:", error);
    return NextResponse.json(
      { error: "Manga silinirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

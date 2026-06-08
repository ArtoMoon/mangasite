export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Report from "@/models/Report";
import Chapter from "@/models/Chapter";

// POST: Yeni bir hata bildirimi oluşturur (Giriş yapan her kullanıcı)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Hata bildirmek için giriş yapmalısınız." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { mangaId, chapterId, message } = body;

    if (!mangaId || !message) {
      return NextResponse.json(
        { error: "Lütfen gerekli alanları (mangaId ve mesaj) doldurun." },
        { status: 400 }
      );
    }

    await dbConnect();

    const newReport = await Report.create({
      mangaId,
      chapterId: chapterId || undefined,
      reportedBy: session.user.name || "Kullanıcı",
      message
    });

    return NextResponse.json({
      success: true,
      message: "Hata bildirimi başarıyla gönderildi.",
      report: newReport
    });
  } catch (error: any) {
    console.error("Hata bildirimi oluşturulurken hata:", error);
    return NextResponse.json(
      { error: "Hata bildirimi gönderilirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

// GET: Belirli bir mangaya ait hata bildirimlerini listeler (Sadece Admin / Mod)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Yetki kontrolü (admin veya mod)
    if (!session || !session.user || (session.user.role !== "admin" && session.user.role !== "mod")) {
      return NextResponse.json(
        { error: "Bu işlemi gerçekleştirmek için yetkiniz olmalıdır." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mangaId = searchParams.get("mangaId");

    if (!mangaId) {
      return NextResponse.json(
        { error: "Manga ID belirtilmelidir." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Model popülasyonu için Chapter referans kaydı
    const registeredChapter = Chapter;

    const reports = await Report.find({ mangaId })
      .sort({ createdAt: -1 })
      .populate("chapterId", "title");

    return NextResponse.json(reports);
  } catch (error: any) {
    console.error("Hata bildirimleri çekilirken hata:", error);
    return NextResponse.json(
      { error: "Hata bildirimleri yüklenirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

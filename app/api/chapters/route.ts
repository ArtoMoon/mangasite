export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Chapter from "@/models/Chapter";
import Manga from "@/models/Manga";

export async function GET() {
  try {
    await dbConnect();
    
    // Register Manga model in mongoose context
    const registeredManga = Manga;

    const latestChapters = await Chapter.find({})
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("mangaId", "title coverImage author status");

    return NextResponse.json(latestChapters);
  } catch (error: any) {
    console.error("Son bölümler çekilirken hata:", error);
    return NextResponse.json(
      { error: "Son bölümler yüklenirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

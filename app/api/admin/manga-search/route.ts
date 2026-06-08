import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user.role !== "admin" && session.user.role !== "mod")) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ error: "Arama terimi (q) gereklidir." }, { status: 400 });
    }

    const response = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=5`);
    if (!response.ok) {
      return NextResponse.json({ error: "MyAnimeList API araması başarısız oldu." }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data.data || []);
  } catch (error) {
    console.error("Manga Search API Hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

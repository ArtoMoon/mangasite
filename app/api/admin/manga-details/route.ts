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
    const malId = searchParams.get("malId");

    if (!malId) {
      return NextResponse.json({ error: "malId parametresi gereklidir." }, { status: 400 });
    }

    const response = await fetch(`https://api.jikan.moe/v4/manga/${malId}`);
    if (!response.ok) {
      return NextResponse.json({ error: "MyAnimeList detayı alınamadı." }, { status: 502 });
    }

    const resJson = await response.json();
    const item = resJson.data;

    // Kapak Görselini indir ve Base64 formatına dönüştür
    const imageUrl = item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url;
    let coverImageBase64 = "";

    if (imageUrl) {
      try {
        const imgRes = await fetch(imageUrl);
        const arrayBuffer = await imgRes.arrayBuffer();
        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        const base64String = Buffer.from(arrayBuffer).toString("base64");
        coverImageBase64 = `data:${contentType};base64,${base64String}`;
      } catch (err) {
        console.error("Görsel indirilirken veya base64'e çevrilirken hata:", err);
      }
    }

    // İngilizce Tür İsimlerini Türkçe Karşılıklarıyla Eşleştir
    const genreMapping: Record<string, string> = {
      "Action": "Aksiyon",
      "Adventure": "Macera",
      "Fantasy": "Fantezi",
      "Romance": "Romantizm",
      "Drama": "Dram",
      "Comedy": "Komedi",
      "Sci-Fi": "Bilim Kurgu",
      "Mystery": "Gizem",
      "Horror": "Korku",
      "Supernatural": "Doğaüstü",
      "Historical": "Tarihi",
      "Slice of Life": "Yaşamdan Kesitler",
      "School": "Okul",
    };

    const apiGenres: string[] = item.genres?.map((g: any) => g.name) || [];
    const mappedGenres = apiGenres
      .map((g) => genreMapping[g] || g)
      .filter((g) => [
        "Aksiyon", "Macera", "Fantezi", "Romantizm", "Dram", 
        "Komedi", "Webtoon", "Bilim Kurgu", "Gizem", "Korku", 
        "Doğaüstü", "Tarihi", "Yaşamdan Kesitler", "Okul"
      ].includes(g));

    // Yayın durumu eşleştirmesi
    const mappedStatus = item.publishing ? "Devam Ediyor" : "Tamamlandı";

    // Yayın yılı
    let releaseYear = new Date().getFullYear();
    if (item.published?.from) {
      try {
        releaseYear = new Date(item.published.from).getFullYear();
      } catch (e) {
        console.error("Tarih ayrıştırma hatası:", e);
      }
    }

    const result = {
      title: item.title,
      description: item.synopsis || "",
      author: item.authors?.map((a: any) => a.name).join(", ") || "",
      genres: mappedGenres,
      status: mappedStatus,
      releaseYear,
      coverImage: coverImageBase64,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Manga Details API Hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

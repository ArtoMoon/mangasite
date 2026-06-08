import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Manga from "@/models/Manga"; // Schema references require models to be registered

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "Profilinizi görmek için giriş yapmalısınız." },
        { status: 401 }
      );
    }

    await dbConnect();

    // Make sure Manga model is registered in Mongoose context
    const registeredManga = Manga;

    const user = await User.findOne({ email: session.user.email })
      .populate("subscribedMangas")
      .populate("ratedMangas.targetId");

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      discordId: user.discordId,
      subscribedMangas: user.subscribedMangas || [],
      ratedMangas: user.ratedMangas || [],
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    console.error("Profil bilgileri yüklenirken hata:", error);
    return NextResponse.json(
      { error: "Profil bilgileri yüklenirken bir sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

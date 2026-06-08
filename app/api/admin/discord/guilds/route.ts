import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchBotGuilds } from "@/lib/discord";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    const guilds = await fetchBotGuilds();
    return NextResponse.json(guilds);
  } catch (error) {
    console.error("Guilds API Hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Manga from "@/models/Manga";
import Chapter from "@/models/Chapter";
import Settings from "@/models/Settings";
import { sendDiscordChannelMessage, fetchGuildChannels } from "@/lib/discord";

// GET: Mangaya ait tüm bölümleri listeler
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    await dbConnect();

    const chapters = await Chapter.find({ mangaId: id }).sort({ createdAt: 1 });
    return NextResponse.json(chapters);
  } catch (error: any) {
    console.error("Bölümleri çekme hatası:", error);
    return NextResponse.json(
      { error: "Bölümler listelenirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

// POST: Mangaya yeni bölüm ekler (Sadece Admin yetkilileri)
export async function POST(
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
    const { title, pages } = body;

    if (!title || !pages || !pages.length) {
      return NextResponse.json(
        { error: "Lütfen bölüm başlığını girin ve en az bir sayfa resmi yükleyin." },
        { status: 400 }
      );
    }

    await dbConnect();

    const manga = await Manga.findById(id);
    if (!manga) {
      return NextResponse.json(
        { error: "Bölüm eklenecek manga bulunamadı." },
        { status: 404 }
      );
    }

    // Yeni bölümün veritabanına kaydedilmesi
    const newChapter = await Chapter.create({
      mangaId: id,
      title,
      pages, // Base64 strings array
      totalStars: 0,
      totalRatings: 0,
    });

    // Discord Bildirimi Gönderme
    try {
      const settings = await Settings.findOne({});
      const guildId = settings?.guildId || process.env.DISCORD_GUILD_ID;
      
      // Kanal tespiti (Öncelikle DB ayarlarındaki bildirim kanalı, sonra env.local)
      let targetChannelId = settings?.notificationChannelId || process.env.DISCORD_CHANNEL_ID;
      
      if (!targetChannelId && guildId) {
        const channels = await fetchGuildChannels(guildId);
        // Tercih edilen isimlere göre filtrele (Metin kanalları - type: 0)
        const textChannels = channels.filter((ch: any) => ch.type === 0);
        const preferredChannel = textChannels.find((ch: any) => 
          ["manga-duyuru", "duyuru", "manga-bildirim", "genel", "general"].includes(ch.name.toLowerCase())
        );
        
        if (preferredChannel) {
          targetChannelId = preferredChannel.id;
        } else if (textChannels.length > 0) {
          targetChannelId = textChannels[0].id; // Hiçbiri yoksa ilk metin kanalını seç
        }
      }

      if (targetChannelId) {
        // Hangi rolü etiketleyeceğimizi belirle
        const roleId = manga.discordRoleId || settings?.defaultRoleId || process.env.DISCORD_DEFAULT_ROLE_ID;
        const roleMention = roleId ? `<@&${roleId}>` : "";
        
        const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const readerUrl = `${siteUrl}/mangas/${id}/chapters/${newChapter._id}`;

        const messageText = `${roleMention} **Yeni Bölüm Yayınlandı!** 🎉\n\n**${manga.title} - ${title}** artık yayında! Aşağıdaki bağlantıdan hemen okuyabilirsiniz:\n${readerUrl}`;

        await sendDiscordChannelMessage(targetChannelId, messageText);
      }
    } catch (discordErr) {
      console.error("Bölüm eklendi ancak Discord bildirimi gönderilemedi:", discordErr);
    }

    return NextResponse.json({
      success: true,
      message: "Bölüm başarıyla oluşturuldu ve duyurusu yapıldı.",
      chapter: newChapter,
    });
  } catch (error: any) {
    console.error("Bölüm ekleme hatası:", error);
    return NextResponse.json(
      { error: "Bölüm kaydedilirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

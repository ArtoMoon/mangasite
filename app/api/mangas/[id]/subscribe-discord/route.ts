import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Manga from "@/models/Manga";
import { assignDiscordRole, removeDiscordRole } from "@/lib/discord";

// GET: Kullanıcının bu mangaya abone olup olmadığını sorgular
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mangaId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ subscribed: false });
    }

    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ subscribed: false });
    }

    const subscribed = user.subscribedMangas.some(
      (id: any) => id.toString() === mangaId
    );

    return NextResponse.json({ subscribed });
  } catch (error) {
    console.error("Abonelik durumu kontrol hatası:", error);
    return NextResponse.json({ subscribed: false });
  }
}

// POST: Bildirimleri aç ve Discord Rolü ata
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mangaId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    await dbConnect();

    // Manga bilgisi ve rol ID tespiti
    const manga = await Manga.findById(mangaId);
    if (!manga) {
      return NextResponse.json(
        { error: "Manga bulunamadı." },
        { status: 404 }
      );
    }

    const roleId = manga.discordRoleId || process.env.DISCORD_DEFAULT_ROLE_ID;
    if (!roleId) {
      return NextResponse.json(
        { error: "Bu manga için tanımlanmış bir bildirim rolü bulunmamaktadır." },
        { status: 400 }
      );
    }

    // Kullanıcının Discord ID tespiti
    const user = await User.findById(session.user.id);
    if (!user || !user.discordId) {
      return NextResponse.json(
        { error: "Discord hesabınız bağlı bulunamadı. Lütfen Discord ile tekrar giriş yapın." },
        { status: 400 }
      );
    }

    // Discord API üzerinden rol atama
    const discordSuccess = await assignDiscordRole(user.discordId, roleId);
    if (!discordSuccess) {
      return NextResponse.json(
        { error: "Discord sunucusunda rol atanırken hata oluştu. Sunucuda olduğunuzdan emin olun." },
        { status: 502 }
      );
    }

    // Veritabanına abonelik kaydetme
    if (!user.subscribedMangas.includes(manga._id)) {
      user.subscribedMangas.push(manga._id);
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: "Bildirimler açıldı, Discord rolünüz tanımlandı.",
    });
  } catch (error: any) {
    console.error("Discord abone olma hatası:", error);
    return NextResponse.json(
      { error: "İşlem sırasında bir sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

// DELETE: Bildirimleri kapat ve Discord Rolünü kaldır
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mangaId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    await dbConnect();

    // Manga ve rol ID tespiti
    const manga = await Manga.findById(mangaId);
    if (!manga) {
      return NextResponse.json(
        { error: "Manga bulunamadı." },
        { status: 404 }
      );
    }

    const roleId = manga.discordRoleId || process.env.DISCORD_DEFAULT_ROLE_ID;
    if (!roleId) {
      return NextResponse.json(
        { error: "Bu manga için tanımlanmış bir bildirim rolü bulunmamaktadır." },
        { status: 400 }
      );
    }

    // Kullanıcının Discord ID tespiti
    const user = await User.findById(session.user.id);
    if (!user || !user.discordId) {
      return NextResponse.json(
        { error: "Discord hesabınız bağlı bulunamadı." },
        { status: 400 }
      );
    }

    // Discord API üzerinden rol kaldırma
    const discordSuccess = await removeDiscordRole(user.discordId, roleId);
    if (!discordSuccess) {
      return NextResponse.json(
        { error: "Discord sunucusunda rol kaldırılırken hata oluştu." },
        { status: 502 }
      );
    }

    // Veritabanından aboneliği silme
    user.subscribedMangas = user.subscribedMangas.filter(
      (id: any) => id.toString() !== mangaId
    );
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Bildirimler kapatıldı, Discord rolünüz kaldırıldı.",
    });
  } catch (error: any) {
    console.error("Discord abonelik kaldırma hatası:", error);
    return NextResponse.json(
      { error: "İşlem sırasında bir sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

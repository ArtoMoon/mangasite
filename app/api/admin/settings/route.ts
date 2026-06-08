import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";

// GET: Mevcut ayarları döner
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user.role !== "admin" && session.user.role !== "mod")) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    await dbConnect();
    const settings = await Settings.findOne({});
    
    return NextResponse.json(settings || { 
      guildId: "", 
      defaultRoleId: "", 
      adminRoleId: "", 
      founderRoleId: "",
      notificationChannelId: "",
      topBannerUrl: "",
      topBannerLink: "",
      bottomBannerUrl: "",
      bottomBannerLink: ""
    });
  } catch (error) {
    console.error("Settings GET Hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

// POST: Ayarları kaydeder veya günceller
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user.role !== "admin" && session.user.role !== "mod")) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    const body = await request.json();
    const { 
      guildId, 
      defaultRoleId, 
      adminRoleId, 
      founderRoleId,
      notificationChannelId,
      topBannerUrl,
      topBannerLink,
      bottomBannerUrl,
      bottomBannerLink
    } = body;

    if (!guildId || !defaultRoleId || !adminRoleId || !founderRoleId) {
      return NextResponse.json({ error: "Tüm alanlar gereklidir." }, { status: 400 });
    }

    await dbConnect();

    let settings = await Settings.findOne({});
    if (settings) {
      settings.guildId = guildId;
      settings.defaultRoleId = defaultRoleId;
      settings.adminRoleId = adminRoleId;
      settings.founderRoleId = founderRoleId;
      settings.notificationChannelId = notificationChannelId || "";
      settings.topBannerUrl = topBannerUrl || "";
      settings.topBannerLink = topBannerLink || "";
      settings.bottomBannerUrl = bottomBannerUrl || "";
      settings.bottomBannerLink = bottomBannerLink || "";
      settings.updatedAt = new Date();
      await settings.save();
    } else {
      settings = await Settings.create({
        guildId,
        defaultRoleId,
        adminRoleId,
        founderRoleId,
        notificationChannelId: notificationChannelId || "",
        topBannerUrl: topBannerUrl || "",
        topBannerLink: topBannerLink || "",
        bottomBannerUrl: bottomBannerUrl || "",
        bottomBannerLink: bottomBannerLink || ""
      });
    }

    return NextResponse.json({ success: true, message: "Ayarlar başarıyla kaydedildi.", settings });
  } catch (error) {
    console.error("Settings POST Hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

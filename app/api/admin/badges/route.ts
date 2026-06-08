import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Badge from "@/models/Badge";
import User from "@/models/User";

// Helper function to check admin/mod permissions
async function hasPermission() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return false;
  return session.user.role === "admin" || session.user.role === "mod";
}

// GET: Tanımlı tüm global rozetleri döner
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const badges = await Badge.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(badges);
  } catch (error: any) {
    console.error("Global rozetler çekilirken hata:", error);
    return NextResponse.json({ error: "Rozetler yüklenirken bir hata oluştu." }, { status: 500 });
  }
}

// POST: Yeni global rozet oluşturur
export async function POST(request: NextRequest) {
  try {
    if (!(await hasPermission())) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz bulunmamaktadır." }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, color, icon } = body;

    if (!name || !description || !color || !icon) {
      return NextResponse.json({ error: "Tüm alanlar (isim, açıklama, renk, ikon) doldurulmalıdır." }, { status: 400 });
    }

    await dbConnect();

    const newBadge = await Badge.create({
      name,
      description,
      color,
      icon
    });

    return NextResponse.json(newBadge);
  } catch (error: any) {
    console.error("Global rozet oluşturma hatası:", error);
    return NextResponse.json({ error: "Rozet oluşturulurken bir hata oluştu." }, { status: 500 });
  }
}

// PUT: Global rozeti günceller
export async function PUT(request: NextRequest) {
  try {
    if (!(await hasPermission())) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz bulunmamaktadır." }, { status: 403 });
    }

    const body = await request.json();
    const { badgeId, name, description, color, icon } = body;

    if (!badgeId || !name || !description || !color || !icon) {
      return NextResponse.json({ error: "Tüm alanlar (badgeId, isim, açıklama, renk, ikon) doldurulmalıdır." }, { status: 400 });
    }

    await dbConnect();

    const updatedBadge = await Badge.findByIdAndUpdate(
      badgeId,
      { name, description, color, icon },
      { new: true }
    );

    if (!updatedBadge) {
      return NextResponse.json({ error: "Rozet bulunamadı." }, { status: 404 });
    }

    return NextResponse.json(updatedBadge);
  } catch (error: any) {
    console.error("Global rozet güncelleme hatası:", error);
    return NextResponse.json({ error: "Rozet güncellenirken bir hata oluştu." }, { status: 500 });
  }
}

// DELETE: Global rozeti siler ve kullanıcılardan referanslarını kaldırır
export async function DELETE(request: NextRequest) {
  try {
    if (!(await hasPermission())) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz bulunmamaktadır." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const badgeId = searchParams.get("badgeId");

    if (!badgeId) {
      return NextResponse.json({ error: "Rozet ID'si zorunludur." }, { status: 400 });
    }

    await dbConnect();

    // Sil
    await Badge.findByIdAndDelete(badgeId);

    // Tüm kullanıcılardan bu rozetin referansını kaldır
    await User.updateMany(
      { customBadges: badgeId },
      { $pull: { customBadges: badgeId } }
    );

    return NextResponse.json({ success: true, message: "Rozet başarıyla silindi ve kullanıcılardan kaldırıldı." });
  } catch (error: any) {
    console.error("Global rozet silme hatası:", error);
    return NextResponse.json({ error: "Rozet silinirken bir hata oluştu." }, { status: 500 });
  }
}

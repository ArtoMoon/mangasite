import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Badge from "@/models/Badge";

// Helper function to check admin/mod permissions
async function hasPermission() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return false;
  return session.user.role === "admin" || session.user.role === "mod";
}

// POST: Kullanıcıya tanımlı global rozeti atar
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    if (!(await hasPermission())) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz bulunmamaktadır." }, { status: 403 });
    }

    const body = await request.json();
    const { badgeId } = body;

    if (!badgeId) {
      return NextResponse.json({ error: "Lütfen bir Rozet ID'si belirtin." }, { status: 400 });
    }

    await dbConnect();
    
    // Rozetin varlığını doğrula
    const badgeExists = await Badge.findById(badgeId);
    if (!badgeExists) {
      return NextResponse.json({ error: "Geçersiz rozet ID'si. Bu rozet sistemde bulunmuyor." }, { status: 404 });
    }

    const user = await User.findOne({ discordId: id });
    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    if (!user.customBadges) {
      user.customBadges = [];
    }

    // Zaten atanmış mı kontrol et
    const isAlreadyAssigned = user.customBadges.some(
      (assignedId: any) => assignedId.toString() === badgeId
    );

    if (!isAlreadyAssigned) {
      user.customBadges.push(badgeId as any);
      await user.save();
    }

    const populatedUser = await User.findOne({ discordId: id }).populate("customBadges");

    return NextResponse.json({ success: true, customBadges: populatedUser?.customBadges || [] });
  } catch (error: any) {
    console.error("Kullanıcıya rozet atama hatası:", error);
    return NextResponse.json({ error: "Rozet atanırken sunucu hatası oluştu." }, { status: 500 });
  }
}

// DELETE: Kullanıcıdan rozeti geri alır (kaldırır)
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    if (!(await hasPermission())) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz bulunmamaktadır." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const badgeId = searchParams.get("badgeId");

    if (!badgeId) {
      return NextResponse.json({ error: "Rozet ID'si belirtilmelidir." }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ discordId: id });

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    user.customBadges = user.customBadges?.filter(
      (assignedId: any) => assignedId.toString() !== badgeId
    ) || [];

    await user.save();

    const populatedUser = await User.findOne({ discordId: id }).populate("customBadges");

    return NextResponse.json({ success: true, customBadges: populatedUser?.customBadges || [] });
  } catch (error: any) {
    console.error("Kullanıcıdan rozet kaldırma hatası:", error);
    return NextResponse.json({ error: "Rozet kaldırılırken sunucu hatası oluştu." }, { status: 500 });
  }
}

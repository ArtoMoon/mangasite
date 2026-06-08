import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const notifications = await Notification.find().sort({ createdAt: -1 }).lean();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      const result = notifications.map((n: any) => ({
        _id: n._id.toString(),
        title: n.title,
        message: n.message,
        senderName: n.senderName,
        createdAt: n.createdAt,
        isRead: false
      }));
      return NextResponse.json(result);
    }

    const user = await User.findById(session.user.id).select("readNotifications deletedNotifications").lean();
    const readIds = new Set(user?.readNotifications?.map((id: any) => id.toString()) || []);
    const deletedIds = new Set(user?.deletedNotifications?.map((id: any) => id.toString()) || []);

    const result = notifications
      .filter((n: any) => !deletedIds.has(n._id.toString()))
      .map((n: any) => ({
        _id: n._id.toString(),
        title: n.title,
        message: n.message,
        senderName: n.senderName,
        createdAt: n.createdAt,
        isRead: readIds.has(n._id.toString())
      }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ error: "Bildirimler yüklenirken bir hata oluştu." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user.role !== "admin" && session.user.role !== "mod")) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz bulunmamaktadır." }, { status: 403 });
    }

    const body = await request.json();
    const { title, message } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Başlık ve mesaj alanları zorunludur." }, { status: 400 });
    }

    await dbConnect();

    const newNotification = await Notification.create({
      title,
      message,
      senderName: session.user.name || "Yetkili"
    });

    return NextResponse.json(newNotification);
  } catch (error: any) {
    console.error("Notifications POST error:", error);
    return NextResponse.json({ error: "Bildirim gönderilirken bir hata oluştu." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user.role !== "admin" && session.user.role !== "mod")) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz bulunmamaktadır." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("notificationId");

    if (!notificationId) {
      return NextResponse.json({ error: "Geçersiz bildirim ID'si." }, { status: 400 });
    }

    await dbConnect();
    await Notification.findByIdAndDelete(notificationId);

    // Clean up read notifications lists
    await User.updateMany(
      { readNotifications: notificationId },
      { $pull: { readNotifications: notificationId } }
    );

    return NextResponse.json({ success: true, message: "Bildirim başarıyla silindi." });
  } catch (error: any) {
    console.error("Notifications DELETE error:", error);
    return NextResponse.json({ error: "Bildirim silinirken bir sunucu hatası oluştu." }, { status: 500 });
  }
}

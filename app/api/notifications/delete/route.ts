import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Bu işlem için giriş yapmalısınız." }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, deleteAll } = body;

    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    if (!user.deletedNotifications) {
      user.deletedNotifications = [];
    }

    if (deleteAll) {
      const allNotifications = await Notification.find({}, "_id").lean();
      const allIds = allNotifications.map((n: any) => n._id);
      user.deletedNotifications = allIds;
    } else {
      if (!notificationId) {
        return NextResponse.json({ error: "Bildirim ID'si zorunludur." }, { status: 400 });
      }

      // Avoid duplicates
      const isAlreadyDeleted = user.deletedNotifications.some(
        (id: any) => id.toString() === notificationId
      );

      if (!isAlreadyDeleted) {
        user.deletedNotifications.push(notificationId as any);
      }
    }

    await user.save();

    return NextResponse.json({ success: true, deletedNotifications: user.deletedNotifications });
  } catch (error: any) {
    console.error("Notifications delete error:", error);
    return NextResponse.json({ error: "Bildirim silinirken bir hata oluştu." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetDiscordId } = await props.params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Bu işlemi gerçekleştirmek için giriş yapmalısınız." },
        { status: 401 }
      );
    }

    const loggedInUserId = session.user.id;

    // Simple validation: Discord ID format
    if (!/^\d+$/.test(targetDiscordId)) {
      return NextResponse.json(
        { error: "Geçersiz Discord ID formatı." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find target user by discordId
    const targetUser = await User.findOne({ discordId: targetDiscordId });
    if (!targetUser) {
      return NextResponse.json(
        { error: "Takip edilmek istenen kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    const targetUserId = targetUser._id.toString();

    // Prevent following oneself
    if (loggedInUserId === targetUserId) {
      return NextResponse.json(
        { error: "Kendinizi takip edemezsiniz." },
        { status: 400 }
      );
    }

    // Determine current follow status (followers array has MongoDB _ids)
    const isFollowing = targetUser.followers.includes(
      new mongoose.Types.ObjectId(loggedInUserId) as any
    );

    if (isFollowing) {
      // Unfollow action
      await User.updateOne(
        { _id: targetUserId },
        { $pull: { followers: loggedInUserId } }
      );
      await User.updateOne(
        { _id: loggedInUserId },
        { $pull: { following: targetUserId } }
      );

      return NextResponse.json({
        success: true,
        isFollowing: false,
        message: "Kullanıcı takipten çıkarıldı.",
      });
    } else {
      // Follow action
      await User.updateOne(
        { _id: targetUserId },
        { $addToSet: { followers: loggedInUserId } }
      );
      await User.updateOne(
        { _id: loggedInUserId },
        { $addToSet: { following: targetUserId } }
      );

      return NextResponse.json({
        success: true,
        isFollowing: true,
        message: "Kullanıcı takip edilmeye başlandı.",
      });
    }
  } catch (error: any) {
    console.error("Takip etme işlemi hatası:", error);
    return NextResponse.json(
      { error: "Takip işlemi gerçekleştirilirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

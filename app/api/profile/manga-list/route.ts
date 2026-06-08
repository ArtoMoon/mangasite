import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

// POST: Add or update manga status/favorite in user's list
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Bu işlemi gerçekleştirmek için giriş yapmalısınız." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { mangaId, status, isFavorite } = body;

    if (!mangaId || !mongoose.Types.ObjectId.isValid(mangaId)) {
      return NextResponse.json(
        { error: "Geçersiz manga ID'si." },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    // Find if manga is already in list
    const existingIndex = user.mangaList.findIndex(
      (item: any) => item.mangaId.toString() === mangaId
    );

    if (existingIndex > -1) {
      // Update existing entry
      if (status !== undefined) {
        user.mangaList[existingIndex].status = status;
      }
      if (isFavorite !== undefined) {
        user.mangaList[existingIndex].isFavorite = isFavorite;
      }
    } else {
      // Create new entry
      user.mangaList.push({
        mangaId: new mongoose.Types.ObjectId(mangaId),
        status: status || "Okuyor",
        isFavorite: isFavorite || false,
      });
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Manga listeniz başarıyla güncellendi.",
      mangaList: user.mangaList,
    });
  } catch (error: any) {
    console.error("Manga listesi güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Liste güncellenirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

// DELETE: Remove a manga from user's list
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Bu işlemi gerçekleştirmek için giriş yapmalısınız." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mangaId = searchParams.get("mangaId");

    if (!mangaId || !mongoose.Types.ObjectId.isValid(mangaId)) {
      return NextResponse.json(
        { error: "Geçersiz manga ID'si." },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    // Pull item from array
    user.mangaList = user.mangaList.filter(
      (item: any) => item.mangaId.toString() !== mangaId
    );

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Manga listenizden kaldırıldı.",
      mangaList: user.mangaList,
    });
  } catch (error: any) {
    console.error("Manga listesinden kaldırma hatası:", error);
    return NextResponse.json(
      { error: "Manga listeden kaldırılırken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

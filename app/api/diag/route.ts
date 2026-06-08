import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Manga from "@/models/Manga";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const mangas = await Manga.find({}, "title status scheduleDay");
    return NextResponse.json({ success: true, mangas });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}

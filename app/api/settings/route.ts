export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";

export async function GET() {
  try {
    await dbConnect();
    const settings = await Settings.findOne({});
    if (!settings) {
      return NextResponse.json({
        topBannerUrl: "",
        topBannerLink: "",
        bottomBannerUrl: "",
        bottomBannerLink: ""
      });
    }
    return NextResponse.json({
      topBannerUrl: settings.topBannerUrl || "",
      topBannerLink: settings.topBannerLink || "",
      bottomBannerUrl: settings.bottomBannerUrl || "",
      bottomBannerLink: settings.bottomBannerLink || ""
    });
  } catch (error) {
    console.error("Public settings GET Hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

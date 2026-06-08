import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Report from "@/models/Report";

// DELETE: Hata bildirimini siler (Sadece Admin / Mod)
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const session = await getServerSession(authOptions);

    // Yetki kontrolü (admin veya mod)
    if (!session || !session.user || (session.user.role !== "admin" && session.user.role !== "mod")) {
      return NextResponse.json(
        { error: "Bu işlemi gerçekleştirmek için yetkiniz olmalıdır." },
        { status: 403 }
      );
    }

    await dbConnect();

    const deletedReport = await Report.findByIdAndDelete(id);

    if (!deletedReport) {
      return NextResponse.json(
        { error: "Silinecek hata bildirimi bulunamadı." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Hata bildirimi başarıyla silindi."
    });
  } catch (error: any) {
    console.error("Hata bildirimi silme hatası:", error);
    return NextResponse.json(
      { error: "Hata bildirimi silinirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

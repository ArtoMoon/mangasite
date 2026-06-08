import { NextResponse } from "next/server";
import { fetchGuildChannels } from "@/lib/discord";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const guildId = searchParams.get("guildId");

  if (!guildId) {
    return NextResponse.json({ error: "guildId parametresi gereklidir." }, { status: 400 });
  }

  const channels = await fetchGuildChannels(guildId);

  // Sadece metin kanallarını filtrele (type 0 = GUILD_TEXT)
  const textChannels = channels
    .filter((ch: any) => ch.type === 0)
    .sort((a: any, b: any) => a.position - b.position)
    .map((ch: any) => ({ id: ch.id, name: ch.name }));

  return NextResponse.json(textChannels);
}

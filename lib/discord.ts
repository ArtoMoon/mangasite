import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!DISCORD_BOT_TOKEN) {
  console.warn("Lütfen .env.local dosyasında DISCORD_BOT_TOKEN tanımlayın.");
}

async function getGuildId(): Promise<string> {
  try {
    await dbConnect();
    const dbSettings = await Settings.findOne({});
    return dbSettings?.guildId || process.env.DISCORD_GUILD_ID || "";
  } catch (err) {
    console.error("Guild ID yükleme hatası:", err);
    return process.env.DISCORD_GUILD_ID || "";
  }
}

/**
 * Discord sunucusundaki kullanıcıya rol ekler.
 * PUT /guilds/{guild.id}/members/{user.id}/roles/{role.id}
 */
export async function assignDiscordRole(discordUserId: string, roleId: string): Promise<boolean> {
  const guildId = await getGuildId();
  if (!DISCORD_BOT_TOKEN || !guildId) {
    console.error("Discord API Hatası: DISCORD_BOT_TOKEN veya guildId eksik.");
    return false;
  }

  const url = `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`;

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      console.log(`Discord Rolü başarıyla atandı. Kullanıcı: ${discordUserId}, Rol: ${roleId}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`Discord Rol atanamadı. Durum: ${response.status}, Hata: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error("Discord API rol ekleme hatası:", error);
    return false;
  }
}

/**
 * Discord sunucusundaki kullanıcıdan rolü kaldırır.
 * DELETE /guilds/{guild.id}/members/{user.id}/roles/{role.id}
 */
export async function removeDiscordRole(discordUserId: string, roleId: string): Promise<boolean> {
  const guildId = await getGuildId();
  if (!DISCORD_BOT_TOKEN || !guildId) {
    console.error("Discord API Hatası: DISCORD_BOT_TOKEN veya guildId eksik.");
    return false;
  }

  const url = `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`;

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      console.log(`Discord Rolü başarıyla kaldırıldı. Kullanıcı: ${discordUserId}, Rol: ${roleId}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`Discord Rol kaldırılamadı. Durum: ${response.status}, Hata: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error("Discord API rol kaldırma hatası:", error);
    return false;
  }
}

// Memory cache for Discord requests to avoid Rate Limit (429) errors.
// Cache TTL is set to 2 minutes.
const CACHE_TTL_MS = 2 * 60 * 1000;

const rolesCache = new Map<string, { roles: string[]; timestamp: number }>();
const guildsCache = { data: [] as any[], timestamp: 0 };
const rolesCacheMap = new Map<string, { data: any[]; timestamp: number }>();
const channelsCacheMap = new Map<string, { data: any[]; timestamp: number }>();

/**
 * Kullanıcının Discord sunucusunda yönetici (admin) rolüne sahip olup olmadığını sorgular.
 * GET /guilds/{guild.id}/members/{user.id}
 */
export async function checkDiscordAdmin(discordUserId: string, adminRoleId?: string): Promise<boolean> {
  const activeAdminRoleId = adminRoleId || process.env.DISCORD_ADMIN_ROLE_ID;
  const guildId = await getGuildId();

  if (!DISCORD_BOT_TOKEN || !guildId || !activeAdminRoleId) {
    console.error("Discord API Hatası: DISCORD_BOT_TOKEN, guildId veya activeAdminRoleId eksik.");
    return false;
  }

  const now = Date.now();
  const cached = rolesCache.get(discordUserId);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.roles.includes(activeAdminRoleId);
  }

  const url = `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const userRoles: string[] = data.roles || [];
      rolesCache.set(discordUserId, { roles: userRoles, timestamp: now });
      return userRoles.includes(activeAdminRoleId);
    } else {
      const errorText = await response.text();
      console.error(`Discord üye bilgisi çekilemedi. Durum: ${response.status}, Hata: ${errorText}`);
      
      if (response.status === 429) {
        console.warn("Discord API 429 Rate Limited. Eski önbellek kullanılıyor (varsa).");
      }
      
      // Fallback to cached roles if available
      if (cached) {
        return cached.roles.includes(activeAdminRoleId);
      }
      return false;
    }
  } catch (error) {
    console.error("Discord API admin rol sorgulama hatası:", error);
    if (cached) {
      return cached.roles.includes(activeAdminRoleId);
    }
    return false;
  }
}

/**
 * Botun ekli olduğu tüm Discord sunucularını (guilds) listeler.
 * GET /users/@me/guilds
 */
export async function fetchBotGuilds(): Promise<any[]> {
  if (!DISCORD_BOT_TOKEN) {
    console.error("Discord API Hatası: DISCORD_BOT_TOKEN eksik.");
    return [];
  }

  const now = Date.now();
  if (guildsCache.timestamp && now - guildsCache.timestamp < CACHE_TTL_MS) {
    return guildsCache.data;
  }

  const url = "https://discord.com/api/v10/users/@me/guilds";

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      guildsCache.data = data;
      guildsCache.timestamp = now;
      return data;
    } else {
      const errorText = await response.text();
      console.error(`Discord sunucuları çekilemedi. Durum: ${response.status}, Hata: ${errorText}`);
      if (guildsCache.timestamp) return guildsCache.data;
      return [];
    }
  } catch (error) {
    console.error("Discord API sunucuları çekme hatası:", error);
    if (guildsCache.timestamp) return guildsCache.data;
    return [];
  }
}

/**
 * Belirli bir sunucudaki tüm rolleri listeler.
 * GET /guilds/{guildId}/roles
 */
export async function fetchGuildRoles(guildId: string): Promise<any[]> {
  if (!DISCORD_BOT_TOKEN) {
    console.error("Discord API Hatası: DISCORD_BOT_TOKEN eksik.");
    return [];
  }

  const now = Date.now();
  const cached = rolesCacheMap.get(guildId);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `https://discord.com/api/v10/guilds/${guildId}/roles`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      rolesCacheMap.set(guildId, { data, timestamp: now });
      return data;
    } else {
      const errorText = await response.text();
      console.error(`Discord sunucu rolleri çekilemedi. Durum: ${response.status}, Hata: ${errorText}`);
      if (cached) return cached.data;
      return [];
    }
  } catch (error) {
    console.error("Discord API rolleri çekme hatası:", error);
    if (cached) return cached.data;
    return [];
  }
}

/**
 * Discord sunucusundaki belirli bir kanala mesaj gönderir.
 * POST /channels/{channelId}/messages
 */
export async function sendDiscordChannelMessage(channelId: string, content: string): Promise<boolean> {
  if (!DISCORD_BOT_TOKEN) {
    console.error("Discord API Hatası: DISCORD_BOT_TOKEN eksik.");
    return false;
  }

  const url = `https://discord.com/api/v10/channels/${channelId}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (response.ok) {
      console.log(`Discord kanalına başarıyla mesaj gönderildi. Kanal: ${channelId}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`Discord kanalına mesaj gönderilemedi. Durum: ${response.status}, Hata: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error("Discord API kanala mesaj gönderme hatası:", error);
    return false;
  }
}

/**
 * Belirli bir sunucudaki tüm kanalları listeler.
 * GET /guilds/{guildId}/channels
 */
export async function fetchGuildChannels(guildId: string): Promise<any[]> {
  if (!DISCORD_BOT_TOKEN) {
    console.error("Discord API Hatası: DISCORD_BOT_TOKEN eksik.");
    return [];
  }

  const now = Date.now();
  const cached = channelsCacheMap.get(guildId);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `https://discord.com/api/v10/guilds/${guildId}/channels`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      channelsCacheMap.set(guildId, { data, timestamp: now });
      return data;
    } else {
      const errorText = await response.text();
      console.error(`Discord kanalları çekilemedi. Durum: ${response.status}, Hata: ${errorText}`);
      if (cached) return cached.data;
      return [];
    }
  } catch (error) {
    console.error("Discord API kanalları çekme hatası:", error);
    if (cached) return cached.data;
    return [];
  }
}



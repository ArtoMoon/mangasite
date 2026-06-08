import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import dbConnect from "./mongodb";
import User from "../models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
      authorization: { params: { scope: "identify email guilds.join" } },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "discord" && profile) {
        await dbConnect();
        
        // Discord profile id is the user's unique Discord Snowflake ID.
        const discordId = (profile as any).id || account.providerAccountId;
        
        // Discord sunucusundaki rolleri kontrol et
        const { checkDiscordAdmin } = await import("./discord");
        const Settings = (await import("../models/Settings")).default;
        
        const dbSettings = await Settings.findOne({});
        const founderRoleId = dbSettings?.founderRoleId || process.env.DISCORD_FOUNDER_ROLE_ID;
        const adminRoleId = dbSettings?.adminRoleId || process.env.DISCORD_ADMIN_ROLE_ID;
        const ownerUserId = process.env.DISCORD_OWNER_ID;

        const isFounder = founderRoleId ? await checkDiscordAdmin(discordId, founderRoleId) : false;
        const isAdmin = adminRoleId ? await checkDiscordAdmin(discordId, adminRoleId) : false;
        const isOwnerUser = ownerUserId && discordId === ownerUserId;
        
        let calculatedRole = "user";
        if (isFounder || isOwnerUser) {
          calculatedRole = "admin";
        } else if (isAdmin) {
          calculatedRole = "mod";
        }

        const userEmail = user.email || (profile as any).email || "";
        let existingUser = await User.findOne({ email: userEmail });
        
        if (!existingUser) {
          existingUser = await User.create({
            name: user.name || (profile as any).username || "Kullanıcı",
            email: userEmail,
            image: user.image || undefined,
            discordId: discordId,
            role: calculatedRole,
          });
        } else {
          // Güncelleme işlemi
          existingUser.discordId = discordId;
          existingUser.role = calculatedRole; // Rolü her girişte güncelliyoruz
          if (user.image) existingUser.image = user.image;
          await existingUser.save();
        }
        
        user.id = existingUser._id.toString();
        user.role = existingUser.role;
        user.discordId = existingUser.discordId;
      }
      return true;
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.discordId = user.discordId;
      }

      // Discord sunucusundan canlı olarak rol durumunu çek (anlık güncellenmesi için)
      if (token.discordId) {
        try {
          const { checkDiscordAdmin } = await import("./discord");
          const Settings = (await import("../models/Settings")).default;
          
          const dbSettings = await Settings.findOne({});
          const founderRoleId = dbSettings?.founderRoleId || process.env.DISCORD_FOUNDER_ROLE_ID;
          const adminRoleId = dbSettings?.adminRoleId || process.env.DISCORD_ADMIN_ROLE_ID;
          const ownerUserId = process.env.DISCORD_OWNER_ID;

          const isFounder = founderRoleId ? await checkDiscordAdmin(token.discordId as string, founderRoleId) : false;
          const isAdmin = adminRoleId ? await checkDiscordAdmin(token.discordId as string, adminRoleId) : false;
          const isOwnerUser = ownerUserId && (token.discordId as string) === ownerUserId;

          let calculatedRole = "user";
          if (isFounder || isOwnerUser) {
            calculatedRole = "admin";
          } else if (isAdmin) {
            calculatedRole = "mod";
          }

          token.role = calculatedRole;

          // Veritabanını da güncel tutalım
          await dbConnect();
          await User.updateOne({ discordId: token.discordId }, { role: calculatedRole });
        } catch (err) {
          console.error("Discord canlı rol sorgulama hatası:", err);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken;
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.user.discordId = token.discordId as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

import mongoose, { Schema, Document, model, models } from "mongoose";

export interface ISettings extends Document {
  guildId: string;
  defaultRoleId: string;
  adminRoleId: string;
  founderRoleId: string;
  notificationChannelId?: string;
  topBannerUrl?: string;
  topBannerLink?: string;
  bottomBannerUrl?: string;
  bottomBannerLink?: string;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>({
  guildId: { type: String, required: true },
  defaultRoleId: { type: String, required: true },
  adminRoleId: { type: String, required: true },
  founderRoleId: { type: String, required: true },
  notificationChannelId: { type: String, default: "" },
  topBannerUrl: { type: String, default: "" },
  topBannerLink: { type: String, default: "" },
  bottomBannerUrl: { type: String, default: "" },
  bottomBannerLink: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now }
});

if (models.Settings) {
  delete (models as any).Settings;
}

export default model<ISettings>("Settings", SettingsSchema);


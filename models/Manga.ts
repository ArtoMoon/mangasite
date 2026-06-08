import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IManga extends Document {
  title: string;
  description: string;
  coverImage: string; // Base64 kodlanmış görsel verisi
  bannerImage?: string; // Base64 kodlanmış arka plan görseli
  author: string;
  artist?: string;
  genres: string[];
  status: "Devam Ediyor" | "Tamamlandı" | "Ara Verildi";
  releaseYear: number;
  discordRoleId?: string;
  totalStars: number;
  totalRatings: number;
  views: number;
  createdAt: Date;
}

const MangaSchema = new Schema<IManga>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  coverImage: { type: String, required: true }, // Doğrudan base64 kaydedilecek
  bannerImage: { type: String }, // Doğrudan base64 kaydedilecek
  author: { type: String, required: true },
  artist: { type: String },
  genres: [{ type: String, required: true }],
  status: { 
    type: String, 
    enum: ["Devam Ediyor", "Tamamlandı", "Ara Verildi"], 
    default: "Devam Ediyor" 
  },
  releaseYear: { type: Number, required: true },
  discordRoleId: { type: String },
  totalStars: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default models.Manga || model<IManga>("Manga", MangaSchema);

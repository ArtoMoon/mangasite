import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IRatedItem {
  targetId: mongoose.Types.ObjectId;
  rating: number;
}

export interface IMangaListItem {
  mangaId: mongoose.Types.ObjectId;
  status: "Okuyor" | "Okuyacak" | "Okudu";
  isFavorite: boolean;
}

export interface ICustomBadge {
  _id?: any;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  role?: string;
  discordId?: string; // Discord User ID (providerAccountId)
  ratedMangas: IRatedItem[];
  ratedChapters: IRatedItem[];
  subscribedMangas: mongoose.Types.ObjectId[];
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  mangaList: IMangaListItem[];
  xp: number;
  level: number;
  readChapters: mongoose.Types.ObjectId[];
  customBadges?: mongoose.Types.ObjectId[];
  readNotifications?: mongoose.Types.ObjectId[];
  deletedNotifications?: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  image: { type: String },
  role: { type: String, default: "user" },
  discordId: { type: String },
  ratedMangas: [
    {
      targetId: { type: Schema.Types.ObjectId, ref: "Manga", required: true },
      rating: { type: Number, required: true, min: 1, max: 5 }
    }
  ],
  ratedChapters: [
    {
      targetId: { type: Schema.Types.ObjectId, ref: "Chapter", required: true },
      rating: { type: Number, required: true, min: 1, max: 5 }
    }
  ],
  subscribedMangas: [
    { type: Schema.Types.ObjectId, ref: "Manga" }
  ],
  followers: [
    { type: Schema.Types.ObjectId, ref: "User" }
  ],
  following: [
    { type: Schema.Types.ObjectId, ref: "User" }
  ],
  mangaList: [
    {
      mangaId: { type: Schema.Types.ObjectId, ref: "Manga", required: true },
      status: { type: String, enum: ["Okuyor", "Okuyacak", "Okudu"], default: "Okuyor" },
      isFavorite: { type: Boolean, default: false }
    }
  ],
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  readChapters: [
    { type: Schema.Types.ObjectId, ref: "Chapter" }
  ],
  customBadges: [
    { type: Schema.Types.ObjectId, ref: "Badge" }
  ],
  readNotifications: [
    { type: Schema.Types.ObjectId, ref: "Notification" }
  ],
  deletedNotifications: [
    { type: Schema.Types.ObjectId, ref: "Notification" }
  ],
  createdAt: { type: Date, default: Date.now }
});

if (models.User) {
  delete (models as any).User;
}

export default model<IUser>("User", UserSchema);

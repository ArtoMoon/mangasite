import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IChapter extends Document {
  mangaId: mongoose.Types.ObjectId;
  title: string;
  pages: string[]; // List of page URLs
  totalStars: number;
  totalRatings: number;
  createdAt: Date;
}

const ChapterSchema = new Schema<IChapter>({
  mangaId: { type: Schema.Types.ObjectId, ref: "Manga", required: true },
  title: { type: String, required: true },
  pages: [{ type: String, required: true }],
  totalStars: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default models.Chapter || model<IChapter>("Chapter", ChapterSchema);

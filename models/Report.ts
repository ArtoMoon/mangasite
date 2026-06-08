import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IReport extends Document {
  mangaId: mongoose.Types.ObjectId;
  chapterId?: mongoose.Types.ObjectId;
  reportedBy: string;
  message: string;
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>({
  mangaId: { type: Schema.Types.ObjectId, ref: "Manga", required: true },
  chapterId: { type: Schema.Types.ObjectId, ref: "Chapter" },
  reportedBy: { type: String, default: "Misafir" },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

if (models.Report) {
  delete (models as any).Report;
}

export default model<IReport>("Report", ReportSchema);

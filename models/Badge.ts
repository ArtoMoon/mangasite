import mongoose, { Schema, Document } from "mongoose";

export interface IBadge extends Document {
  name: string;
  description: string;
  color: string;
  icon: string;
  createdAt: Date;
}

const BadgeSchema = new Schema<IBadge>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  color: { type: String, required: true },
  icon: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Badge || mongoose.model<IBadge>("Badge", BadgeSchema);

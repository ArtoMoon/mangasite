import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  title: string;
  message: string;
  senderName: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  title: { type: String, required: true },
  message: { type: String, required: true },
  senderName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Avoid re-compiling the model if it exists
export default mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

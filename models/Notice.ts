// models/Notice.ts
import { Schema, model, Document } from "mongoose";

export interface INotice extends Document {
  title: string;
  content: string;
  severity: "info" | "success" | "warning" | "error";
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const noticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    severity: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// _id → id 변환 + 불필요한 필드 제거
noticeSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc: INotice, ret: Partial<INotice & { _id: any; id?: string }>) => {
    if (ret._id) {
      ret.id = ret._id.toString();
    }
    delete ret._id;
  },
});

export default model<INotice>("Notice", noticeSchema);

import mongoose, { Schema, Types, Document } from "mongoose";

export interface ITrade extends Document {
  type: "삽니다" | "팝니다";
  mapName: string;
  subMap: string;
  price: number;
  description?: string;
  isCompleted: boolean;
  status: "거래가능" | "예약중" | "거래완료" | "거래중";
  userId: Types.ObjectId;
  username?: string;
  avatar?: string;
  createdAt: Date;
  completedAt: Date;
  reservedBy?: Types.ObjectId | null;
}

const TradeSchema = new Schema<ITrade>({
  type: { type: String, enum: ["삽니다", "팝니다"], required: true },
  mapName: { type: String, required: true },
  subMap: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["거래가능", "예약중", "거래완료", "거래중"],
    default: "거래중",
  },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now },
  reservedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
});

export default mongoose.model<ITrade>("Trade", TradeSchema);

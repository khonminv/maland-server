import mongoose, { Schema } from "mongoose";

const TradeSchema = new mongoose.Schema({
  type: { type: String, enum: ["삽니다", "팝니다"], required: true },
  mapName: { type: String, required: true },
  subMap: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  isCompleted: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["거래가능", "예약중", "거래완료", "거래중"],
    default: "거래가능",
  },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now },
  reservedBy: { type: String, default: null }
});

export default mongoose.model("Trade", TradeSchema);

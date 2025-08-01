// models/Trade.ts
import mongoose from "mongoose";

const TradeSchema = new mongoose.Schema({
  mapName: { type: String, required: true },
  subMap: { type: String, required: true }, // 수정됨
  price: { type: Number, required: true },
  description: { type: String },
  isCompleted: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["거래가능", "예약중", "거래완료","대기중"],
    default: "거래가능",
  },
  userId: { type: String, required: true }, // 디스코드 사용자 ID
  createdAt: { type: Date, default: Date.now },
});


export default mongoose.model("Trade", TradeSchema);

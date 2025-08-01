// models/Trade.ts
import mongoose from "mongoose";

const TradeSchema = new mongoose.Schema({
  type: { type: String, enum: ["삽니다", "팝니다"], required: true },
  mapName: { type: String, required: true },
  subMap: { type: String, required: true }, // 수정됨
  price: { type: Number, required: true },
  description: { type: String },
  isCompleted: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["거래가능", "예약중", "거래완료", "대기중"],
    default: "거래가능",
  },
  userId: { type: String, required: true }, 
  username: { type: String }, 
  avatar: { type: String },  
  createdAt: { type: Date, default: Date.now },
});


export default mongoose.model("Trade", TradeSchema);

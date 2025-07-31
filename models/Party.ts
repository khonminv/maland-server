// models/Party.ts
import mongoose from "mongoose";

const partySchema = new mongoose.Schema(
  {
    mapName: { type: String, required: true }, // 예: "리프레"
    title: { type: String, required: true },
    description: String,
    userId: { type: String, required: true },
    type: { type: String, enum: ["사냥", "보스", "기타"], default: "기타" }, // 선택지 분류
    maxMember: { type: Number, default: 6 },
    currentMember: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.model("Party", partySchema);

import mongoose from "mongoose";

const PartySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  map: { type: String, required: true },
  subMap: { type: String, required: true },
  positions: [{ type: String, required: true }],
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isClosed: { type: Boolean, default: false },
  applicants: [
    {
      discordId: { type: String, required: true },
      username: { type: String, required: true },
      avatar: { type: String },
      job: { type: String },
      level: { type: Number },
      appliedAt: { type: Date, default: Date.now },
      message: { type: String, default: "" },
      positions: [{ type: String, required: true }], // ✅ 이 부분 추가!
    },
  ],
});


const Party = mongoose.models.Party || mongoose.model("Party", PartySchema);

export default Party;

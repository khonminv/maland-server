import mongoose from "mongoose";

const PartySchema = new mongoose.Schema({
  map: { type: String, required: true },
  subMap: { type: String, required: true },
  positions: [{ type: String, required: true }],
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Party = mongoose.models.Party || mongoose.model("Party", PartySchema);

export default Party;

// models/User.ts
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  username: String,
  avatar: String,
  job: { type: String, default: "작업 선택" },
  level: { type: Number, default: 0 },
});

// ❌ 문제 지점
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;

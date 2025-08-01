// models/User.ts
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  username: String,
  avatar: String,
});

// ❌ 문제 지점
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;

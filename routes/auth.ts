import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import User from "../models/User"; // 유저 모델 import

dotenv.config();

const router = express.Router();

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI!;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "토큰 없음" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "토큰 없음" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const user = await User.findById(decoded.id).select("-__v -password");
    if (!user) return res.status(404).json({ message: "유저 없음" });

    res.json(user);
  } catch (err) {
    res.status(401).json({ message: "유효하지 않은 토큰" });
  }
});

router.get("/discord/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).send("코드 없음");

  try {
    // 1. Access Token 요청
    const tokenRes = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token } = tokenRes.data;

    // 2. 유저 정보 요청
    const userRes = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const user = userRes.data;

    // 3. DB에 저장 (있으면 업데이트, 없으면 생성)
    const savedUser = await User.findOneAndUpdate(
      { discordId: user.id },
      {
        discordId: user.id,
        username: user.username,
        avatar: user.avatar,
      },
      { upsert: true, new: true }
    );

    // 4. JWT 토큰 생성
    const token = jwt.sign(
      {
        id: savedUser._id,
        username: savedUser.username,
        discordId: savedUser.discordId,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // 5. 프론트로 리디렉션 (토큰 포함)
    res.redirect(`${FRONTEND_URL}/?token=${token}`);
  } catch (err: any) {
    console.error("디스코드 로그인 실패", err.response?.data || err.message || err);
    res.status(500).send("로그인 실패");
  }
});

export default router;

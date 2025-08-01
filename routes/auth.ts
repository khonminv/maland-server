// routes/auth.ts
import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI!;

// 1. 로그인 시작 (프론트에서 직접 Discord 로그인 URL로 이동)
router.get("/discord/callback", async (req, res) => {
  const code = req.query.code as string;
  console.log("콜백 도착, code:", code); // 콜백 도착 여부 확인

  if (!code) return res.status(400).send("코드 없음");

  try {
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

    console.log("토큰 응답:", tokenRes.data); // 토큰 응답 확인

    const { access_token } = tokenRes.data;

    const userRes = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const user = userRes.data;
    console.log("디스코드 유저:", user);

    res.redirect(`http://localhost:3000/auth/success?username=${user.username}`);
  } catch (err: any) {
    console.error("디스코드 로그인 실패", err.response?.data || err.message || err);
    res.status(500).send("로그인 실패");
  }
});

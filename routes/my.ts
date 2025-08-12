import express from "express";
import mongoose from "mongoose";
import Trade from "../models/Trade";
import Party from "../models/Party";
import User from "../models/User";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/auth";

const router = express.Router();

/**
 * @route GET /api/my
 * @desc 내 거래글 / 파티글 / 유저 정보 조회 + 관리자 여부
 */
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userIdStr = req.user?.id;

    if (!userIdStr) {
      return res.status(401).json({ error: "인증된 사용자 정보가 없습니다." });
    }

    const userId = new mongoose.Types.ObjectId(userIdStr);

    // 유저 정보 조회
    const myUser = await User.findById(userId);
    if (!myUser) {
      return res.status(404).json({ error: "유저를 찾을 수 없습니다." });
    }

    // 거래글 / 파티글 조회
    const [myTrades, myParties] = await Promise.all([
      Trade.find({ userId }).sort({ createdAt: -1 }),
      Party.find({ userId }).sort({ createdAt: -1 }),
    ]);

    // ✅ 관리자 판별
    const adminSet = new Set(
      (process.env.ADMIN_IDS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
    const isAdmin = adminSet.has(myUser.discordId);

    // 응답
    res.json({
      trades: myTrades,
      parties: myParties,
      user: {
        username: myUser.username || "",
        discordId: myUser.discordId || "",
        avatar: myUser.avatar || "",
        job: myUser.job || "",
        level: myUser.level || 0,
        isAdmin, // ✅ 관리자 여부 포함
      },
    });
  } catch (error) {
    console.error("내 거래글 조회 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

/**
 * @route PUT /api/my/update
 * @desc 내 정보 수정 (직업, 레벨)
 */
router.put("/update", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { job, level } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "인증된 사용자 정보가 없습니다." });
    }

    await User.findByIdAndUpdate(userId, { job, level });

    res.json({ message: "업데이트 성공" });
  } catch (error) {
    console.error("내 정보 업데이트 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

export default router;

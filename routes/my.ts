import express from "express";
import mongoose from "mongoose";
import Trade from "../models/Trade";
import Party from "../models/Party";
import User from "../models/User";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/auth";

const router = express.Router();

// /api/my → 내 거래글 목록 조회


router.get("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userIdStr = req.user?.id;

    if (!userIdStr) {
      return res.status(401).json({ error: "인증된 사용자 정보가 없습니다." });
    }
    const userId = new mongoose.Types.ObjectId(userIdStr);
    const myUser = await User.findById(userId);
    const myTrades = await Trade.find({ userId }).sort({ createdAt: -1 });
    const myParties = await Party.find({ userId }).sort({ createdAt: -1 });

    res.json({
      trades: myTrades,
      parties: myParties,
      user: {
        username: myUser?.username || "",
        discordId: myUser?.discordId || "",
        avatar: myUser?.avatar || "",
        job: myUser?.job || "",
        level: myUser?.level || 0,
      },
    });
  } catch (error) {
    console.error("내 거래글 조회 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});
// /api/my.ts (또는 my/index.ts)
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

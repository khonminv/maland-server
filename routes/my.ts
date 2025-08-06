import express from "express";
import mongoose from "mongoose";
import Trade from "../models/Trade";
import Party from "../models/Party";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/auth";

const router = express.Router();

// /api/my → 내 거래글 목록 조회
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "인증된 사용자 정보가 없습니다." });
    }

    // 내 일반 거래글 조회
    const myTrades = await Trade.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });
    const myPartys = await Party.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });
   
    res.json({
      trades: myTrades,
      partys: myPartys,
    });
  } catch (error) {
    console.error("내 거래글 조회 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

export default router;

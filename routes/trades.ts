import express from "express";
import mongoose, { Types } from "mongoose";
import Trade from "../models/Trade";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/auth";

const router = express.Router();

interface QueryParams {
  status?: string;
  search?: string;
}

// 평균 가격 조회 시 completedAt 기준 필터링
router.get("/average-prices-by-submap", async (req, res) => {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const result = await Trade.aggregate([
      {
        $match: {
          isCompleted: true,
          completedAt: { $gte: twoHoursAgo }, // 완료 시점 기준으로 필터링
          subMap: { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: { mapName: "$mapName", subMap: "$subMap" },
          avgPrice: { $avg: "$price" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.mapName": 1, "_id.subMap": 1 } },
    ]);

    res.json(result);
  } catch (error) {
    console.error("[ERROR] 평균 가격 조회 실패:", error);
    res.status(500).json({ error: "서버 오류" });
  }
});


router.get("/", async (req, res) => {
  try {
    const { status, search } = req.query as QueryParams;

    const query: Record<string, any> = {};
    if (status) query.status = status;
    if (search) query.mapName = { $regex: search, $options: "i" };

    // reservedBy를 User 컬렉션에서 필요한 필드만 가져오도록 populate
    const trades = await Trade.find(query)
  .populate({ path: "reservedBy", select: "discordId username avatar" })
  .populate({ path: "userId", select: "discordId username avatar" }) // ← 작성자 정보 불러오기
  .sort({ createdAt: -1 });

const tradesWithAuthor = trades.map((trade) => {
  const tradeObj = trade.toObject() as any;
  tradeObj.author = {
    username: tradeObj.userId?.username,
    avatar: tradeObj.userId?.avatar,
    discordId: tradeObj.userId?.discordId, // ← 여기서 Discord ID 사용
  };

  delete tradeObj.userId; // 원본 ObjectId 필드 제거
  return tradeObj;
});

res.json(tradesWithAuthor);

  } catch (error) {
    console.error("[ERROR] 거래 목록 조회 실패:", error);
    res.status(500).json({ error: "서버 오류" });
  }
});


// 거래 등록 (인증 필요)
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { mapName, subMap, type, price, description } = req.body;
    const user = req.user;

    if (!mapName || !subMap || !type || price === undefined || !user) {
      return res.status(400).json({ error: "필수 항목이 누락되었습니다." });
    }

    if (!["삽니다", "팝니다"].includes(type)) {
      return res.status(400).json({ error: "type 값이 올바르지 않습니다." });
    }

    const priceNum = Number(price);
    if (isNaN(priceNum)) {
      return res.status(400).json({ error: "가격은 숫자여야 합니다." });
    }

    const newTrade = new Trade({
      mapName,
      subMap,
      type,
      price: priceNum,
      description: description || "",
      status: "거래가능",
      isCompleted: false,
      userId: new Types.ObjectId(user.id),
      username: user.username,
      avatar: user.avatar,
    });

    await newTrade.save();
    res.status(201).json(newTrade);
  } catch (error) {
    console.error("[ERROR] 거래 등록 실패:", error);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 거래 상태 변경
router.patch("/:id/status", async (req, res) => {
  const { status } = req.body;
  if (!["거래가능", "예약중", "거래완료", "거래중"].includes(status)) {
    return res.status(400).json({ error: "유효하지 않은 상태값입니다." });
  }

  const updateData: any = { status };
  if (status === "거래완료") {
    updateData.isCompleted = true;
    updateData.completedAt = new Date(); // 완료 시점 기록
  } else {
    updateData.isCompleted = false;
    updateData.completedAt = null;
  }

  const trade = await Trade.findByIdAndUpdate(req.params.id, updateData, { new: true });
  if (!trade) return res.status(404).json({ error: "해당 거래를 찾을 수 없습니다." });

  res.json(trade);
});

// 거래 예약 취소 (예약자 본인만 가능)
router.post("/:id/cancel-reserve", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "인증되지 않은 사용자입니다." });
    }

    const tradeId = req.params.id;

    const trade = await Trade.findById(tradeId);

    if (!trade) {
      return res.status(404).json({ error: "해당 거래를 찾을 수 없습니다." });
    }

    if (!trade.reservedBy || trade.reservedBy.toString() !== user.id) {
      return res.status(403).json({ error: "본인의 예약만 취소할 수 있습니다." });
    }

    if (trade.status !== "거래중") {
      return res.status(400).json({ error: "예약된 거래가 아닙니다." });
    }

    trade.status = "거래가능";
    trade.reservedBy = null; // null 허용 타입이어야 합니다.

    await trade.save();

    res.json({ message: "예약이 취소되었습니다.", trade });
  } catch (error) {
    console.error("[ERROR] 거래 예약 취소 실패:", error);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 거래 삭제
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Trade.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "해당 거래를 찾을 수 없습니다." });
    }

    res.json({ message: "삭제되었습니다." });
  } catch (error) {
    console.error("[ERROR] 거래 삭제 실패:", error);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 거래 신청 (1인 1건)
router.post("/:id/reserve", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "인증되지 않은 사용자입니다." });
    }
    const tradeId = req.params.id;

    const existingReservation = await Trade.findOne({
      reservedBy: new Types.ObjectId(user.id),
      status: "거래중",
    });

    if (existingReservation) {
      return res.status(400).json({ error: "이미 예약한 거래가 있습니다." });
    }

    const trade = await Trade.findById(tradeId);
    if (!trade || trade.status !== "거래가능") {
      return res.status(400).json({ error: "이 거래는 신청할 수 없습니다." });
    }

    trade.status = "거래중";
    trade.reservedBy = new Types.ObjectId(user.id);
    await trade.save();

    res.json(trade);
  } catch (error) {
    console.error("[ERROR] 거래 신청 실패:", error);
    res.status(500).json({ error: "서버 오류" });
  }
});

export default router;

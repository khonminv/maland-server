import express from "express";
import Trade from "../models/Trade";
import { getAveragePrices } from "../controllers/tradeController";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/auth";

const router = express.Router();

// ✅ 평균 가격 조회 (최근 2시간, 거래완료만)
router.get("/average-prices-by-submap", async (req, res) => {
  console.log("[LOG] GET /trades/average-prices-by-submap");
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const result = await Trade.aggregate([
      {
        $match: {
          isCompleted: true,
          createdAt: { $gte: twoHoursAgo },
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

/// ✅ 거래 전체 목록 조회
router.get("/", async (req, res) => {
  try {
    const { status, search } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (search) query.mapName = { $regex: search, $options: "i" };

    const trades = await Trade.find(query).sort({ createdAt: -1 });

    // userId, username, avatar 직접 넣은 걸 가공해서 author 필드 생성
    const tradesWithAuthor = trades.map((trade) => {
      const tradeObj = trade.toObject() as any;
      tradeObj.author = {
        username: tradeObj.username,
        avatar: tradeObj.avatar,
        discordId: tradeObj.userId,
      };
      delete tradeObj.username;
      delete tradeObj.avatar;
      delete tradeObj.userId;
      return tradeObj;
    });

    res.json(tradesWithAuthor);
  } catch (error) {
    console.error("[ERROR] 거래 목록 조회 실패:", error);
    res.status(500).json({ error: "서버 오류" });
  }
});


// ✅ 거래 등록 (인증 필요)
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { mapName, subMap, type, price, description } = req.body;
    const user = req.user;

    // 필수 항목 확인
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
      userId: user.id,
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

// ✅ 거래 상태 변경
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const trade = await Trade.findByIdAndUpdate(
      req.params.id,
      {
        status,
        isCompleted: status === "거래완료",
      },
      { new: true }
    );

    if (!trade) {
      return res.status(404).json({ error: "해당 거래를 찾을 수 없습니다." });
    }

    res.json(trade);
  } catch (error) {
    console.error("[ERROR] 거래 상태 변경 실패:", error);
    res.status(500).json({ error: "서버 오류" });
  }
});

// ✅ 거래 삭제
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

// ✅ 거래 신청 (1인 1건)
router.post("/:id/reserve", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "인증되지 않은 사용자입니다." });
    }
    const tradeId = req.params.id;

    // 나머지 로직 동일
    const existingReservation = await Trade.findOne({
      reservedBy: user.id,
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
    trade.reservedBy = user.id;
    await trade.save();

    res.json(trade);
  } catch (error) {
    console.error("[ERROR] 거래 신청 실패:", error);
    res.status(500).json({ error: "서버 오류" });
  }
});



export default router;

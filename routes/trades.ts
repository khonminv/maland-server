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

// ✅ 거래 전체 목록 조회
router.get("/", async (req, res) => {
  try {
    const { status, search } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (search) query.mapName = { $regex: search, $options: "i" };

    // userId 필드 populate해서 username, avatar, discordId 가져오기
    const trades = await Trade.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: "userId",
        select: "username avatar discordId",
      });

    // userId 필드를 author로 변경
    const tradesWithAuthor = trades.map((trade) => {
      const tradeObj = trade.toObject() as any; // 여기서 any로 단언
      tradeObj.author = tradeObj.userId;
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

export default router;

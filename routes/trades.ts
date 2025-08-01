// routes/trades.ts
import express from "express";
import Trade from "../models/Trade";
import { getAveragePrices } from "../controllers/tradeController";

const router = express.Router();

// ✅ 거래 완료 포함 평균 가격 (subMap 기준, 최근 2시간, 거래 완료만)
router.get("/average-prices-by-submap", async (req, res) => {
  console.log("[LOG] GET /trades/average-prices-by-submap 호출됨");
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const result = await Trade.aggregate([
      {
        $match: {
          isCompleted: true,
          createdAt: { $gte: twoHoursAgo },
          subMap: { $exists: true, $ne: "" }
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
    console.error(error);
    res.status(500).json({ error: "서버 오류" });
  }
});

// ✅ 거래 전체 목록 조회
router.get("/", async (req, res) => {
  const { status, search } = req.query;

  const query: any = {};
  if (status) query.status = status;
  if (search) query.mapName = { $regex: search, $options: "i" };

  const trades = await Trade.find(query).sort({ createdAt: -1 });
  res.json(trades);
});

// ✅ 거래 등록
router.post("/", async (req, res) => {
  try {
    const { mapName, subMap, type, price, description, userId } = req.body;

    if (!mapName || !subMap || !type || userId == null || price == null) {
      return res.status(400).json({ error: "필수 항목이 빠졌습니다." });
    }

    if (!["삽니다", "팝니다"].includes(type)) {
      return res.status(400).json({ error: "type 값이 올바르지 않습니다." });
    }

    const priceNum = Number(price);
    if (isNaN(priceNum)) {
      return res.status(400).json({ error: "가격이 숫자가 아닙니다." });
    }

    const newTrade = new Trade({
      mapName,
      subMap,
      type,
      price: priceNum,
      description: description || "",
      userId,
      status: "거래가능",
      isCompleted: false,
    });

    await newTrade.save();

    res.status(201).json(newTrade);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "서버 오류" });
  }
});




// ✅ 거래 상태 변경 (거래 완료 포함)
router.patch("/:id/status", async (req, res) => {
  const { status } = req.body;

  const trade = await Trade.findByIdAndUpdate(
    req.params.id,
    {
      status,
      isCompleted: status === "거래완료",
    },
    { new: true }
  );

  res.json(trade);
});

// ✅ 삭제
router.delete("/:id", async (req, res) => {
  await Trade.findByIdAndDelete(req.params.id);
  res.json({ message: "삭제됨" });
});

export default router;
